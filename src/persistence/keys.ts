export const STORAGE_PREFIX = "ispf-lab";
export const KEYS = {
  catalog: (userid: string) => `${STORAGE_PREFIX}:catalog:v1:${userid.toUpperCase()}`,
  editProfiles: (userid: string) => `${STORAGE_PREFIX}:editprofile:v1:${userid.toUpperCase()}`,
  jes: (userid: string) => `${STORAGE_PREFIX}:jes:v1:${userid.toUpperCase()}`,
  progress: `${STORAGE_PREFIX}:progress:v1`,
  settings: `${STORAGE_PREFIX}:settings:v1`,
  lastUserid: `${STORAGE_PREFIX}:last-userid:v1`,
} as const;
