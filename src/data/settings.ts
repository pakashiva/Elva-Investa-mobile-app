import { Ionicons } from '@expo/vector-icons';

export type SettingsLegalItemId = 'terms' | 'privacy' | 'about';

export type SettingsLegalItem = {
  id: SettingsLegalItemId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const SETTINGS_LEGAL_ITEMS: SettingsLegalItem[] = [
  { id: 'terms', label: 'Terms & Conditions', icon: 'document-text-outline' },
  { id: 'privacy', label: 'Privacy Policy', icon: 'shield-checkmark-outline' },
  { id: 'about', label: 'About Us', icon: 'information-circle-outline' },
];
