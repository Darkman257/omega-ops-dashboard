// ─── AI Insights Engine ───────────────────────────────────────────────────────
// Pure deterministic rule-based reasoning layer.
// No external API calls. Derives insights from real Supabase-sourced data.
// ─────────────────────────────────────────────────────────────────────────────

import { Employee, Vehicle, PayrollRecord, Project } from '@/context/AppContext';
import { AttendanceMetrics } from '@/hooks/useAttendanceMetrics';

export interface AiInsight {
  id: string;
  severity: 'safe' | 'warning' | 'critical';
  title: string;
  reason: string;
  action: string;
  impact: string;
}

export interface AiSummary {
  overallRisk: 'SAFE' | 'WARNING' | 'CRITICAL';
  insights: AiInsight[];
  dataQuality: 'full' | 'partial' | 'empty';
  missingFeeds: string[];
}

export function buildAiInsights(params: {
  employees: Employee[];
  vehicles: Vehicle[];
  payrollRecords: PayrollRecord[];
  projects: Project[];
  attendanceMetrics: AttendanceMetrics;
  activeEmployees: number;
  activeVehicles: number;
  cashBurnToday: number;
}): AiSummary {
  const { employees, vehicles, payrollRecords, projects, attendanceMetrics, activeEmployees, activeVehicles, cashBurnToday } = params;
  const insights: AiInsight[] = [];
  const missingFeeds: string[] = [];

  const totalEmployees = employees.length;
  const totalVehicles = vehicles.length;
  const laborRate = totalEmployees > 0 ? (activeEmployees / totalEmployees) * 100 : 0;
  const inactiveVehicleRate = totalVehicles > 0 ? ((totalVehicles - activeVehicles) / totalVehicles) * 100 : 0;

  // ── RULE 1: Manpower shortage ──────────────────────────────────────────────
  if (totalEmployees === 0) {
    missingFeeds.push('Staff table');
  } else if (laborRate < 60) {
    insights.push({
      id: 'manpower-critical',
      severity: 'critical',
      title: 'Critical Manpower Shortage',
      reason: `Only ${laborRate.toFixed(1)}% of workforce is on duty (${activeEmployees}/${totalEmployees}). Threshold is 60%.`,
      action: 'Dispatch field supervisor to assess absenteeism. Activate standby workers.',
      impact: 'Project SLA breach risk. Active sites may stall. Delays compound daily.',
    });
  } else if (laborRate < 80) {
    insights.push({
      id: 'manpower-warning',
      severity: 'warning',
      title: 'Below-Target Workforce Presence',
      reason: `${laborRate.toFixed(1)}% labor participation. Healthy threshold is ≥80%.`,
      action: 'Review attendance report. Contact site leads for status.',
      impact: 'Reduced throughput on active project phases.',
    });
  } else {
    insights.push({
      id: 'manpower-safe',
      severity: 'safe',
      title: 'Workforce Presence Normal',
      reason: `${laborRate.toFixed(1)}% of workforce is on duty — within safe operating range.`,
      action: 'No action required. Monitor for shifts.',
      impact: 'Maintains project execution velocity.',
    });
  }

  // ── RULE 2: Fleet / Equipment bottleneck ───────────────────────────────────
  if (totalVehicles === 0) {
    missingFeeds.push('Fleet table');
  } else if (inactiveVehicleRate > 60) {
    insights.push({
      id: 'fleet-critical',
      severity: 'critical',
      title: 'Equipment Bottleneck — Critical',
      reason: `${inactiveVehicleRate.toFixed(1)}% of fleet is inactive (${totalVehicles - activeVehicles}/${totalVehicles} units down).`,
      action: 'Escalate to logistics. Activate rental backup vehicles immediately.',
      impact: 'Material delivery and site mobility halted. Project burn continues with no output.',
    });
  } else if (inactiveVehicleRate > 40) {
    insights.push({
      id: 'fleet-warning',
      severity: 'warning',
      title: 'Fleet Availability Below Threshold',
      reason: `${inactiveVehicleRate.toFixed(1)}% vehicle inactivity — above 40% warning threshold.`,
      action: 'Check maintenance queue. Prioritize high-priority routes.',
      impact: 'Site logistics degraded. Potential delays to material deliveries.',
    });
  } else {
    insights.push({
      id: 'fleet-safe',
      severity: 'safe',
      title: 'Fleet Operating Normally',
      reason: `${activeVehicles} of ${totalVehicles} units active. Inactivity rate: ${inactiveVehicleRate.toFixed(1)}%.`,
      action: 'No action required.',
      impact: 'Logistics capacity adequate for current operations.',
    });
  }

  // ── RULE 3: Cash burn / payroll risk ──────────────────────────────────────
  if (payrollRecords.length === 0) {
    missingFeeds.push('Payroll records');
    insights.push({
      id: 'payroll-no-data',
      severity: 'warning',
      title: 'No Payroll Data Connected',
      reason: 'Payroll records table is empty. Financial burn analysis is unavailable.',
      action: 'Run payroll import or connect payroll feed.',
      impact: 'Cannot assess daily cash burn, salary liabilities, or project overspend.',
    });
  } else if (cashBurnToday > 35000) {
    insights.push({
      id: 'cashburn-high',
      severity: 'warning',
      title: 'High Daily Financial Burn',
      reason: `Estimated daily payroll burn is ${Math.round(cashBurnToday).toLocaleString()} EGP — above the 35,000 EGP threshold.`,
      action: 'Review payroll records for overtime anomalies or ghost entries.',
      impact: 'Sustained high burn risks liquidity shortfall before next payment cycle.',
    });
  } else {
    insights.push({
      id: 'cashburn-safe',
      severity: 'safe',
      title: 'Financial Burn Within Range',
      reason: `Daily burn estimated at ${Math.round(cashBurnToday).toLocaleString()} EGP — within normal operating range.`,
      action: 'Continue monitoring weekly trend.',
      impact: 'Acceptable cash flow risk.',
    });
  }

  // ── RULE 4: Project risk ───────────────────────────────────────────────────
  const activeProjects = projects.filter(p => p.status === 'In Progress');
  if (projects.length === 0) {
    missingFeeds.push('Projects table');
  } else {
    const delayedProjects = projects.filter(p => {
      if (!p.endDate) return false;
      return p.completionPercent < 80 && new Date(p.endDate) < new Date();
    });
    if (delayedProjects.length > 0) {
      insights.push({
        id: 'project-overdue',
        severity: 'critical',
        title: `${delayedProjects.length} Project${delayedProjects.length > 1 ? 's' : ''} Overdue`,
        reason: `Projects past end date with <80% completion: ${delayedProjects.map(p => p.name).join(', ')}.`,
        action: 'Schedule emergency review. Reassign resources from lower-priority sites.',
        impact: 'Client penalty clauses may activate. Reputation and contract renewal at risk.',
      });
    } else if (activeProjects.length === 0) {
      insights.push({
        id: 'project-idle',
        severity: 'warning',
        title: 'No Active Projects In Progress',
        reason: `${projects.length} projects exist but none are status "In Progress".`,
        action: 'Update project statuses or initiate pending project phases.',
        impact: 'Revenue pipeline may be stalled.',
      });
    } else {
      insights.push({
        id: 'project-safe',
        severity: 'safe',
        title: `${activeProjects.length} Active Project${activeProjects.length > 1 ? 's' : ''} On Track`,
        reason: `No overdue projects detected. ${activeProjects.length} sites in execution phase.`,
        action: 'Maintain current schedule.',
        impact: 'Delivery risk: low.',
      });
    }
  }

  // ── RULE 5: Attendance data freshness ─────────────────────────────────────
  if (!attendanceMetrics.hasLiveData) {
    missingFeeds.push('Today\'s attendance');
    insights.push({
      id: 'attendance-missing',
      severity: 'warning',
      title: 'No Live Attendance for Today',
      reason: 'Attendance table has no records for today\'s date. Workforce count is estimated from staff status.',
      action: 'Import today\'s biometric or manual attendance log.',
      impact: 'Workforce presence metrics are approximate. Alert accuracy is reduced.',
    });
  }

  // ── RULE 6: Expired documents / compliance ────────────────────────────────
  const expiredInsurance = employees.filter(e => e.insuranceStatus === 'Expired').length;
  if (expiredInsurance > 0) {
    insights.push({
      id: 'compliance-insurance',
      severity: expiredInsurance > 5 ? 'critical' : 'warning',
      title: `${expiredInsurance} Staff with Expired Insurance`,
      reason: `${expiredInsurance} employee${expiredInsurance > 1 ? 's have' : ' has'} expired insurance status.`,
      action: 'Initiate renewal process. Remove expired staff from active site assignments.',
      impact: 'Legal liability on site. Potential project permit violation.',
    });
  }

  // ── Determine overall risk ─────────────────────────────────────────────────
  const hasCritical = insights.some(i => i.severity === 'critical');
  const hasWarning = insights.some(i => i.severity === 'warning');
  const overallRisk: AiSummary['overallRisk'] = hasCritical ? 'CRITICAL' : hasWarning ? 'WARNING' : 'SAFE';

  // ── Data quality ──────────────────────────────────────────────────────────
  const dataQuality: AiSummary['dataQuality'] = 
    missingFeeds.length === 0 ? 'full' :
    missingFeeds.length <= 2 ? 'partial' :
    'empty';

  return { overallRisk, insights, dataQuality, missingFeeds };
}
