// ⚠️  READ ONLY — owned by Mehetab
// Shared constants — import these in your portal

export const ROLES = {
  ADMIN: "admin",
  AMBULANCE: "ambulance_driver",
  DOCTOR: "doctor",
  NURSE: "nurse",
  WARDBOY: "wardboy",
};

export const CONDITIONS = {
  CRITICAL: "CRITICAL",
  SERIOUS: "SERIOUS",
  STABLE: "STABLE",
};

export const DB_PATHS = {
  BEDS: (hospitalId) => `/hospitals/${hospitalId}/beds`,
  ALERTS: (hospitalId) => `/hospitals/${hospitalId}/alerts`,
  PATIENTS: (hospitalId) => `/hospitals/${hospitalId}/patients`,
};

export const HOSPITAL_ID = "hospital1";
