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
    label: state === 'BLEEDING' ? 'SYSTEM BLEEDING' : state === 'WARNING' ? 'SYSTEM WARNING' : 'SYSTEM SAFE',
    explanationAr: state === 'BLEEDING' ? 'يوجد نزيف مالي واضح وتخطي للميزانيات — تدخل فوري مطلوب' : 
                   state === 'WARNING' ? 'يوجد مخاطر محتملة وتنبيهات في المرتبات أو المواقع' : 
                   'النظام مستقر — لا يوجد نزيف مالي واضح اليوم'
  };

  // 3. Why Reasons
  const whyReasons = [];
  if (criticalRisks > 0) whyReasons.push(`${criticalRisks} Critical payroll integrity leaks`);
  if (bleedingCount > 0) whyReasons.push(`${bleedingCount} Sites exceeded 85% burn rate`);
  const otTotal = payroll.reduce((sum, r) => sum + r.overtimePay, 0);
  if (otTotal > 50000) whyReasons.push("Abnormal overtime spike detected across sites");
  if (leaks.some(l => l.type === 'UNLINKED_STAFF')) whyReasons.push("Unknown worker IDs found in payroll batch");
  
  // 4. Action Now
  const actionsNow = [];
  if (state === 'BLEEDING') actionsNow.push("Freeze all non-essential spending for high-burn sites");
  if (criticalRisks > 0) actionsNow.push("Validate payroll duplicates and unlinked codes");
  if (financials.some(f => f.payrollBurnRate > 95)) actionsNow.push(`Review overtime for site "${financials.find(f => f.payrollBurnRate > 95)?.projectName}"`);
  if (actionsNow.length === 0) actionsNow.push("Continue routine monitoring of site attendance");

  // 5. Snapshot
  const highestBurn = [...financials].sort((a, b) => b.payrollBurnRate - a.payrollBurnRate)[0];
  const highestCost = [...financials].sort((a, b) => b.totalPayrollCost - a.totalPayrollCost)[0];

  const snapshot = {
    workforce: {
      total: staff.length,
      present: Math.floor(staff.length * 0.8), // Simulated
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
