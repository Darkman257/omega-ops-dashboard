import { Project, PayrollRecord } from '@/context/AppContext';

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
  type: 'MISSING_SITE' | 'ZERO_SALARY' | 'MISSING_NAME' | 'DUPLICATE';
  description: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recordId?: string;
  employeeName?: string;
}

export function calculateProjectFinancials(project: Project, payroll: PayrollRecord[]): ProjectFinancials {
  const projectPayroll = payroll.filter(r => r.siteName === project.name);
  const totalPayrollCost = projectPayroll.reduce((sum, r) => sum + r.netSalary, 0);
  const contractValue = project.projectValue || 0;
  
  const grossRemaining = contractValue - totalPayrollCost;
  const payrollBurnRate = contractValue > 0 ? (totalPayrollCost / contractValue) * 100 : 0;

  let riskLevel: ProjectFinancials['riskLevel'] = 'SAFE';
  if (payrollBurnRate >= 70) riskLevel = 'HIGH_RISK';
  else if (payrollBurnRate >= 50) riskLevel = 'MEDIUM_RISK';

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

export function detectPayrollLeaks(payroll: PayrollRecord[]): PayrollLeak[] {
  const leaks: PayrollLeak[] = [];
  const seen = new Set<string>();

  payroll.forEach(r => {
    // 1. Missing Site
    if (!r.siteName || r.siteName.trim() === '') {
      leaks.push({
        id: `leak-site-${r.id}`,
        type: 'MISSING_SITE',
        description: `Employee "${r.employeeName}" has no assigned site. Cost is unallocated.`,
        severity: 'MEDIUM',
        recordId: r.id,
        employeeName: r.employeeName
      });
    }

    // 2. Zero or Negative Salary
    if (r.netSalary <= 0) {
      leaks.push({
        id: `leak-zero-${r.id}`,
        type: 'ZERO_SALARY',
        description: `Payroll record for "${r.employeeName}" has zero or negative net salary.`,
        severity: 'HIGH',
        recordId: r.id,
        employeeName: r.employeeName
      });
    }

    // 3. Missing Name
    if (!r.employeeName || r.employeeName.trim() === '') {
      leaks.push({
        id: `leak-name-${r.id}`,
        type: 'MISSING_NAME',
        description: `Anonymous payroll record found (ID: ${r.id}). Data integrity risk.`,
        severity: 'CRITICAL',
        recordId: r.id
      });
    }

    // 4. Duplicates (Name + Month + Site)
    const key = `${r.employeeName}-${r.month}-${r.siteName}`;
    if (seen.has(key)) {
      leaks.push({
        id: `leak-dup-${r.id}`,
        type: 'DUPLICATE',
        description: `Possible duplicate entry for "${r.employeeName}" in ${r.month} at ${r.siteName}.`,
        severity: 'HIGH',
        recordId: r.id,
        employeeName: r.employeeName
      });
    }
    seen.add(key);
  });

  return leaks;
}

export function getGlobalFinancials(projects: Project[], payroll: PayrollRecord[]) {
  const allProjectFinancials = projects.map(p => calculateProjectFinancials(p, payroll));
  const totalPayrollCost = payroll.reduce((sum, r) => sum + r.netSalary, 0);
  
  const highestCostSite = [...allProjectFinancials].sort((a, b) => b.totalPayrollCost - a.totalPayrollCost)[0];
  const projectsAtRisk = allProjectFinancials.filter(f => f.riskLevel === 'HIGH_RISK');
  const leaks = detectPayrollLeaks(payroll);

  return {
    totalPayrollCost,
    highestCostSite: highestCostSite?.projectName || 'None',
    projectsAtRisk: projectsAtRisk.length,
    leaksCount: leaks.length,
    leaks,
    allProjectFinancials
  };
}
