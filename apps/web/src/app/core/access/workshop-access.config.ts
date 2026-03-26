import { CurrentUserViewModel } from '../api.service';

export type AppPermission =
  | 'workshop.manage'
  | 'users.manage'
  | 'services.manage'
  | 'appointments.manage'
  | 'workorders.read'
  | 'workorders.write'
  | 'diagnostics.write'
  | 'quotes.write'
  | 'payments.write'
  | 'clients.read'
  | 'clients.write'
  | 'metrics.read';

export interface WorkshopNavItem {
  labelKey: string;
  descriptionKey: string;
  icon: string;
  route: string;
  requiredPermissions: AppPermission[];
  group: 'management' | 'operations' | 'execution';
}

export const workshopRoutePermissions = {
  agenda: ['appointments.manage'] as AppPermission[],
  agendaIntake: ['appointments.manage'] as AppPermission[],
  services: ['services.manage'] as AppPermission[],
  workOrders: ['workorders.read'] as AppPermission[],
  workOrderDetail: ['workorders.read'] as AppPermission[],
  diagnostics: ['diagnostics.write'] as AppPermission[],
  quotes: ['quotes.write'] as AppPermission[],
  customers: ['clients.read'] as AppPermission[],
  vehicles: ['clients.read'] as AppPermission[],
  metrics: ['metrics.read'] as AppPermission[],
};

export const workshopNavItems: WorkshopNavItem[] = [
  {
    labelKey: 'nav.workshop.agenda',
    descriptionKey: 'nav.workshop.agenda',
    icon: 'calendar_today',
    route: '/workshop/agenda',
    requiredPermissions: workshopRoutePermissions.agenda,
    group: 'operations',
  },
  {
    labelKey: 'nav.workshop.workOrders',
    descriptionKey: 'nav.workshop.workOrders',
    icon: 'handyman',
    route: '/workshop/work-orders',
    requiredPermissions: workshopRoutePermissions.workOrders,
    group: 'execution',
  },
  {
    labelKey: 'nav.workshop.diagnostics',
    descriptionKey: 'nav.workshop.diagnostics',
    icon: 'manage_search',
    route: '/workshop/diagnostics',
    requiredPermissions: workshopRoutePermissions.diagnostics,
    group: 'execution',
  },
  {
    labelKey: 'nav.workshop.quotes',
    descriptionKey: 'nav.workshop.quotes',
    icon: 'request_quote',
    route: '/workshop/quotes',
    requiredPermissions: workshopRoutePermissions.quotes,
    group: 'operations',
  },
  {
    labelKey: 'nav.workshop.customers',
    descriptionKey: 'nav.workshop.customers',
    icon: 'group',
    route: '/workshop/customers',
    requiredPermissions: workshopRoutePermissions.customers,
    group: 'operations',
  },
  {
    labelKey: 'nav.workshop.vehicles',
    descriptionKey: 'nav.workshop.vehicles',
    icon: 'directions_car',
    route: '/workshop/vehicles',
    requiredPermissions: workshopRoutePermissions.vehicles,
    group: 'operations',
  },
  {
    labelKey: 'nav.workshop.services',
    descriptionKey: 'nav.workshop.services',
    icon: 'build',
    route: '/workshop/services',
    requiredPermissions: workshopRoutePermissions.services,
    group: 'management',
  },
  {
    labelKey: 'nav.workshop.metrics',
    descriptionKey: 'nav.workshop.metrics',
    icon: 'bar_chart',
    route: '/workshop/metrics',
    requiredPermissions: workshopRoutePermissions.metrics,
    group: 'management',
  },
];

export function hasRequiredPermissions(
  user: CurrentUserViewModel | null,
  requiredPermissions: AppPermission[] = [],
): boolean {
  if (!user) {
    return false;
  }

  return requiredPermissions.every((permission) =>
    user.permissions.includes(permission),
  );
}

export function getVisibleWorkshopNavItems(
  user: CurrentUserViewModel | null,
): WorkshopNavItem[] {
  return workshopNavItems.filter((item) =>
    hasRequiredPermissions(user, item.requiredPermissions),
  );
}

export function getDefaultWorkshopRoute(
  user: CurrentUserViewModel | null,
): string {
  return getVisibleWorkshopNavItems(user)[0]?.route ?? '/access-denied';
}

export function getWorkshopRoleSummary(user: CurrentUserViewModel | null): {
  labelKey: string;
  descriptionKey: string;
} {
  if (!user) {
    return {
      labelKey: 'role.session.label',
      descriptionKey: 'role.session.description',
    };
  }

  if (user.roles.includes('owner') || user.roles.includes('admin')) {
    return {
      labelKey: 'role.management.label',
      descriptionKey: 'role.management.description',
    };
  }

  if (user.roles.includes('operator')) {
    return {
      labelKey: 'role.operations.label',
      descriptionKey: 'role.operations.description',
    };
  }

  if (user.roles.includes('mechanic')) {
    return {
      labelKey: 'role.execution.label',
      descriptionKey: 'role.execution.description',
    };
  }

  return {
    labelKey: 'role.workshop.label',
    descriptionKey: 'role.workshop.description',
  };
}
