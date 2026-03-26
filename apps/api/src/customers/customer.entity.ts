export interface CustomerEntity {
  id: string;
  workshopId: string;
  authSubject: string | null;
  inviteStatus: 'not_invited' | 'invited' | 'claimed';
  name: string;
  phone: string | null;
  email: string | null;
  invitedAt: string | null;
  claimedAt: string | null;
  createdAt: string;
}
