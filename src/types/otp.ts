export type OtpMode =
  | 'registration'
  | 'forgotMpin'
  | 'changeMpin'
  | 'forgotPassword'
  | 'changePassword';

export type VerifyMobileNumberParams = {
  mode: OtpMode;
  email?: string;
  /** Pending registration mobile (used before profile exists). */
  mobileNumber?: string;
  /** When true, send OTP once on screen entry. */
  sendOtp?: boolean;
};
