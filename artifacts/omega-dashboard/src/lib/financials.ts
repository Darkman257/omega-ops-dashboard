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
  type: 'MISSING_SITE' | 'ZERO_SALARY' | 'MISSING_NAME' | 'DUPLICATE' | 'MISSING_CODE' | 'UNLINKED_STAFF';
  description: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recordId?: string;
  employeeName?: string;
  internalCode?: string;
}

export function calculateProjectFinancials(project: Project, payroll: PayrollRecord[]): ProjectFinancials {
  const projectPayroll = payroll.filter(r => r.siteName === project.name);
  // Summing by record is still correct for total cost, but we ensure identity lock in leak detection
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

export function detectPayrollLeaks(payroll: PayrollRecord[], staff: Employee[]): PayrollLeak[] {
  const leaks: PayrollLeak[] = [];
  const seen = new Set<string>();
  const staffCodes = new Set(staff.map(s => s.internalCode).filter(Boolean));

  payroll.forEach(r => {
    // 1. Missing Internal Code (Reject/Flag)
    if (!r.internalCode || r.internalCode.trim() === '') {
      leaks.push({
        id: `leak-code-${r.id}`,
        type: 'MISSING_CODE',
        description: `Payroll record for "${r.employeeName}" is missing an Internal Code. Access denied.`,
        severity: 'CRITICAL',
        recordId: r.id,
        employeeName: r.employeeName
      });
    } else if (!staffCodes.has(r.internalCode)) {
      // 2. Unlinked Staff (Code doesn't exist in master staff list)
      leaks.push({
        id: `leak-unlink-${r.id}`,
        type: 'UNLINKED_STAFF',
        description: `Internal Code "${r.internalCode}" (Assigned to ${r.employeeName}) not found in Staff Registry.`,
        severity: 'HIGH',
        recordId: r.id,
        employeeName: r.employeeName,
        internalCode: r.internalCode
      });
    }

    // 3. Duplicates (Code + Month + Site)
    const dupKey = `${r.internalCode}-${r.month}-${r.siteName}`;
    if (r.internalCode && seen.has(dupKey)) {
      leaks.push({
        id: `leak-dup-${r.id}`,
        type: 'DUPLICATE',
        description: `Duplicate payroll for Code "${r.internalCode}" in ${r.month} at ${r.siteName}.`,
        severity: 'HIGH',
        recordId: r.id,
        employeeName: r.employeeName,
        internalCode: r.internalCode
      });
    }
    seen.add(dupKey);

    // 4. Site Allocation
    if (!r.siteName || r.siteName.trim() === '') {
      leaks.push({
        id: `leak-site-${r.id}`,
        type: 'MISSING_SITE',
        description: `Cost for "${r.employeeName}" (${r.internalCode}) has no assigned site.`,
        severity: 'MEDIUM',
        recordId: r.id,
        employeeName: r.employeeName
      });
    }

    // 5. Zero Salary
    if (r.netSalary <= 0) {
      leaks.push({
        id: `leak-zero-${r.id}`,
        type: 'ZERO_SALARY',
        description: `Zero salary alert for "${r.employeeName}" (${r.internalCode}).`,
        severity: 'HIGH',
        recordId: r.id,
        employeeName: r.employeeName
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
  const leaks = detectPayrollLeaks(payroll, staff);

  return {
    totalPayrollCost,
    highestCostSite: highestCostSite?.projectName || 'None',
    projectsAtRisk: projectsAtRisk.length,
    leaksCount: leaks.length,
    leaks,
    allProjectFinancials
  };
}
