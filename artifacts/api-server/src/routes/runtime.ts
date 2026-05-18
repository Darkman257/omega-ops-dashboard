// @ts-nocheck
import { Router, Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const getSupabase = () => {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase credentials not configured on server.");
  return createClient(url, key);
};

const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentKeyEnv = process.env.NEXUS_INTERNAL_AGENT_KEY;
    if (!agentKeyEnv) {
      return res.status(500).json({ error: "NEXUS_INTERNAL_AGENT_KEY is not configured on the server." });
    }
    const headerKey = req.headers["x-agent-key"] || req.headers["authorization"]?.replace("Bearer ", "");
    if (headerKey === agentKeyEnv) return next();

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const supabase = getSupabase();
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) return next();
      }
    }
    return res.status(401).json({ error: "Unauthorized: Invalid or missing authorization." });
  } catch (err: any) {
    return res.status(401).json({ error: "Unauthorized: Token verification failed." });
  }
};

router.use(checkAuth);

interface RuntimeEvent {
  id: string;
  timestamp: string;
  source: string;
  module: string;
  event_type: string;
  title: string;
  description: string;
  entity_type: string;
  entity_id: string;
  actor: string;
  severity: "info" | "warning" | "critical" | "resolved";
  status?: string;
  metadata?: any;
}

