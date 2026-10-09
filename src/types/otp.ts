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
  /** Trader client code, required when recovering a password without a session. */
  clientCode?: string;
  /** When true, send OTP once on screen entry. */
  sendOtp?: boolean;
};
