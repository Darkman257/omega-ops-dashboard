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

export interface PayrollLeak {
  id: string;
  type: 'MISSING_SITE' | 'ZERO_SALARY' | 'MISSING_NAME' | 'DUPLICATE' | 'MISSING_CODE' | 'UNLINKED_STAFF' | 'OVER_BUDGET';
  description: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recordId?: string;
  employeeName?: string;
  internalCode?: string;
  projectId?: string;
}

export interface DecisionStats {
  verdict: 'SAFE' | 'WARNING' | 'CRITICAL';
  reason: string;
  leakTotal: number;
  activeRiskCount: number;
  productivityScore: number;
  attendanceRate: number;
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
        description: `Payroll record for "${r.employeeName}" missing Internal Code.`,
        severity: 'CRITICAL',
        recordId: r.id
      });
    } else if (!staffCodes.has(r.internalCode)) {
      leaks.push({
        id: `leak-unlink-${r.id}`,
        type: 'UNLINKED_STAFF',
        description: `Code "${r.internalCode}" not found in Staff Registry.`,
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
        description: `Duplicate entry for "${r.internalCode}" in ${r.month} at ${r.siteName}.`,
        severity: 'HIGH',
        recordId: r.id
      });
    }
    seen.add(dupKey);

    if (r.netSalary <= 0) {
      leaks.push({
        id: `leak-zero-${r.id}`,
        type: 'ZERO_SALARY',
        description: `Zero salary alert for "${r.employeeName}" (${r.internalCode}).`,
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
        description: `Site "${p.name}" has exceeded contract value by ${Math.abs(financials.grossRemaining).toLocaleString()}.`,
        severity: 'CRITICAL',
        projectId: p.id
      });
    }
  });

  return leaks;
}

export function getDecisionEngineData(projects: Project[], payroll: PayrollRecord[], staff: Employee[]): DecisionStats {
  const leaks = detectPayrollLeaks(payroll, staff, projects);
  const financials = projects.map(p => calculateProjectFinancials(p, payroll));
  
  const highRisk = financials.filter(f => f.riskLevel === 'HIGH_RISK');
  const criticalLeaks = leaks.filter(l => l.severity === 'CRITICAL');
  
  let verdict: DecisionStats['verdict'] = 'SAFE';
  let reason = 'All systems stable. No major leaks detected.';
  
  if (criticalLeaks.length > 0 || highRisk.length > 1) {
    verdict = 'CRITICAL';
    reason = `${criticalLeaks.length} critical leaks detected. ${highRisk.length} projects are in high-risk zones.`;
  } else if (leaks.length > 0 || highRisk.length > 0) {
    verdict = 'WARNING';
    reason = `Minor financial leakage detected. ${highRisk.length} project nearing budget limit.`;
  }

  // Simulated metrics for demo (to be replaced with real attendance data when available)
  const attendanceRate = 85 + (Math.random() * 10);
  const productivityScore = 70 + (Math.random() * 15);

  return {
    verdict,
    reason,
    leakTotal: leaks.length,
    activeRiskCount: highRisk.length,
    productivityScore,
    attendanceRate
  };
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
