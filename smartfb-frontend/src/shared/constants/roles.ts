export const ROLES = {
  ADMIN: 'admin',
  OWNER: 'owner',
  STAFF: 'staff',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
