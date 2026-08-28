import { Ionicons } from '@expo/vector-icons';

export type SettingsLegalItemId =
  | 'terms'
  | 'privacy'
  | 'about'
  | 'rate';

export type SettingsLegalItem = {
  id: SettingsLegalItemId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

/** Static Settings legal rows — actions wired in later stages */
export const SETTINGS_LEGAL_ITEMS: SettingsLegalItem[] = [
  { id: 'terms', label: 'Terms & Conditions', icon: 'document-text-outline' },
  { id: 'privacy', label: 'Privacy Policy', icon: 'shield-checkmark-outline' },
  { id: 'about', label: 'About Us', icon: 'information-circle-outline' },
  { id: 'rate', label: 'Rate Us', icon: 'star-outline' },
];
