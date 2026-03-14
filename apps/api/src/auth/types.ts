export type Role = 'owner' | 'admin' | 'operator' | 'mechanic' | 'client';

export interface AuthClaims {
  sub: string;
  email?: string;
  name?: string;
  permissions?: string[];
}

export interface CurrentUserContext {
  id: string;
  authSubject: string;
  email: string;
  name: string;
  workshopId: string | null;
  roles: Role[];
  permissions: string[];
}
