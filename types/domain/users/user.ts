export interface User {
  id: string;
  username: string;
  email: string;
  isEmailVerified: boolean;
  status: string;
  role: string;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
