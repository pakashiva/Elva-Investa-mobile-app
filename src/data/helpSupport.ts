import { Ionicons } from '@expo/vector-icons';

export type HelpContactItem = {
  id: string;
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: 'phone' | 'email' | 'none';
};

export const HELP_SUPPORT_HOURS = 'Monday to Saturday, 9:30 AM – 6:30 PM IST';

export const HELP_SUPPORT_CONTACTS: HelpContactItem[] = [
  {
    id: 'phone',
    label: 'Customer Care',
    value: '+91 98234 56781',
    icon: 'call-outline',
    action: 'phone',
  },
  {
    id: 'email',
    label: 'Support Email',
    value: 'support@roxrufinancial.in',
    icon: 'mail-outline',
    action: 'email',
  },
  {
    id: 'address',
    label: 'Registered Office',
    value:
      'Unit 502, Raheja Platinum, Off Andheri-Kurla Road, Marol, Andheri East, Mumbai, Maharashtra 400059',
    icon: 'location-outline',
    action: 'none',
  },
];
