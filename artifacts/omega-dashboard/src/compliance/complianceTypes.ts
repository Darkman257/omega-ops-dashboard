export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ComplianceDomain = 
  | 'operations'
  | 'staff_management'
  | 'personal_data'
  | 'labor_law'
  | 'social_insurance'
  | 'payroll_tax'
  | 'offboarding'
  | 'housing'
  | 'fleet'
  | 'employee_assets';

export type ActionMode = 
  | 'read_only'
  | 'draft'
  | 'requires_review'
  | 'requires_approval'
  | 'blocked';

export interface ComplianceGuardResult {
  allowed: boolean;
  mode: ActionMode;
  riskLevel: RiskLevel;
  message?: string;
  requiredApprovalRole?: string;
}
