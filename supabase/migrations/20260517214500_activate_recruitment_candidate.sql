-- Migration: Create Staff Activation Engine RPC (Secured)
-- Target: public.activate_recruitment_candidate(p_queue_id uuid, p_reviewer_note text default null)
-- Purpose: Controlled, human-approved activation of candidates from recruitment_onboarding_queue to staff.
-- Security: Service role proxy gate. Client-side browser execution is completely blocked.

-- 1. Create audit log table to record personnel promotion telemetry
CREATE TABLE IF NOT EXISTS public.staff_activation_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID,
  staff_id UUID,
  internal_code TEXT,
  action TEXT DEFAULT 'ACTIVATE',
  success BOOLEAN,
  error_reason TEXT,
  reviewer_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create structural sequence for staff internal code generation
CREATE SEQUENCE IF NOT EXISTS public.staff_internal_code_seq START WITH 10001;

-- Align the sequence with the highest existing internal_code matching 'NX-[number]'
DO $$
DECLARE
  v_max_code INT;
BEGIN
  -- Parse numeric part from 'NX-[0-9]+' format internal_code
  SELECT MAX(substring(internal_code from '^NX-([0-9]+)$')::integer)
  INTO v_max_code
  FROM public.staff
  WHERE internal_code ~ '^NX-[0-9]+$';

  -- Set the sequence value to at least max(existing number, 10000)
  -- nextval will then return at least 10001 or max+1
  IF v_max_code IS NOT NULL AND v_max_code >= 10000 THEN
    PERFORM setval('public.staff_internal_code_seq', v_max_code);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Defensively ignore errors in parsing or missing tables/columns during clean migrations
    NULL;
END $$;

-- 3. Define transactional personnel activation engine
CREATE OR REPLACE FUNCTION public.activate_recruitment_candidate(
  p_queue_id UUID,
  p_reviewer_note TEXT DEFAULT NULL
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
  v_internal_code TEXT;
  v_staff_id UUID;
  v_notes_block TEXT;
  v_existing_staff_count INT;
  v_collision_check BOOLEAN;
  v_collision_retries INT;
  v_error_msg TEXT;
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

  -- Extract and validate required payload fields
  v_full_name := trim(v_payload->>'full_name');
  v_phone_raw := trim(v_payload->>'phone');
  v_job_title := trim(v_payload->>'job_title');

  -- Fallback for job_title to position
  IF v_job_title IS NULL OR v_job_title = '' THEN
    v_job_title := trim(v_payload->>'position');
  END IF;

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

  IF v_job_title IS NULL OR v_job_title = '' THEN
    v_error_msg := 'Missing mandatory payload field: job_title.';
    INSERT INTO public.staff_activation_audit_logs (queue_id, success, error_reason, reviewer_note)
    VALUES (p_queue_id, false, v_error_msg, v_notes_block);

    RETURN jsonb_build_object(
      'success', false,
      'staff_id', NULL,
      'internal_code', NULL,
      'error_reason', v_error_msg
    );
  END IF;

  -- 5. Phone Normalization (Egyptian mobile standards)
  -- Remove spaces, hyphens, and plus signs
  v_phone_normalized := regexp_replace(v_phone_raw, '[\s\-\+]', '', 'g');

  -- Normalize local '01...' (11 digits) to international '201...' (12 digits)
  IF length(v_phone_normalized) = 11 AND v_phone_normalized LIKE '01%' THEN
    v_phone_normalized := '20' || right(v_phone_normalized, 10);
  END IF;

  -- 6. Duplicate Protection: Check against active staff by normalized phone
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

  -- 7. Secure Collision-Safe Internal Code Generation
  v_collision_check := true;
  v_collision_retries := 0;
  WHILE v_collision_check LOOP
    v_internal_code := 'NX-' || to_char(nextval('public.staff_internal_code_seq'), 'FM00000');
    
    -- Verify uniqueness inside staff table
    SELECT EXISTS (
      SELECT 1 FROM public.staff WHERE internal_code = v_internal_code
    ) INTO v_collision_check;
    
    IF v_collision_check THEN
      v_collision_retries := v_collision_retries + 1;
      IF v_collision_retries >= 5 THEN
        v_error_msg := 'Internal code collision limit reached. Please check the sequence values.';
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

  -- 9. Insert into public.staff with strict operational casing and defaults (excluding notes and passport date columns)
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
    'Active', -- Strict casing 'Active' required by UI models
    'onboarding',
    'pending',
    0,
    0,
    '',
    v_internal_code,
    'Not Set',
    current_date
  )
  RETURNING id INTO v_staff_id;

  -- 10. Update recruitment_onboarding_queue promotion details
  UPDATE public.recruitment_onboarding_queue
  SET
    onboarding_status = 'approved',
    is_approved = true,
    approved_at = now(),
    omega_staff_id = v_staff_id
  WHERE id = p_queue_id;

  -- 11. Insert success audit log record with the unified notes block
  INSERT INTO public.staff_activation_audit_logs (queue_id, staff_id, internal_code, success, error_reason, reviewer_note)
  VALUES (p_queue_id, v_staff_id, v_internal_code, true, NULL, v_notes_block);

  -- 12. Return JSONB representation of successfully promoted candidate
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

-- 4. Security Permissions Gate
-- Revoke all direct client/public execution privileges to protect structural keys
REVOKE ALL ON FUNCTION public.activate_recruitment_candidate(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_recruitment_candidate(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.activate_recruitment_candidate(UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.activate_recruitment_candidate(UUID, TEXT) TO service_role;

COMMENT ON FUNCTION public.activate_recruitment_candidate(UUID, TEXT) IS 
'NEXUS Personnel Activation Engine. Access restricted strictly to service_role. Frontend applications MUST execute this RPC via a secure server-side proxy, Edge Function, or automated middleware (such as n8n workflow). Directly triggering from the client browser is forbidden for regulatory compliance.';
