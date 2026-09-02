export type UserProfileDetails = {
  fullName: string;
  mobileNumber: string;
  emailAddress: string;
  dateOfBirth: string;
  panNumber: string | null;
  verified: boolean;
};

export type MyProfileViewData = {
  profile: UserProfileDetails;
  initials: string;
  portfolio: {
    totalInvested: string;
    currentReturns: string;
    cagrYield: string;
  };
  security: {
    recentLoginAt: string;
  };
};
