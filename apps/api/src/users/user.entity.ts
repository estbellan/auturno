import { Role } from '../auth/types';

export interface UserEntity {
  id: string;
  authSubject: string;
  email: string;
  name: string;
  workshopId: string | null;
  roles: Role[];
  permissions: string[];
}
