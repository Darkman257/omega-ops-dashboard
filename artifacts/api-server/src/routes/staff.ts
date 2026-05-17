// @ts-nocheck
import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth.js";
import { createClient } from "@supabase/supabase-js";

const router = Router();

router.post("/activate", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { queueId, reviewerNote } = req.body;

    // 1. Structural UUID Validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!queueId || !uuidRegex.test(queueId)) {
      return res.status(400).json({
        success: false,
        staff_id: null,
        internal_code: null,
        error_reason: "Invalid or missing queueId parameter. Must be a valid UUID."
      });
    }

    const reviewerNoteSanitized = reviewerNote ? String(reviewerNote).trim() : null;

    // 2. Robust E2E Production RBAC: Verify email against explicit allowed list env variable
    const email = req.user?.email || "";
    const allowedEmailsEnv = process.env.STAFF_ACTIVATION_ALLOWED_EMAILS || "";

    // Parse allowed emails (comma-separated, trimmed, case-insensitive)
    const allowedEmails = allowedEmailsEnv
      .split(",")
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    if (allowedEmails.length === 0) {
      return res.status(403).json({
        success: false,
        staff_id: null,
        internal_code: null,
        error_reason: "Forbidden: No authorized reviewer emails are configured on this server."
      });
    }

    const isExplicitlyAllowed = allowedEmails.includes(email.toLowerCase());

    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let isDbApproved = false;
    
    try {
      const { data: staffMember } = await supabase
        .from("staff")
        .select("id, status, job_title")
        .eq("email", email)
        .maybeSingle();

      if (staffMember && (staffMember.status === "Active" || staffMember.status === "active")) {
        isDbApproved = true;
      }
    } catch (err) {
      // Defensively fallback if table is missing or query fails
      isDbApproved = false;
    }

    // Must be explicitly listed in allowed reviewer list AND exist as an active personnel staff member
    const isAuthorized = isExplicitlyAllowed && isDbApproved;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        staff_id: null,
        internal_code: null,
        error_reason: `Forbidden: User ${email} is not in the explicit allowed activation list or is not an active staff member.`
      });
    }

    // 3. Invoke secure RPC using high-privilege service_role client
    const { data, error } = await supabase.rpc("activate_recruitment_candidate", {
      p_queue_id: queueId,
      p_reviewer_note: reviewerNoteSanitized
    });

    if (error) {
      return res.status(500).json({
        success: false,
        staff_id: null,
        internal_code: null,
        error_reason: error.message
      });
    }

    // Normalized transaction response matching engine signature
    const result = typeof data === "string" ? JSON.parse(data) : data;
    
    return res.status(200).json({
      success: result?.success || false,
      staff_id: result?.staff_id || null,
      internal_code: result?.internal_code || null,
      error_reason: result?.error_reason || null
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      staff_id: null,
      internal_code: null,
      error_reason: err?.message || "Internal server error during staff activation."
    });
  }
});

export default router;
