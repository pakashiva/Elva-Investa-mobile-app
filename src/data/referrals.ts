export const REFERRAL_LINK = 'rouru.com/ref/vk00142';

export const REFERRAL_STATS = [
  {
    id: 'total',
    label: 'Total Referrals',
    value: '12 Users',
    footer: '8 active verified',
  },
  {
    id: 'commission',
    label: 'Total Commission',
    value: '₹45,200',
    footer: 'Earned directly',
  },
  {
    id: 'pending',
    label: 'Pending',
    value: '₹12,500',
    footer: 'Processing',
  },
] as const;

export const REFERRAL_STEPS = [
  {
    step: '1',
    title: 'Share Invite Link',
    description:
      'Copy your unique referral key and share with business network partners.',
  },
  {
    step: '2',
    title: 'Friend Capitalizes',
    description:
      'When your friend creates an account and launches their initial investment.',
  },
  {
    step: '3',
    title: 'Earn 1% Commission',
    description:
      'Get a flat 1% interest credited immediately into your payout account.',
  },
] as const;

export const RECENT_REFERRALS = [
  {
    id: 'r1',
    name: 'Rajesh Kumar',
    meta: '24 May 2026 • Active',
    amount: '+ ₹10,000',
  },
  {
    id: 'r2',
    name: 'Ananya Sharma',
    meta: '18 May 2026 • Active',
    amount: '+ ₹2,500',
  },
] as const;
