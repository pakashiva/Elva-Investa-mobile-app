export type OtpMode = 'registration' | 'recovery';

export type VerifyMobileNumberParams = {
  mode: OtpMode;
  email?: string;
};
