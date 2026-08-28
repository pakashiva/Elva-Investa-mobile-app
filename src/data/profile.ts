/** Temporary dummy profile — matches reference; replaced by backend later */
export const DUMMY_PROFILE = {
  initials: 'VK',
  name: 'Venkatesh Kumar',
  customerId: 'CUST-00142',
  verified: true,
  portfolio: {
    totalInvested: '₹10,00,000',
    currentReturns: '₹2,35,750',
    cagrYield: '11.2%',
  },
  personal: {
    fullName: 'Venkatesh Kumar',
    panNumber: 'ABCDE1234F',
    dateOfBirth: '12 Oct 1985',
  },
  contact: {
    email: 'venkatesh.k@example.com',
    phone: '+91 98765 43210',
  },
  security: {
    twoFactorEnabled: true,
    twoFactorCaption: 'Verify log-in requests via OTP SMS',
    recentLoginDevice: 'Safari / iOS (iPhone 14)',
    recentLoginAt: '15 May, 14:32',
  },
} as const;
