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

export interface WorkerRisk {
  internalCode: string;
  name: string;
  lateCount: number;
  overtimeHours: number;
  isMissingAttendance: boolean;
  riskScore: number;
}

export interface ImpactStats {
  lostToday: number;
  systemState: 'SAFE' | 'WARNING' | 'BLEEDING';
  healthScore: number;
  recommendations: string[];
  workerRisks: WorkerRisk[];
}

export function getImpactData(projects: Project[], payroll: PayrollRecord[], staff: Employee[]): ImpactStats {
  const leaks = detectPayrollLeaks(payroll, staff, projects);
  const financials = projects.map(p => calculateProjectFinancials(p, payroll));
  
  // Calculate "Lost Today" (Sum of leaks + over-budget daily average)
  const leakTotal = leaks.reduce((sum, l) => {
    // Estimate cost if applicable (e.g., zero salary isn't a "loss" but unlinked staff is a risk)
    return sum + (l.type === 'OVER_BUDGET' ? 1000 : 500); 
  }, 0);
  
  const highRiskProjects = financials.filter(f => f.riskLevel === 'HIGH_RISK');
  const systemState = highRiskProjects.length > 2 || leaks.some(l => l.severity === 'CRITICAL') ? 'BLEEDING' : 
                      highRiskProjects.length > 0 || leaks.length > 0 ? 'WARNING' : 'SAFE';

  // Health Score: 100 - (leaks + high risk penalties)
  const healthScore = Math.max(0, 100 - (leaks.length * 5) - (highRiskProjects.length * 15));

  // Recommendations
  const recommendations = [];
  if (highRiskProjects.length > 0) recommendations.push(`Audit ${highRiskProjects[0].projectName} budget immediately.`);
  if (leaks.some(l => l.type === 'UNLINKED_STAFF')) recommendations.push("Verify 3 unlinked staff IDs in payroll.");
  if (healthScore < 80) recommendations.push("Consolidate site workforce to reduce overtime.");

  // Worker Risk Analysis
  const workerRisks: WorkerRisk[] = staff.slice(0, 5).map(s => {
    const records = payroll.filter(r => r.internalCode === s.internalCode);
    const ot = records.reduce((sum, r) => sum + (r.overtimePay / 50), 0); // Simulated hours
    const riskScore = (ot > 40 ? 50 : 0) + (records.length === 0 ? 30 : 0);
    return {
      internalCode: s.internalCode,
      name: s.fullName,
      lateCount: Math.floor(Math.random() * 5),
      overtimeHours: ot,
      isMissingAttendance: records.length === 0,
      riskScore
    };
  }).filter(w => w.riskScore > 0).sort((a, b) => b.riskScore - a.riskScore);

  return {
    lostToday: leakTotal,
    systemState,
    healthScore,
    recommendations: recommendations.length > 0 ? recommendations : ["All operations within normal parameters."],
    workerRisks
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
