export type User = {
  username: string;
  name: string;
  twoFactorEnabled: boolean;
};

export type AuthPayload = {
  token: string;
  user: User;
};

export type LoginPayload = {
  requiresTwoFactor: boolean;
  token: string | null;
  user: User;
};

export type TwoFactorSetup = {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
};

export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  error: {
    code: string;
    statusCode: number;
  };
};
