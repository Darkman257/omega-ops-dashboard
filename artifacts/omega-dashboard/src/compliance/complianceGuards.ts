import type { ComplianceGuardResult, ActionMode, RiskLevel } from './complianceTypes';

/**
 * Validates manual employee entry fields for Egyptian compliance.
 */
export const validateManualEmployeeEntry = (fields: Record<string, any>): ComplianceGuardResult => {
  const mandatoryFields = [
    'name', 'phone', 'role', 'department', 'hireDate', 
    'currentSite', 'status', 'insuranceStatus'
  ];
  
  const missing = mandatoryFields.filter(f => !fields[f]);
  
  if (missing.length > 0) {
    return {
      allowed: true,
      mode: 'requires_review',
      riskLevel: 'medium',
      message: `Missing mandatory compliance fields: ${missing.join(', ')}`
    };
  }
  
  return { allowed: true, mode: 'requires_review', riskLevel: 'low' };
};

/**
 * Evaluates Omega operations actions.
 */
export const evaluateOmegaAction = (actionType: string, payload?: any): ComplianceGuardResult => {
  switch (actionType) {
    case 'VIEW_STAFF':
    case 'VIEW_ANALYTICS':
      return { allowed: true, mode: 'read_only', riskLevel: 'low' };

    case 'CREATE_STAFF_MANUAL':
      return { 
        allowed: true, 
        mode: 'requires_review', 
        riskLevel: 'medium',
        message: "Manual entry requires checklist verification."
      };

    case 'OFFBOARD_STAFF':
      const hasClearance = payload?.has_clearance_form;
      return { 
        allowed: true, 
        mode: hasClearance ? 'requires_approval' : 'blocked', 
        riskLevel: 'high',
        message: hasClearance ? "Awaiting HR offboarding approval." : "Offboarding blocked: No Clearance Form (إخلاء طرف) detected."
      };

    case 'EDIT_PAYROLL_TAX':
      return { 
        allowed: false, 
        mode: 'blocked', 
        riskLevel: 'critical',
        message: "Direct payroll/tax edits are blocked. Use Audit/Draft workflow."
      };

    case 'DELETE_STAFF':
      return { 
        allowed: false, 
        mode: 'blocked', 
        riskLevel: 'critical',
        message: "Hard deletion of staff is forbidden. Use status: 'Inactive'."
      };

    default:
      return { allowed: true, mode: 'requires_review', riskLevel: 'medium' };
  }
};
