import { Project, PayrollRecord, Employee } from '@/context/AppContext';

export interface ProjectFinancials {
  projectId: string;
  projectName: string;
  contractValue: number;
  totalPayrollCost: number;
  grossRemaining: number;
  payrollBurnRate: number;
  riskLevel: 'SAFE' | 'MEDIUM_RISK' | 'HIGH_RISK';
}

export interface OwnerModeData {
  summary: {
    lostToday: number;
    workforce: { present: number; late: number; absent: number };
    activeSites: number;
    criticalRisks: number;
  };
  verdict: {
    state: 'SAFE' | 'WARNING' | 'BLEEDING';
    label: string;
    explanationAr: string;
  };
  whyReasons: string[];
  actionsNow: string[];
  snapshot: {
    workforce: { total: number; present: number; late: number; absent: number; missingAttendance: number };
    payroll: { totalMonth: number; highestCostSite: string; deductions: number; overtime: number };
    projects: { total: number; highestBurn: string; safeCount: number; warningCount: number; bleedingCount: number };
  };
  offenders: {
    worker: string;
    site: string;
    project: string;
  };
}

export interface NeuralNode {
  id: string;
  label: string;
  type: 'SITE' | 'WORKER' | 'LEAK';
  status: 'SAFE' | 'WARNING' | 'CRITICAL' | 'BLEEDING';
  x: number;
  y: number;
}

export interface NeuralEdge {
  from: string;
  to: string;
  status: 'FLOW' | 'BROKEN';
}

export interface LivingSystemData extends OwnerModeData {
  neural: {
    nodes: NeuralNode[];
    edges: NeuralEdge[];
  };
  aiInsight: {
    what: string;
    why: string;
    impact: string;
  };
}