const fetchNormalizedEvents = async (): Promise<RuntimeEvent[]> => {
  const supabase = getSupabase();
  const events: RuntimeEvent[] = [];

  const safePromise = async (promise: Promise<any>, fallbackValue: any = []) => {
    try {
      const res = await promise;
      if (res.error) throw res.error;
      return res.data || fallbackValue;
    } catch (e) {
      console.warn("Telemetry aggregator skip table: ", e);
      return fallbackValue;
    }
  };

  const [
    onboarding,
    staff,
    vehicles,
    assignments,
    tasks,
    clearance,
    policyEvents,
    activationLogs,
    telegramTasks
  ] = await Promise.all([
    safePromise(supabase.from("recruitment_onboarding_queue").select("*").order("created_at", { ascending: false }).limit(20)),
    safePromise(supabase.from("staff").select("*").order("created_at", { ascending: false }).limit(20)),
    safePromise(supabase.from("vehicles").select("*").order("created_at", { ascending: false }).limit(20)),
    safePromise(supabase.from("housing_assignments").select("*").limit(30)),
    safePromise(supabase.from("site_admin_tasks").select("*").order("created_at", { ascending: false }).limit(25)),
    safePromise(supabase.from("employee_clearance_items").select("*").order("created_at", { ascending: false }).limit(25)),
    safePromise(supabase.from("company_policy_runtime_events").select("*").order("created_at", { ascending: false }).limit(30)),
    safePromise(supabase.from("staff_activation_audit_logs").select("*").order("created_at", { ascending: false }).limit(20)),
    safePromise(supabase.from("nexus_tasks").select("*").order("created_at", { ascending: false }).limit(25))
  ]);

  // Normalize recruitment queue
  for (const q of onboarding) {
    const payload = q.mapped_payload || {};
    events.push({
      id: `evt-rec-${q.id}`,
      timestamp: q.created_at || new Date().toISOString(),
      source: "Recruitment",
      module: "Recruitment",
      event_type: "onboarding_queued",
      title: "Candidate Queued for Onboarding",
      description: `${payload.full_name || "Unknown Candidate"} mapped for role: ${payload.job_title || "N/A"}. Status: ${q.onboarding_status}`,
      entity_type: "recruitment_onboarding_queue",
      entity_id: q.id,
      actor: "Recruitment Gateway",
      severity: q.onboarding_status === "pending_omega_review" ? "warning" : "info",
      status: q.onboarding_status,
      metadata: q
    });
  }

  // Normalize staff
  for (const s of staff) {
    events.push({
      id: `evt-stf-${s.id}`,
      timestamp: s.created_at || new Date().toISOString(),
      source: "Staff Management",
      module: "Staff",
      event_type: "staff_status",
      title: `Staff File: ${s.full_name}`,
      description: `Job Code: ${s.internal_code} | Role: ${s.job_title} | Department: ${s.department} | Status: ${s.lifecycle_status || s.status}`,
      entity_type: "staff",
      entity_id: s.id,
      actor: "HR System",
      severity: s.lifecycle_status === "offboarding" ? "warning" : "info",
      status: s.status,
      metadata: s
    });
  }

  // Normalize vehicles
  for (const v of vehicles) {
    events.push({
      id: `evt-veh-${v.id}`,
      timestamp: v.created_at || new Date().toISOString(),
      source: "Fleet Management",
      module: "Fleet",
      event_type: "vehicle_assigned",
      title: `Ecosystem Vehicle Ready: ${v.plate_number}`,
      description: `Unit: ${v.car_name} | Assigned Driver: ${v.driver || "Unassigned"} | Route: ${v.route_name || "Not set"} | Status: ${v.status}`,
      entity_type: "vehicles",
      entity_id: v.id,
      actor: "Fleet Telematics",
      severity: v.driver ? "info" : "warning",
      status: v.status,
      metadata: v
    });
  }

  // Normalize housing assignments
  for (const a of assignments) {
    events.push({
      id: `evt-hsg-${a.id}`,
      timestamp: a.created_at || new Date().toISOString(),
      source: "Housing System",
      module: "Housing",
      event_type: "housing_assigned",
      title: `Housing Occupancy Shift: ${a.employee_name}`,
      description: `Employee Code: ${a.employee_code} | Housing Unit ID: ${a.housing_unit_id} | State: ${a.assignment_status}`,
      entity_type: "housing_assignments",
      entity_id: a.id,
      actor: "Facilities Management",
      severity: "info",
      status: a.assignment_status,
      metadata: a
    });
  }

  // Normalize site admin tasks
  for (const t of tasks) {
    events.push({
      id: `evt-tsk-${t.id}`,
      timestamp: t.created_at || new Date().toISOString(),
      source: "Field Operations",
      module: "Tasks",
      event_type: "task_updated",
      title: `Operational Task: ${t.task_title}`,
      description: `Category: ${t.task_category} | Priority: ${t.priority} | State: ${t.status}`,
      entity_type: "site_admin_tasks",
      entity_id: t.id,
      actor: t.assigned_to || "Admin",
      severity: t.status === "done" ? "resolved" : t.priority === "critical" ? "critical" : t.priority === "high" ? "warning" : "info",
      status: t.status,
      metadata: t
    });
  }

  // Normalize clearance
  for (const c of clearance) {
    events.push({
      id: `evt-clr-${c.id}`,
      timestamp: c.created_at || new Date().toISOString(),
      source: "Clearance Engine",
      module: "Clearance",
      event_type: "clearance_updated",
      title: `Personnel Offboarding Clearance: ${c.item_title}`,
      description: `Staff ID: ${c.staff_id} | Category: ${c.department} | Status: ${c.status} | Note: ${c.notes || "None"}`,
      entity_type: "employee_clearance_items",
      entity_id: c.id,
      actor: c.reviewer_name || "System Validator",
      severity: c.status === "blocked" ? "critical" : c.status === "cleared" ? "resolved" : "warning",
      status: c.status,
      metadata: c
    });
  }

  // Normalize policy engine events
  for (const p of policyEvents) {
    events.push({
      id: `evt-plc-${p.id}`,
      timestamp: p.created_at || new Date().toISOString(),
      source: "Compliance Guardrails",
      module: "Compliance",
      event_type: p.event_type || "policy_triggered",
      title: `Policy Audit: ${p.event_code}`,
      description: p.message_ar || `Compliance telemetry trigger for entity type: ${p.entity_type}`,
      entity_type: p.entity_type || "policy",
      entity_id: p.entity_id || p.id,
      actor: "Egyptian Labor Guardrail",
      severity: p.severity === "critical" ? "critical" : p.severity === "warning" ? "warning" : "info",
      status: p.decision,
      metadata: p
    });
  }

  // Normalize activation logs
  for (const al of activationLogs) {
    events.push({
      id: `evt-act-${al.id}`,
      timestamp: al.created_at || new Date().toISOString(),
      source: "Activation Controller",
      module: "Recruitment",
      event_type: "staff_activation",
      title: `Personnel Activated: ${al.internal_code}`,
      description: `Action: ${al.action} | Result: ${al.success ? "SUCCESS" : "FAILED"} | Error Note: ${al.error_reason || "None"}`,
      entity_type: "staff_activation_audit_logs",
      entity_id: al.id,
      actor: "Activation Engine",
      severity: al.success ? "resolved" : "critical",
      status: al.success ? "Success" : "Failed",
      metadata: al
    });
  }

  // Normalize Telegram tasks
  for (const tt of telegramTasks) {
    events.push({
      id: `evt-tel-${tt.id}`,
      timestamp: tt.created_at || new Date().toISOString(),
      source: "Telegram Sync",
      module: "Telegram",
      event_type: "telegram_task",
      title: `Telegram Command: ${tt.title}`,
      description: `Input: ${tt.description || "N/A"} | Origin: ${tt.owner_name || "Telegram User"} | Priority: ${tt.priority} | Status: ${tt.status}`,
      entity_type: "nexus_tasks",
      entity_id: tt.id,
      actor: tt.owner_name || "Telegram Agent",
      severity: tt.status === "done" ? "resolved" : tt.priority === "high" || tt.priority === "critical" ? "warning" : "info",
      status: tt.status,
      metadata: tt
    });
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// GET /api/runtime/events - Aggregated list
router.get("/events", async (req: Request, res: Response) => {
  try {
    const list = await fetchNormalizedEvents();
    return res.status(200).json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// GET /api/runtime/events/search?q= - Search events
router.get("/events/search", async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || "").toLowerCase().trim();
    const list = await fetchNormalizedEvents();
    if (!q) return res.status(200).json(list);

    const filtered = list.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.source.toLowerCase().includes(q) ||
      e.module.toLowerCase().includes(q)
    );
    return res.status(200).json(filtered);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// GET /api/runtime/ask?q= - Deterministic intelligence query
router.get("/ask", async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || "").toLowerCase().trim();
    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required." });
    }

    const list = await fetchNormalizedEvents();
    let summaryEn = "";
    let summaryAr = "";
    let matchedModules: string[] = [];
    let relatedEvents: RuntimeEvent[] = [];
    let recommendedNextAction = "";

    const supabase = getSupabase();

    if (q.includes("onboarding") || q.includes("recruit")) {
      const { data } = await supabase.from("recruitment_onboarding_queue").select("id,onboarding_status");
      const pendingCount = (data || []).filter(item => item.onboarding_status === "pending_omega_review").length;
      summaryEn = `Onboarding analytics report: ${pendingCount} candidate files are actively pending administrative promotion checks under Omega governance.`;
      summaryAr = `تقرير تحليلات التوظيف: يوجد حالياً ${pendingCount} ملفات مرشحين بانتظار مراجعة الترقية الإدارية تحت إشراف أوميجا.`;
      matchedModules = ["Recruitment"];
      relatedEvents = list.filter(e => e.module === "Recruitment").slice(0, 10);
      recommendedNextAction = pendingCount > 0
        ? `Review the ${pendingCount} pending files in the Recruitment Onboarding drawer and execute standardized HR promotions.`
        : "Recruitment queue is synchronized. No immediate personnel reviews are required.";
    }
    else if (q.includes("staff") || q.includes("employ") || q.includes("workforce")) {
      const { data } = await supabase.from("staff").select("id,status,lifecycle_status");
      const activeCount = (data || []).filter(item => item.status === "Active").length;
      const offboardingCount = (data || []).filter(item => item.lifecycle_status === "offboarding").length;
      summaryEn = `Ecosystem personnel telemetry: ${activeCount} active labor files deployed, with ${offboardingCount} personnel currently in offboarding clearance stages.`;
      summaryAr = `إحصاءات القوة العاملة: تم نشر ${activeCount} ملف موظف نشط، مع وجود ${offboardingCount} من الكوادر حالياً في مراحل تصفية نهاية الخدمة.`;
      matchedModules = ["Staff", "Clearance"];
      relatedEvents = list.filter(e => e.module === "Staff" || e.module === "Clearance").slice(0, 10);
      recommendedNextAction = offboardingCount > 0
        ? `Verify offboarding clearance checklists for the ${offboardingCount} employees currently exiting field operations.`
        : "Operational workforce metrics indicate stable deployment and personnel assignments.";
    }
    else if (q.includes("fleet") || q.includes("car") || q.includes("vehicle")) {
      const { data } = await supabase.from("vehicles").select("id,driver,status");
      const totalVehicles = (data || []).length;
      const activeVehicles = (data || []).filter(v => v.status === "Active" || v.status === "active").length;
      const unassignedCount = (data || []).filter(v => !v.driver).length;
      summaryEn = `Logistics fleet telemetry: Ecosystem logs record ${totalVehicles} total vehicles (${activeVehicles} active). Warning: ${unassignedCount} units are unassigned.`;
      summaryAr = `تحليلات أسطول العمليات: تسجل السجلات إجمالي ${totalVehicles} مركبة (${activeVehicles} نشطة). تنبيه: يوجد ${unassignedCount} مركبة بدون سائق معين.`;
      matchedModules = ["Fleet"];
      relatedEvents = list.filter(e => e.module === "Fleet").slice(0, 10);
      recommendedNextAction = unassignedCount > 0
        ? `Deploy driver assignments immediately to the ${unassignedCount} unassigned operational vehicles to optimize transit capacity.`
        : "Fleet assets present optimal operational readiness with complete driver mapping.";
    }
    else if (q.includes("housing") || q.includes("apart") || q.includes("facil")) {
      const [units, asg] = await Promise.all([
        supabase.from("housing_units").select("id,capacity"),
        supabase.from("housing_assignments").select("housing_unit_id")
      ]);
      const totalCap = (units.data || []).reduce((s, u) => s + (u.capacity || 0), 0);
      const activeAsg = (asg.data || []).length;
      summaryEn = `Housing logistics overview: Total beds capacity at ${totalCap}, current active resident assignments registered at ${activeAsg}.`;
      summaryAr = `مخطط الإسكان الإداري: إجمالي سعة الأسرة يبلغ ${totalCap} سريراً، والتعيينات السكنية النشطة المسجلة حالياً تبلغ ${activeAsg}.`;
      matchedModules = ["Housing"];
      relatedEvents = list.filter(e => e.module === "Housing").slice(0, 10);
      recommendedNextAction = (totalCap - activeAsg) < 5
        ? "Housing capacity has reached critical operational density. Prepare to allocate supplementary units."
        : "Housing unit allocations remain stable with ample supplementary capacity.";
    }
    else if (q.includes("approval") || q.includes("task")) {
      const [sbTasks, telTasks] = await Promise.all([
        supabase.from("site_admin_tasks").select("id").neq("status", "done"),
        supabase.from("nexus_tasks").select("id").eq("status", "open")
      ]);
      const pendingOps = (sbTasks.data || []).length;
      const pendingTel = (telTasks.data || []).length;
      summaryEn = `Task execution overview: Detected ${pendingOps} pending field admin tasks and ${pendingTel} active synchronized Telegram command inputs.`;
      summaryAr = `ملخص مهام العمليات: تم رصد عدد ${pendingOps} مهمة ميدانية معلقة وعدد ${pendingTel} أوامر تشغيل نشطة واردة من تيليجرام.`;
      matchedModules = ["Tasks", "Telegram"];
      relatedEvents = list.filter(e => e.module === "Tasks" || e.module === "Telegram").slice(0, 10);
      recommendedNextAction = `Examine and execute actions in the Command Inbox for Telegram commands, and review pending site administrative tasks.`;
    }
    else if (q.includes("policy") || q.includes("complia")) {
      const { data } = await supabase.from("company_policy_runtime_events").select("id");
      const policyCount = (data || []).length;
      summaryEn = `Compliance engine guardrails: Active monitor registers ${policyCount} labor compliance events under Egyptian statutory policies.`;
      summaryAr = `محرك الامتثال والرقابة: سجل نظام المراقبة النشط ${policyCount} حدث امتثال تشغيلي وفقاً لقوانين العمل المصرية.`;
      matchedModules = ["Compliance"];
      relatedEvents = list.filter(e => e.module === "Compliance").slice(0, 10);
      recommendedNextAction = "Run standard compliance audits to verify personnel insurance cards and expiry profiles.";
    }
    else if (q.includes("today")) {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).getTime();
      const todayEvts = list.filter(e => new Date(e.timestamp).getTime() > dayAgo);
      summaryEn = `Daily activity summary: Compiled ${todayEvts.length} operational telemetry events and state updates during the last 24 hours.`;
      summaryAr = `ملخص النشاط اليومي: تم تجميع عدد ${todayEvts.length} من سجلات العمليات وتحديثات الحالة خلال الـ 24 ساعة الماضية.`;
      matchedModules = ["Ecosystem"];
      relatedEvents = todayEvts;
      recommendedNextAction = "Monitor real-time feed continuously for immediate telemetry warnings or critical operational signals.";
    }
    else {
      // General match
      const filtered = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
      summaryEn = `Operational search index: Located ${filtered.length} related signals in the ecosystem timeline matching query '${q}'.`;
      summaryAr = `نتائج البحث التشغيلي: تم العثور على ${filtered.length} إشارة تشغيلية في الجدول الزمني مطابقة للاستعلام '${q}'.`;
      matchedModules = Array.from(new Set(filtered.map(e => e.module)));
      relatedEvents = filtered.slice(0, 15);
      recommendedNextAction = filtered.length > 0
        ? `Inspect matched events inside the unified timeline for targeted operational indicators.`
        : "Try using simple command tokens like 'onboarding', 'staff', 'fleet', or 'housing' to access deterministic diagnostic models.";
    }

    return res.status(200).json({
      query: q,
      summary: `${summaryAr}\n\n${summaryEn}`,
      matchedModules,
      relatedEvents,
      recommendedNextAction,
      confidence: "deterministic"
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
