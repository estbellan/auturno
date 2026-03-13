export const PERMISSIONS = [
  'workshop.manage',
  'users.manage',
  'services.manage',
  'appointments.manage',
  'workorders.read',
  'workorders.write',
  'diagnostics.write',
  'quotes.write',
  'payments.write',
  'clients.read',
  'clients.write',
  'metrics.read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];