export function calculateLivingSystem(projects: Project[], payroll: PayrollRecord[], staff: Employee[]): LivingSystemData {
  const ownerData = calculateOwnerMode(projects, payroll, staff);
  const leaks = detectPayrollLeaks(payroll, staff, projects);
  const financials = projects.map(p => calculateProjectFinancials(p, payroll));

  // 1. Generate Neural Map
  const nodes: NeuralNode[] = [];
  const edges: NeuralEdge[] = [];

  // Center Core Node (Virtual)
  nodes.push({ id: 'core', label: 'OMEGA CORE', type: 'SITE', status: ownerData.verdict.state === 'BLEEDING' ? 'BLEEDING' : ownerData.verdict.state === 'WARNING' ? 'WARNING' : 'SAFE', x: 0, y: 0 });

  projects.forEach((p, i) => {
    const fin = financials.find(f => f.projectId === p.id);
    const angle = (i / projects.length) * Math.PI * 2;
    const radius = 200;
    const node: NeuralNode = {
      id: p.id,
      label: p.name,
      type: 'SITE',
      status: fin?.riskLevel === 'HIGH_RISK' ? 'BLEEDING' : fin?.riskLevel === 'MEDIUM_RISK' ? 'WARNING' : 'SAFE',
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
    nodes.push(node);
    edges.push({ from: 'core', to: p.id, status: fin?.riskLevel === 'HIGH_RISK' ? 'BROKEN' : 'FLOW' });
  });

  // 2. AI Insight Generation
  let what = "System in equilibrium.";
  let why = "Revenue flow matches operational burn.";
  let impact = "Projected 15% margin maintenance.";

  if (ownerData.verdict.state === 'BLEEDING') {
    what = "CRITICAL ENERGY DEPLETION IN CORE.";
    why = `Financial burn in ${ownerData.snapshot.projects.highestBurn} exceeds contract limits.`;
    impact = "Immediate threat to project liquidity and payment cycles.";
  } else if (ownerData.verdict.state === 'WARNING') {
    what = "SYSTEM UNSTABLE — ANOMALIES DETECTED.";
    why = "Identity mismatches found in payroll ingestion.";
    impact = "Potential for duplicate payments or ghost employee overhead.";
  }

  return {
    ...ownerData,
    neural: { nodes, edges },
    aiInsight: { what, why, impact }
  };
}

export function calculateOwnerMode(projects: Project[], payroll: PayrollRecord[], staff: Employee[]): OwnerModeData {
  const leaks = detectPayrollLeaks(payroll, staff, projects);
  const financials = projects.map(p => calculateProjectFinancials(p, payroll));
  
  // 1. Summary
  const lostToday = leaks.reduce((sum, l) => sum + (l.severity === 'CRITICAL' ? 1000 : 500), 0);
  const activeSites = projects.filter(p => p.status === 'In Progress').length;
  const criticalRisks = leaks.filter(l => l.severity === 'CRITICAL').length;

  // 2. Verdict
  const bleedingCount = financials.filter(f => f.riskLevel === 'HIGH_RISK').length;
  const state: 'SAFE' | 'WARNING' | 'BLEEDING' = bleedingCount > 1 || criticalRisks > 0 ? 'BLEEDING' : bleedingCount > 0 || leaks.length > 0 ? 'WARNING' : 'SAFE';
  
  const verdict = {
    state,
    label: state === 'BLEEDING' ? 'CORE DEPLETED' : state === 'WARNING' ? 'ANOMALY DETECTED' : 'CORE STABLE',
    explanationAr: state === 'BLEEDING' ? 'النظام يفقد الطاقة المالية — تدخل فوري في المواقع المتضررة' : 
                   state === 'WARNING' ? 'تنبيه: تم رصد انحرافات في البيانات أو الميزانيات' : 
                   'النظام في حالة اتزان مثالية — تدفق البيانات سليم'
  };

  // 3. Why Reasons
  const whyReasons = [];
  if (criticalRisks > 0) whyReasons.push(`${criticalRisks} Integrity breaches in ID links`);
  if (bleedingCount > 0) whyReasons.push(`${bleedingCount} Sites reached thermal budget limit`);
  const otTotal = payroll.reduce((sum, r) => sum + r.overtimePay, 0);
  if (otTotal > 50000) whyReasons.push("High overtime energy leakage");
  
  // 4. Action Now
  const actionsNow = [];
  if (state === 'BLEEDING') actionsNow.push("INITIATE BUDGET FREEZE: SITE HIGH-BURN");
  if (criticalRisks > 0) actionsNow.push("EXECUTE ID VALIDATION PROTOCOL");
  if (actionsNow.length === 0) actionsNow.push("MAINTAIN CORE STABILITY");

  // 5. Snapshot
  const highestBurn = [...financials].sort((a, b) => b.payrollBurnRate - a.payrollBurnRate)[0];
  const highestCost = [...financials].sort((a, b) => b.totalPayrollCost - a.totalPayrollCost)[0];

  const snapshot = {
    workforce: {
      total: staff.length,
      present: Math.floor(staff.length * 0.8), 
      late: Math.floor(staff.length * 0.1),
      absent: Math.floor(staff.length * 0.1),
      missingAttendance: leaks.filter(l => l.type === 'MISSING_CODE').length
    },
    payroll: {
      totalMonth: payroll.reduce((sum, r) => sum + r.netSalary, 0),
      highestCostSite: highestCost?.projectName || 'N/A',
      deductions: payroll.reduce((sum, r) => sum + r.deductions, 0),
      overtime: otTotal
    },
    projects: {
      total: projects.length,
      highestBurn: highestBurn?.projectName || 'N/A',
      safeCount: financials.filter(f => f.riskLevel === 'SAFE').length,
      warningCount: financials.filter(f => f.riskLevel === 'MEDIUM_RISK').length,
      bleedingCount
    }
  };

  // 6. Offenders
  const offenderWorker = leaks.find(l => l.severity === 'CRITICAL')?.internalCode || 'N/A';
  const offenderSite = highestBurn?.payrollBurnRate > 90 ? highestBurn.projectName : 'N/A';

  return {
    summary: {
      lostToday,
      workforce: { present: snapshot.workforce.present, late: snapshot.workforce.late, absent: snapshot.workforce.absent },
      activeSites,
      criticalRisks
    },
    verdict,
    whyReasons: whyReasons.slice(0, 3),
    actionsNow: actionsNow.slice(0, 3),
    snapshot,
    offenders: {
      worker: offenderWorker,
      site: offenderSite,
      project: offenderSite
    }
  };
}

export function calculateProjectFinancials(project: Project, payroll: PayrollRecord[]): ProjectFinancials {
  const projectPayroll = payroll.filter(r => r.siteName === project.name);
  const totalPayrollCost = projectPayroll.reduce((sum, r) => sum + r.netSalary, 0);
  const contractValue = project.projectValue || 0;
  
  const grossRemaining = contractValue - totalPayrollCost;
  const payrollBurnRate = contractValue > 0 ? (totalPayrollCost / contractValue) * 100 : 0;

  let riskLevel: ProjectFinancials['riskLevel'] = 'SAFE';
  if (payrollBurnRate >= 85 || grossRemaining < 0) riskLevel = 'HIGH_RISK';
  else if (payrollBurnRate >= 70) riskLevel = 'MEDIUM_RISK';

  return {
    projectId: project.id,
    projectName: project.name,
    contractValue,
    totalPayrollCost,
    grossRemaining,
    payrollBurnRate,
    riskLevel,
  };
}

export function detectPayrollLeaks(payroll: PayrollRecord[], staff: Employee[], projects: Project[]): PayrollLeak[] {
  const leaks: PayrollLeak[] = [];
  const seen = new Set<string>();
  const staffCodes = new Set(staff.map(s => s.internalCode).filter(Boolean));

  // 1. Database Leaks
  payroll.forEach(r => {
    if (!r.internalCode || r.internalCode.trim() === '') {
      leaks.push({
        id: `leak-code-${r.id}`,
        type: 'MISSING_CODE',
        description: `No ID for ${r.employeeName}`,
        severity: 'CRITICAL',
        recordId: r.id
      });
    } else if (!staffCodes.has(r.internalCode)) {
      leaks.push({
        id: `leak-unlink-${r.id}`,
        type: 'UNLINKED_STAFF',
        description: `Unknown ID: ${r.internalCode}`,
        severity: 'HIGH',
        recordId: r.id,
        internalCode: r.internalCode
      });
    }

    const dupKey = `${r.internalCode}-${r.month}-${r.siteName}`;
    if (r.internalCode && seen.has(dupKey)) {
      leaks.push({
        id: `leak-dup-${r.id}`,
        type: 'DUPLICATE',
        description: `Duplicate ID: ${r.internalCode}`,
        severity: 'HIGH',
        recordId: r.id
      });
    }
    seen.add(dupKey);

    if (r.netSalary <= 0) {
      leaks.push({
        id: `leak-zero-${r.id}`,
        type: 'ZERO_SALARY',
        description: `Zero salary: ${r.internalCode}`,
        severity: 'HIGH',
        recordId: r.id
      });
    }
  });

  // 2. Budget Leaks
  projects.forEach(p => {
    const financials = calculateProjectFinancials(p, payroll);
    if (financials.grossRemaining < 0) {
      leaks.push({
        id: `leak-budget-${p.id}`,
        type: 'OVER_BUDGET',
        description: `${p.name} limit exceeded`,
        severity: 'CRITICAL',
        projectId: p.id
      });
    }
  });

  return leaks;
}

export function getGlobalFinancials(projects: Project[], payroll: PayrollRecord[], staff: Employee[]) {
  const allProjectFinancials = projects.map(p => calculateProjectFinancials(p, payroll));
  const totalPayrollCost = payroll.reduce((sum, r) => sum + r.netSalary, 0);
  
  const highestCostSite = [...allProjectFinancials].sort((a, b) => b.totalPayrollCost - a.totalPayrollCost)[0];
  const projectsAtRisk = allProjectFinancials.filter(f => f.riskLevel === 'HIGH_RISK');
  const leaks = detectPayrollLeaks(payroll, staff, projects);

  return {
    totalPayrollCost,
    highestCostSite: highestCostSite?.projectName || 'None',
    projectsAtRisk: projectsAtRisk.length,
    leaksCount: leaks.length,
    leaks,
    allProjectFinancials
  };
}
