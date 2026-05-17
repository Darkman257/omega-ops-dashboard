-- Migration: Create Standardized Staff Code Engine and Atomic Counters
-- Target: public.staff_code_counters, public.next_staff_internal_code, and public.activate_recruitment_candidate
-- Purpose: Implement PROJECT-JOBROLE-SERIAL employee code policies.

-- 1. Create atomic counters table
CREATE TABLE IF NOT EXISTS public.staff_code_counters (
    code_prefix TEXT PRIMARY KEY,
    current_value INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure table is globally accessible without policy bypass issues
ALTER TABLE public.staff_code_counters DISABLE ROW LEVEL SECURITY;

-- 2. Create atomic serial generator function
CREATE OR REPLACE FUNCTION public.next_staff_internal_code(p_code_prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_val INTEGER;
BEGIN
    -- Atomically upsert/increment prefix counter
    INSERT INTO public.staff_code_counters (code_prefix, current_value, updated_at)
    VALUES (p_code_prefix, 1, now())
    ON CONFLICT (code_prefix)
    DO UPDATE SET 
        current_value = staff_code_counters.current_value + 1,
        updated_at = now()
    RETURNING current_value INTO v_new_val;

    -- Return formatted code, e.g. OB-TECH-ENG-001
    RETURN p_code_prefix || '-' || lpad(v_new_val::TEXT, 3, '0');
END;
$$;

-- Grant execution permissions
REVOKE ALL ON FUNCTION public.next_staff_internal_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_staff_internal_code(TEXT) TO service_role;

-- 3. Dynamically drop all existing overloaded signatures of activate_recruitment_candidate to avoid schema conflicts
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure AS func_sig
        FROM pg_proc
        WHERE proname = 'activate_recruitment_candidate'
          AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION ' || r.func_sig;
    END LOOP;
END $$;

-- 4. Define new transactional candidate activation engine supporting overrides
CREATE OR REPLACE FUNCTION public.activate_recruitment_candidate(
  p_queue_id UUID,
  p_reviewer_note TEXT DEFAULT NULL,
  p_overrides JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_queue_row RECORD;
  v_payload JSONB;
  v_full_name TEXT;
  v_phone_raw TEXT;
  v_phone_normalized TEXT;
  v_email TEXT;
  v_job_title TEXT;
  
  -- Project & Job Code Resolution
  v_project_code_raw TEXT;
  v_project_code TEXT;
  v_job_code_raw TEXT;
  v_job_code TEXT;
  v_code_prefix TEXT;
  
  v_internal_code TEXT;
  v_staff_id UUID;
  v_notes_block TEXT;
  v_existing_staff_count INT;
  v_collision_check BOOLEAN;
  v_collision_retries INT;
  v_error_msg TEXT;
  v_temp TEXT;
BEGIN
  -- 1. Read queue row from public.recruitment_onboarding_queue by ID
  SELECT * INTO v_queue_row
  FROM public.recruitment_onboarding_queue
  WHERE id = p_queue_id;

  -- Construct notes block dynamically for audit mapping
  IF v_queue_row.mapped_payload IS NOT NULL THEN
    v_notes_block := '--- RECRUITER NOTES ---' || chr(10) || COALESCE(v_queue_row.mapped_payload->>'notes', 'No recruiter notes.') || chr(10) || chr(10) ||
                     '--- PROFILE SUMMARY ---' || chr(10) || COALESCE(v_queue_row.mapped_payload->>'summary', 'No summary provided.') || chr(10) || chr(10) ||
                     '--- OMEGA ACTIVATION NOTE ---' || chr(10) || COALESCE(p_reviewer_note, 'No reviewer note added.');
  ELSE
    v_notes_block := '--- OMEGA ACTIVATION NOTE ---' || chr(10) || COALESCE(p_reviewer_note, 'No reviewer note added.');
  END IF;

  IF NOT FOUND THEN
    v_error_msg := 'Onboarding queue entry not found.';
    INSERT INTO public.staff_activation_audit_logs (queue_id, success, error_reason, reviewer_note)
    VALUES (p_queue_id, false, v_error_msg, v_notes_block);

    RETURN jsonb_build_object(
      'success', false,
      'staff_id', NULL,
      'internal_code', NULL,
      'error_reason', v_error_msg
    );
  END IF;

  -- 2. Require onboarding_status = 'pending_omega_review'
  IF v_queue_row.onboarding_status IS DISTINCT FROM 'pending_omega_review' THEN
    v_error_msg := 'Candidate is not in pending_omega_review status. Current status: ' || COALESCE(v_queue_row.onboarding_status, 'NULL');
    INSERT INTO public.staff_activation_audit_logs (queue_id, success, error_reason, reviewer_note)
    VALUES (p_queue_id, false, v_error_msg, v_notes_block);

    RETURN jsonb_build_object(
      'success', false,
      'staff_id', NULL,
      'internal_code', NULL,
      'error_reason', v_error_msg
    );
  END IF;

  -- 3. Duplicate protection: block if candidate is already approved or has omega_staff_id linked
  IF v_queue_row.is_approved = true OR v_queue_row.omega_staff_id IS NOT NULL THEN
    v_error_msg := 'This candidate has already been approved and activated.';
    INSERT INTO public.staff_activation_audit_logs (queue_id, success, error_reason, reviewer_note)
    VALUES (p_queue_id, false, v_error_msg, v_notes_block);

    RETURN jsonb_build_object(
      'success', false,
      'staff_id', NULL,
      'internal_code', NULL,
      'error_reason', v_error_msg
    );
  END IF;

  -- 4. Read mapped_payload JSONB
  v_payload := v_queue_row.mapped_payload;
  IF v_payload IS NULL THEN
    v_error_msg := 'Candidate payload snapshot is empty.';
    INSERT INTO public.staff_activation_audit_logs (queue_id, success, error_reason, reviewer_note)
    VALUES (p_queue_id, false, v_error_msg, v_notes_block);

    RETURN jsonb_build_object(
      'success', false,
      'staff_id', NULL,
      'internal_code', NULL,
      'error_reason', v_error_msg
    );
  END IF;

  -- 5. Resolve and normalize PROJECT CODE
  v_project_code_raw := COALESCE(
    p_overrides->>'project_code',
    v_payload->>'project_code',
    v_payload->>'project',
    v_payload->>'current_site',
    v_payload->>'site',
    v_payload->>'assigned_project'
  );

  v_project_code := NULL;
  IF v_project_code_raw IS NOT NULL THEN
    v_temp := trim(lower(v_project_code_raw));
    IF v_temp = 'ob' OR v_temp LIKE '%obsidir%' THEN
      v_project_code := 'OB';
    ELSIF v_temp = 'll' OR v_temp LIKE '%lagoon%' THEN
      v_project_code := 'LL';
    ELSIF v_temp = 'lr' OR v_temp LIKE '%residence%' THEN
      v_project_code := 'LR';
    ELSIF v_temp = 'mva' OR v_temp LIKE '%movenpick%' OR v_temp LIKE '%aswan%' THEN
      v_project_code := 'MVA';
    END IF;
  END IF;

  IF v_project_code IS NULL THEN
    v_error_msg := 'Missing project code for staff internal_code generation';
    INSERT INTO public.staff_activation_audit_logs (queue_id, success, error_reason, reviewer_note)
    VALUES (p_queue_id, false, v_error_msg, v_notes_block);

    RETURN jsonb_build_object(
      'success', false,
      'staff_id', NULL,
      'internal_code', NULL,
      'error_reason', v_error_msg
    );
  END IF;

  -- 6. Resolve and normalize JOB CODE
  v_job_code_raw := COALESCE(
    p_overrides->>'job_code',
    v_payload->>'job_code',
    v_payload->>'job_title',
    v_payload->>'position'
  );

  v_job_code := NULL;
  IF v_job_code_raw IS NOT NULL THEN
    v_temp := trim(lower(v_job_code_raw));
    
    IF v_temp = 'pm-mgr' THEN v_job_code := 'PM-MGR';
    ELSIF v_temp = 'cm-mgr' THEN v_job_code := 'CM-MGR';
    ELSIF v_temp = 'exec-mgr' THEN v_job_code := 'EXEC-MGR';
    ELSIF v_temp = 'exec-eng' THEN v_job_code := 'EXEC-ENG';
    ELSIF v_temp = 'civil-eng' THEN v_job_code := 'CIVIL-ENG';
    ELSIF v_temp = 'tech-mgr' THEN v_job_code := 'TECH-MGR';
    ELSIF v_temp = 'tech-eng' THEN v_job_code := 'TECH-ENG';
    ELSIF v_temp = 'qs-eng' THEN v_job_code := 'QS-ENG';
    ELSIF v_temp = 'plan-eng' THEN v_job_code := 'PLAN-ENG';
    ELSIF v_temp = 'hse-mgr' THEN v_job_code := 'HSE-MGR';
    ELSIF v_temp = 'hse-sup' THEN v_job_code := 'HSE-SUP';
    ELSIF v_temp = 'arch-eng' THEN v_job_code := 'ARCH-ENG';
    ELSIF v_temp = 'mep-eng' THEN v_job_code := 'MEP-ENG';
    ELSIF v_temp = 'admin' THEN v_job_code := 'ADMIN';
    ELSIF v_temp = 'acc' THEN v_job_code := 'ACC';
    ELSIF v_temp = 'store' THEN v_job_code := 'STORE';
    ELSIF v_temp = 'survey' THEN v_job_code := 'SURVEY';
    ELSIF v_temp = 'foreman' THEN v_job_code := 'FOREMAN';
    ELSIF v_temp = 'driver' THEN v_job_code := 'DRIVER';
    ELSIF v_temp = 'watchman' THEN v_job_code := 'WATCHMAN';
    
    -- Arabic/English string mapping fallback
    ELSIF v_temp LIKE '%project manager%' OR v_temp LIKE '%مدير مشروع%' THEN v_job_code := 'PM-MGR';
    ELSIF v_temp LIKE '%construction manager%' OR v_temp LIKE '%مدير إنشاءات%' OR v_temp LIKE '%مدير انشاءات%' THEN v_job_code := 'CM-MGR';
    ELSIF v_temp LIKE '%site manager%' OR v_temp LIKE '%execution manager%' OR v_temp LIKE '%مدير تنفيذ%' OR v_temp LIKE '%مدير موقع%' THEN v_job_code := 'EXEC-MGR';
    ELSIF v_temp LIKE '%execution engineer%' OR v_temp LIKE '%مهندس تنفيذ%' THEN v_job_code := 'EXEC-ENG';
    ELSIF v_temp LIKE '%civil engineer%' OR v_temp LIKE '%مهندس مدني%' OR v_temp LIKE '%مهندس مدنى%' THEN v_job_code := 'CIVIL-ENG';
    ELSIF v_temp LIKE '%technical office manager%' OR v_temp LIKE '%مدير مكتب فني%' OR v_temp LIKE '%مدير مكتب فنى%' THEN v_job_code := 'TECH-MGR';
    ELSIF v_temp LIKE '%technical office engineer%' OR v_temp LIKE '%مهندس مكتب فني%' OR v_temp LIKE '%مهندس مكتب فنى%' THEN v_job_code := 'TECH-ENG';
    ELSIF v_temp LIKE '%qs engineer%' OR v_temp LIKE '%مهندس حصر%' OR v_temp LIKE '%كميات%' THEN v_job_code := 'QS-ENG';
    ELSIF v_temp LIKE '%planning engineer%' OR v_temp LIKE '%مهندس تخطيط%' THEN v_job_code := 'PLAN-ENG';
    ELSIF v_temp LIKE '%hse manager%' OR v_temp LIKE '%مدير سلامة%' OR v_temp LIKE '%مدير سلامه%' THEN v_job_code := 'HSE-MGR';
    ELSIF v_temp LIKE '%hse supervisor%' OR v_temp LIKE '%مشرف سلامة%' OR v_temp LIKE '%مشرف سلامه%' THEN v_job_code := 'HSE-SUP';
    ELSIF v_temp LIKE '%architect%' OR v_temp LIKE '%معماري%' OR v_temp LIKE '%معmarى%' THEN v_job_code := 'ARCH-ENG';
    ELSIF v_temp LIKE '%mep%' OR v_temp LIKE '%ميكانيكا%' OR v_temp LIKE '%كهرباء%' THEN v_job_code := 'MEP-ENG';
    ELSIF v_temp LIKE '%admin%' OR v_temp LIKE '%إداري%' OR v_temp LIKE '%اداري%' THEN v_job_code := 'ADMIN';
    ELSIF v_temp LIKE '%accountant%' OR v_temp LIKE '%محاسب%' THEN v_job_code := 'ACC';
    ELSIF v_temp LIKE '%store%' OR v_temp LIKE '%أمين مخزن%' OR v_temp LIKE '%امين مخزن%' THEN v_job_code := 'STORE';
    ELSIF v_temp LIKE '%survey%' OR v_temp LIKE '%مساح%' THEN v_job_code := 'SURVEY';
    ELSIF v_temp LIKE '%foreman%' OR v_temp LIKE '%فورمان%' OR v_temp LIKE '%مشرف عمال%' THEN v_job_code := 'FOREMAN';
    ELSIF v_temp LIKE '%driver%' OR v_temp LIKE '%سائق%' THEN v_job_code := 'DRIVER';
    ELSIF v_temp LIKE '%watchman%' OR v_temp LIKE '%security%' OR v_temp LIKE '%أمن%' OR v_temp LIKE '%امن%' OR v_temp LIKE '%حراسة%' OR v_temp LIKE '%حراسه%' THEN v_job_code := 'WATCHMAN';
    END IF;
  END IF;

  IF v_job_code IS NULL THEN
    v_error_msg := 'Missing or unsupported job code for staff internal_code generation';
    INSERT INTO public.staff_activation_audit_logs (queue_id, success, error_reason, reviewer_note)
    VALUES (p_queue_id, false, v_error_msg, v_notes_block);

    RETURN jsonb_build_object(
      'success', false,
      'staff_id', NULL,
      'internal_code', NULL,
      'error_reason', v_error_msg
    );
  END IF;

  -- Extract and validate required payload fields
  v_full_name := trim(v_payload->>'full_name');
  v_phone_raw := trim(v_payload->>'phone');

  IF v_full_name IS NULL OR v_full_name = '' THEN
    v_error_msg := 'Missing mandatory payload field: full_name.';
    INSERT INTO public.staff_activation_audit_logs (queue_id, success, error_reason, reviewer_note)
    VALUES (p_queue_id, false, v_error_msg, v_notes_block);

    RETURN jsonb_build_object(
      'success', false,
      'staff_id', NULL,
      'internal_code', NULL,
      'error_reason', v_error_msg
    );
  END IF;

  IF v_phone_raw IS NULL OR v_phone_raw = '' THEN
    v_error_msg := 'Missing mandatory payload field: phone.';
    INSERT INTO public.staff_activation_audit_logs (queue_id, success, error_reason, reviewer_note)
    VALUES (p_queue_id, false, v_error_msg, v_notes_block);

    RETURN jsonb_build_object(
      'success', false,
      'staff_id', NULL,
      'internal_code', NULL,
      'error_reason', v_error_msg
    );
  END IF;

  -- 7. Phone Normalization (Egyptian mobile standards)
  v_phone_normalized := regexp_replace(v_phone_raw, '[\s\-\+]', '', 'g');
  IF length(v_phone_normalized) = 11 AND v_phone_normalized LIKE '01%' THEN
    v_phone_normalized := '20' || right(v_phone_normalized, 10);
  END IF;

  -- 8. Duplicate Protection: Check against active staff by normalized phone
  SELECT count(*) INTO v_existing_staff_count
  FROM public.staff
  WHERE (
    CASE 
      WHEN length(regexp_replace(phone, '[\s\-\+]', '', 'g')) = 11 AND regexp_replace(phone, '[\s\-\+]', '', 'g') LIKE '01%' 
        THEN '20' || right(regexp_replace(phone, '[\s\-\+]', '', 'g'), 10)
      ELSE regexp_replace(phone, '[\s\-\+]', '', 'g')
    END = v_phone_normalized
  ) AND (lower(status) = 'active' OR status = 'Active');

  IF v_existing_staff_count > 0 THEN
    v_error_msg := 'A staff record with this phone number already exists and is active.';
    INSERT INTO public.staff_activation_audit_logs (queue_id, success, error_reason, reviewer_note)
    VALUES (p_queue_id, false, v_error_msg, v_notes_block);

    RETURN jsonb_build_object(
      'success', false,
      'staff_id', NULL,
      'internal_code', NULL,
      'error_reason', v_error_msg
    );
  END IF;

  -- 9. Standardized Collision-Safe Employee Code Generation
  v_code_prefix := v_project_code || '-' || v_job_code;
  
  v_collision_check := true;
  v_collision_retries := 0;
  WHILE v_collision_check LOOP
    v_internal_code := public.next_staff_internal_code(v_code_prefix);
    
    -- Verify uniqueness inside staff table
    SELECT EXISTS (
      SELECT 1 FROM public.staff WHERE internal_code = v_internal_code
    ) INTO v_collision_check;
    
    IF v_collision_check THEN
      v_collision_retries := v_collision_retries + 1;
      IF v_collision_retries >= 5 THEN
        v_error_msg := 'Internal code collision limit reached. Please check the counters table.';
        INSERT INTO public.staff_activation_audit_logs (queue_id, success, error_reason, reviewer_note)
        VALUES (p_queue_id, false, v_error_msg, v_notes_block);

        RETURN jsonb_build_object(
          'success', false,
          'staff_id', NULL,
          'internal_code', NULL,
          'error_reason', v_error_msg
        );
      END IF;
    END IF;
  END LOOP;

  v_email := trim(v_payload->>'email');
  v_job_title := COALESCE(p_overrides->>'job_title', v_payload->>'job_title', v_payload->>'position');

  -- 10. Insert into public.staff
  INSERT INTO public.staff (
    full_name,
    phone,
    email,
    job_title,
    department,
    status,
    lifecycle_status,
    clearance_status,
    basic_salary,
    site_allowance,
    current_site,
    internal_code,
    insurance_status,
    hire_date
  ) VALUES (
    v_full_name,
    v_phone_normalized,
    COALESCE(v_email, ''),
    v_job_title,
    COALESCE(v_payload->>'source', 'Recruitment Intake'),
    'Active',
    'onboarding',
    'pending',
    0,
    0,
    v_project_code, -- Map normalized project code as active site
    v_internal_code,
    'Not Set',
    current_date
  )
  RETURNING id INTO v_staff_id;

  -- 11. Update recruitment_onboarding_queue promotion details
  UPDATE public.recruitment_onboarding_queue
  SET
    onboarding_status = 'approved',
    is_approved = true,
    approved_at = now(),
    omega_staff_id = v_staff_id
  WHERE id = p_queue_id;

  -- 12. Insert success audit log record
  INSERT INTO public.staff_activation_audit_logs (queue_id, staff_id, internal_code, success, error_reason, reviewer_note)
  VALUES (p_queue_id, v_staff_id, v_internal_code, true, NULL, v_notes_block);

  -- 13. Return JSONB success payload
  RETURN jsonb_build_object(
    'success', true,
    'staff_id', v_staff_id,
    'internal_code', v_internal_code,
    'error_reason', NULL
  );

EXCEPTION
  WHEN OTHERS THEN
    v_error_msg := SQLERRM;
    INSERT INTO public.staff_activation_audit_logs (queue_id, success, error_reason, reviewer_note)
    VALUES (p_queue_id, false, v_error_msg, v_notes_block);

    RETURN jsonb_build_object(
      'success', false,
      'staff_id', NULL,
      'internal_code', NULL,
      'error_reason', v_error_msg
    );
END;
$$;

-- Revoke all direct client/public execution privileges to protect structural keys
REVOKE ALL ON FUNCTION public.activate_recruitment_candidate(UUID, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_recruitment_candidate(UUID, TEXT, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.activate_recruitment_candidate(UUID, TEXT, JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.activate_recruitment_candidate(UUID, TEXT, JSONB) TO service_role;

COMMENT ON FUNCTION public.activate_recruitment_candidate(UUID, TEXT, JSONB) IS 
'NEXUS Personnel Activation Engine with Project-Role Code support. Access restricted strictly to service_role.';
