export type OtpMode = 'registration' | 'forgotPassword';

export type VerifyMobileNumberParams = {
  mode: OtpMode;
  email?: string;
  /** When true, send OTP once on screen entry (registration / forgot password). */
  sendOtp?: boolean;
};
