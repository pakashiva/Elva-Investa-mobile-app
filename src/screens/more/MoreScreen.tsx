import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MenuListItem from '../../components/MenuListItem';
import { MENU_ITEMS } from '../../data/menu';
import {
  BRAND_LOGO,
  BRAND_NAME,
  BRAND_TAGLINE,
} from '../../constants/brandAssets';
import {
  MainTabParamList,
  MoreStackParamList,
} from '../../navigation/types';
import { navigateToSignIn } from '../../utils/authNavigation';
import { signOut } from '../../services/authService';
import { colors, spacing } from '../../theme/colors';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<MoreStackParamList, 'Menu'>,
  BottomTabNavigationProp<MainTabParamList>
>;

function menuPressHandler(itemId: string, navigation: Nav) {
  switch (itemId) {
    case 'accountOverview':
      return () => navigation.navigate('Home');
    case 'myInvestments':
      return () =>
        navigation.navigate('AddFunds', {
          screen: 'MyInvestments',
        });
    case 'bankDetails':
      return () => navigation.navigate('MyBankAccounts');
    case 'transactions':
      return () => navigation.navigate('Transactions');
    case 'referrals':
      return () => navigation.navigate('ReferEarn');
    case 'profile':
      return () => navigation.navigate('MyProfile');
    case 'settings':
      return () => navigation.navigate('Settings');
    case 'faq':
      return () => navigation.navigate('FAQ');
    case 'helpSupport':
      return () => navigation.navigate('HelpSupport');
    default:
      return undefined;
  }
}

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const handleLogout = async () => {
    try {
      await signOut();
      navigateToSignIn(navigation);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to log out right now.';
      Alert.alert('Logout failed', message);
    }
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
        <TouchableOpacity
          style={styles.closeBtn}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="close" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuCard}>
          <LinearGradient
            colors={['#3D2E8A', '#2B2D6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.brandBanner}
          >
            <View style={styles.brandLogoWrap}>
              <Image
                source={BRAND_LOGO}
                style={styles.brandLogo}
                resizeMode="contain"
                accessibilityLabel={`${BRAND_NAME} logo`}
              />
            </View>
            <Text style={styles.brandName}>{BRAND_NAME}</Text>
            <Text style={styles.brandTagline}>{BRAND_TAGLINE}</Text>
          </LinearGradient>

          <View style={styles.menuList}>
            {MENU_ITEMS.map((item, index) => (
              <MenuListItem
                key={item.id}
                item={item}
                showDivider={index < MENU_ITEMS.length - 1}
                onPress={menuPressHandler(item.id, navigation)}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutCard}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <View style={styles.logoutRow}>
            <Ionicons name="log-out-outline" size={22} color={colors.danger} />
            <Text style={styles.logoutText}>Logout</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingTop: 8,
    paddingBottom: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8EAEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 24,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  brandBanner: {
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: 'center',
  },
  brandLogoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    padding: 8,
  },
  brandLogo: {
    width: 52,
    height: 52,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  menuList: {
    paddingVertical: 4,
  },
  logoutCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },
});
