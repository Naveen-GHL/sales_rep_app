export const FEATURES = {
  // Core Sales
  LEADS: 'leads',
  CUSTOMERS: 'customers',
  DEALS: 'deals',
  FOLLOWUPS: 'followups',

  // Calling
  CALLS: 'calls',
  CALL_RECORDING: 'call-recording',
  CALL_TRANSCRIPTION: 'call-transcription',

  // Jamin Bazaar Operations
  PROPERTIES: 'properties',
  SITE_VISITS: 'site-visits',
  BOOKINGS: 'bookings',

  // GHL India Ventures
  INVESTORS: 'investors',
  CONSULTATIONS: 'consultations',
  INVESTMENT_OPPORTUNITIES: 'investment-opportunities',

  // Analytics & Admin
  REPORTS: 'reports',
  USERS: 'users',
  ROLES: 'roles',
  COMPANY_SETTINGS: 'company-settings',
  AUDIT_LOGS: 'audit-logs',
} as const;

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES];
