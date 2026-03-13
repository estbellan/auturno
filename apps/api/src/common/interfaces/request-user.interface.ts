import type { Permission } from '../constants/permissions.constants';
import type { Role } from '../constants/roles.constants';

export interface RequestUser {
  id: string;
  workshopId: string;
  email: string;
  roles: Role[];
  permissions: Permission[];
}
