import type { User } from "./user";

export interface MessageResponse {
  message: string;
}

export interface AuthSession {
  user: User;
  access_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
}

export interface RegisterUserInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginUserInput {
  username: string;
  password: string;
}

export interface EmailInput {
  email: string;
}

export interface VerifyEmailInput {
  userId: string;
  code: string;
}

export interface ResendVerificationInput {
  userId: string;
}

export interface ResetPasswordInput {
  username: string;
  newPassword: string;
  token: string;
}

export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  address?: string;
}
