import { Ionicons } from '@expo/vector-icons';

export type MenuItemId =
  | 'accountOverview'
  | 'myInvestments'
  | 'bankDetails'
  | 'transactions'
  | 'referrals'
  | 'profile'
  | 'faq'
  | 'helpSupport'
  | 'settings';

export type MenuItem = {
  id: MenuItemId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

/** Static menu entries — navigation/actions wired in later stages */
export const MENU_ITEMS: MenuItem[] = [
  { id: 'accountOverview', label: 'Account Overview', icon: 'grid-outline' },
  { id: 'myInvestments', label: 'My Investments', icon: 'trending-up-outline' },
  { id: 'bankDetails', label: 'Bank Details', icon: 'card-outline' },
  { id: 'transactions', label: 'Transactions', icon: 'pulse-outline' },
  { id: 'referrals', label: 'Referrals', icon: 'gift-outline' },
  { id: 'profile', label: 'Profile', icon: 'person-outline' },
  { id: 'faq', label: 'FAQ', icon: 'help-circle-outline' },
  { id: 'helpSupport', label: 'Help & Support', icon: 'call-outline' },
  { id: 'settings', label: 'Settings', icon: 'settings-outline' },
];
