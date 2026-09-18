import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getMobileVerifiedStatus } from '../services/profileService';
import { loadPendingRegistration } from '../services/registrationPendingStore';
import { isUnlockWindowValid } from '../services/sessionUnlockStore';
import { OtpMode } from '../types/otp';

export type OtpFlow = OtpMode | null;

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** 15-day unlock window still valid for this user. */
  unlockWindowValid: boolean | null;
  isUnlockLoading: boolean;
  /**
   * True after successful MPIN unlock or password login this process.
   * Resets on cold start so MPIN is required every app open when session is valid.
   */
  appUnlocked: boolean;
  mobileVerified: boolean | null;
  isVerificationLoading: boolean;
  otpFlow: OtpFlow;
  bypassMobileVerification: boolean;
  setOtpFlow: (flow: OtpFlow) => void;
  clearOtpFlow: () => void;
  setBypassMobileVerification: (value: boolean) => void;
  markAppUnlocked: () => void;
  lockApp: () => void;
  refreshUnlockWindow: () => Promise<boolean | null>;
  refreshMobileVerified: () => Promise<boolean | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unlockWindowValid, setUnlockWindowValid] = useState<boolean | null>(
    null
  );
  const [isUnlockLoading, setIsUnlockLoading] = useState(false);
  const [appUnlocked, setAppUnlocked] = useState(false);
  const [mobileVerified, setMobileVerified] = useState<boolean | null>(null);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [otpFlow, setOtpFlowState] = useState<OtpFlow>(null);
  const [bypassMobileVerification, setBypassMobileVerification] =
    useState(false);
  const profileRetryUserIdRef = React.useRef<string | null>(null);

  const setOtpFlow = useCallback((flow: OtpFlow) => {
    setOtpFlowState(flow);
  }, []);

  const clearOtpFlow = useCallback(() => {
    setOtpFlowState(null);
  }, []);

  const markAppUnlocked = useCallback(() => {
    setAppUnlocked(true);
  }, []);

  const lockApp = useCallback(() => {
    setAppUnlocked(false);
  }, []);

  const refreshUnlockWindow = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setUnlockWindowValid(null);
      return null;
    }
    setIsUnlockLoading(true);
    try {
      const valid = await isUnlockWindowValid(userId);
      setUnlockWindowValid(valid);
      return valid;
    } catch (error) {
      console.error(
        'Failed to check unlock window:',
        error instanceof Error ? error.message : error
      );
      setUnlockWindowValid(false);
      return false;
    } finally {
      setIsUnlockLoading(false);
    }
  }, [session?.user?.id]);

  const loadMobileVerified = useCallback(
    async (userId: string | undefined, showLoading = true) => {
      if (!userId) {
        setMobileVerified(null);
        return null;
      }

      if (showLoading) {
        setIsVerificationLoading(true);
      }

      try {
        const verified = await getMobileVerifiedStatus(userId);
        setMobileVerified(verified);
        return verified;
      } catch (error) {
        console.error(
          'Failed to load mobile verification status:',
          error instanceof Error ? error.message : error
        );
        setMobileVerified(null);
        return null;
      } finally {
        if (showLoading) {
          setIsVerificationLoading(false);
        }
      }
    },
    []
  );

  const refreshMobileVerified = useCallback(async () => {
    return loadMobileVerified(session?.user?.id, false);
  }, [loadMobileVerified, session?.user?.id]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) {
        return;
      }
      if (error) {
        console.error('Failed to restore auth session:', error.message);
      }
      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);

      if (event === 'SIGNED_OUT') {
        setBypassMobileVerification(false);
        setOtpFlowState(null);
        setMobileVerified(null);
        setUnlockWindowValid(null);
        setAppUnlocked(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadMobileVerified(session?.user?.id);
  }, [loadMobileVerified, session?.user?.id]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setUnlockWindowValid(null);
      return;
    }

    let cancelled = false;
    setIsUnlockLoading(true);
    void isUnlockWindowValid(userId)
      .then((valid) => {
        if (!cancelled) {
          setUnlockWindowValid(valid);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUnlockWindowValid(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsUnlockLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (
      !session?.user?.id ||
      bypassMobileVerification ||
      isVerificationLoading ||
      mobileVerified !== false ||
      otpFlow !== null
    ) {
      return;
    }

    setOtpFlowState('registration');
  }, [
    session?.user?.id,
    bypassMobileVerification,
    isVerificationLoading,
    mobileVerified,
    otpFlow,
  ]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (
      !userId ||
      bypassMobileVerification ||
      isVerificationLoading ||
      mobileVerified !== null ||
      otpFlow !== null
    ) {
      return;
    }

    let cancelled = false;
    void loadPendingRegistration(userId).then((pending) => {
      if (!cancelled && pending) {
        setOtpFlowState('registration');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    session?.user?.id,
    bypassMobileVerification,
    isVerificationLoading,
    mobileVerified,
    otpFlow,
  ]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      profileRetryUserIdRef.current = null;
      return;
    }

    if (
      bypassMobileVerification ||
      isVerificationLoading ||
      mobileVerified !== null ||
      profileRetryUserIdRef.current === userId
    ) {
      return;
    }

    const timer = setTimeout(() => {
      profileRetryUserIdRef.current = userId;
      void loadMobileVerified(userId, false);
    }, 600);

    return () => clearTimeout(timer);
  }, [
    session?.user?.id,
    bypassMobileVerification,
    isVerificationLoading,
    mobileVerified,
    loadMobileVerified,
  ]);

  const value = useMemo(
    () => ({
      session,
      isLoading,
      isAuthenticated: Boolean(session),
      unlockWindowValid,
      isUnlockLoading,
      appUnlocked,
      mobileVerified,
      isVerificationLoading,
      otpFlow,
      bypassMobileVerification,
      setOtpFlow,
      clearOtpFlow,
      setBypassMobileVerification,
      markAppUnlocked,
      lockApp,
      refreshUnlockWindow,
      refreshMobileVerified,
    }),
    [
      session,
      isLoading,
      unlockWindowValid,
      isUnlockLoading,
      appUnlocked,
      mobileVerified,
      isVerificationLoading,
      otpFlow,
      bypassMobileVerification,
      setOtpFlow,
      clearOtpFlow,
      markAppUnlocked,
      lockApp,
      refreshUnlockWindow,
      refreshMobileVerified,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
