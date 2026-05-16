import type {
  AuthSession,
  MessageResponse,
  RefreshTokenResponse,
  User,
} from "@/types/domain/users";

export interface UserApiErrorResponse {
  error?: string;
  message?: string;
}

export type RegisterUserApiResponse = MessageResponse;
export type LoginUserApiResponse = AuthSession;
export type ForgotUsernameApiResponse = MessageResponse;
export type ForgotPasswordApiResponse = MessageResponse;
export type ChangePasswordApiResponse = MessageResponse;
export type VerifyEmailApiResponse = MessageResponse;
export type ResendVerificationApiResponse = MessageResponse;
export type ResetPasswordApiResponse = MessageResponse;
export type UpdateProfileApiResponse = User;
export type MeApiResponse = User;
export type RefreshTokenApiResponse = RefreshTokenResponse;
