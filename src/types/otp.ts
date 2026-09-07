export type OtpMode = 'registration' | 'forgotPassword' | 'changePassword';

export type VerifyMobileNumberParams = {
  mode: OtpMode;
  email?: string;
  /** When true, send OTP once on screen entry (registration / password flows). */
  sendOtp?: boolean;
};
