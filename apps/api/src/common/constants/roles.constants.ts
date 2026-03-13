export const ROLES = ['owner', 'admin', 'operator', 'mechanic', 'client'] as const;

export type Role = (typeof ROLES)[number];
