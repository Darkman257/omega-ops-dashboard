import { AttendanceMetrics } from '@/hooks/useAttendanceMetrics';

export interface OpsInsight {
  severity: 'safe' | 'warning' | 'critical';
  title: string;
  reason: string;
  action: string;
  impact: string;
}

export interface OpsDiagnosis {
  labor: string;
  fleet: string;
  housing: string;
  attendance: string;
  deployment: string;
}

export interface OpsMaestroReport {
  overallRisk: 'SAFE' | 'WARNING' | 'CRITICAL';
  diagnosis: OpsDiagnosis;
  immediateActions: string[];
  missingDataRadar: string[];
  insights: OpsInsight[];
}

export function buildOpsMaestroReport(data: {
  employees: any[];
  vehicles: any[];
  payrollRecords: any[];
  projects: any[];
  housingUnits: any[];
  attendanceMetrics: AttendanceMetrics;
  activeEmployees: number;
  activeVehicles: number;
  cashBurnToday: number;
}): OpsMaestroReport {
  const { 
    employees, vehicles, payrollRecords, projects, 
    housingUnits, attendanceMetrics, activeEmployees, 
    activeVehicles, cashBurnToday 
  } = data;

  const totalEmployees = employees.length;
  const totalVehicles = vehicles.length;
  const totalHousingCapacity = housingUnits.reduce((acc, u) => acc + (u.capacity || 0), 0);
  const totalOccupants = housingUnits.reduce((acc, u) => acc + (u.occupants || 0), 0);

  const missingDataRadar: string[] = [];
  if (!attendanceMetrics.hasLiveData) missingDataRadar.push('Attendance breakdown missing');
  if (housingUnits.some(u => !u.capacity)) missingDataRadar.push('Housing capacity definitions missing');
  if (payrollRecords.length === 0) missingDataRadar.push('Payroll/Cash burn data missing');
  if (vehicles.some(v => !v.maintenanceCost)) missingDataRadar.push('Fleet maintenance data incomplete');
  if (projects.length === 0) missingDataRadar.push('Site progress monitoring idle');

  // Diagnosis
  const diagnosis: OpsDiagnosis = {
    labor: totalEmployees > 0 
      ? `Workforce is at ${Math.round((activeEmployees / totalEmployees) * 100)}% utilization. ${activeEmployees} on duty.` 
      : 'No workforce data connected.',
    fleet: totalVehicles > 0 
      ? `Fleet availability is ${Math.round((activeVehicles / totalVehicles) * 100)}%. ${activeVehicles} units active.` 
      : 'No fleet data connected.',
    housing: totalHousingCapacity > 0 
      ? `Housing occupancy is at ${Math.round((totalOccupants / totalHousingCapacity) * 100)}%. ${totalHousingCapacity - totalOccupants} beds remaining.` 
      : 'Housing capacity not defined.',
    attendance: attendanceMetrics.hasLiveData 
      ? `Live attendance feed is operational. Late/Absent rate: ${Math.round((attendanceMetrics.absent / totalEmployees) * 100)}%.` 
      : 'Attendance feed is currently offline or manual.',
    deployment: projects.length > 0 
      ? `Operations span ${projects.length} sites. Deployment density is stable.` 
      : 'No active project deployment detected.'
  };

  // Immediate Actions
  const immediateActions: string[] = [];
  
  if (totalOccupants > totalHousingCapacity && totalHousingCapacity > 0) {
    immediateActions.push('Redistribute occupants: Current housing exceeds defined capacity.');
  }
  if (!attendanceMetrics.hasLiveData) {
    immediateActions.push('Import latest attendance CSV to restore real-time workforce visibility.');
  }
  if (vehicles.length > 0 && vehicles.every(v => !v.lastService)) {
    immediateActions.push('Schedule fleet maintenance check: Missing service history for active units.');
  }
  if (projects.length > 0 && cashBurnToday > 50000) {
    immediateActions.push('Conduct supervisor cost review: Daily burn rate exceeds safety threshold.');
  }
  if (missingDataRadar.length > 3) {
    immediateActions.push('Escalate data integration: Core operational feeds are disconnected.');
  }

  // Insights
  const insights: OpsInsight[] = [];
  
  if (attendanceMetrics.absent > totalEmployees * 0.2) {
    insights.push({
      severity: 'critical',
      title: 'High Absenteeism Risk',
      reason: 'Over 20% of the workforce is currently absent, impacting project SLAs.',
      action: 'Deploy emergency backup crew or pause non-critical site tasks.',
      impact: 'Delayed site handovers and increased overtime costs.'
    });
  }

  if (totalOccupants >= totalHousingCapacity && totalHousingCapacity > 0) {
    insights.push({
      severity: 'warning',
      title: 'Housing Saturation',
      reason: 'Housing units are at 100% capacity. No room for incoming site transfers.',
      action: 'Lease additional units or optimize current room allocations.',
      impact: 'Operational bottleneck for new project mobilization.'
    });
  }

  const overallRisk = insights.some(i => i.severity === 'critical') ? 'CRITICAL' : 
                    insights.some(i => i.severity === 'warning') ? 'WARNING' : 'SAFE';

  return {
    overallRisk,
    diagnosis,
    immediateActions,
    missingDataRadar,
    insights
  };
}
