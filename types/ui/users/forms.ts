export interface RegisterFormState {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormState {
  username: string;
  password: string;
}

export interface ForgotUsernameFormState {
  email: string;
}

export interface ForgotPasswordFormState {
  email: string;
}

export interface VerifyEmailFormState {
  userId: string;
  code: string;
}

export interface ResetPasswordFormState {
  username: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AccountProfileFormState {
  name: string;
  phone: string;
  address: string;
}

export interface ChangePasswordFormState {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
