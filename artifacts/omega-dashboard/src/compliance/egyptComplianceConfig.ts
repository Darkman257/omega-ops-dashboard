import type { ActionMode, RiskLevel } from './complianceTypes';

export const EGYPT_COMPLIANCE_CONFIG = {
  region: 'Egypt',
  currency: 'EGP',
  domains: {
    staff_management: {
      defaultMode: 'requires_review' as ActionMode,
      dataSensitivity: 'high' as RiskLevel
    },
    payroll_tax: {
      defaultMode: 'blocked' as ActionMode,
      dataSensitivity: 'critical' as RiskLevel
    },
    social_insurance: {
      defaultMode: 'blocked' as ActionMode,
      dataSensitivity: 'critical' as RiskLevel
    }
  },
  disclaimer: "Operational Guardrail Only. Not legal/accounting advice."
};
