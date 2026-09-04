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
import { OtpMode } from '../types/otp';

export type OtpFlow = OtpMode | null;

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  mobileVerified: boolean | null;
  isVerificationLoading: boolean;
  otpFlow: OtpFlow;
  bypassMobileVerification: boolean;
  setOtpFlow: (flow: OtpFlow) => void;
  clearOtpFlow: () => void;
  setBypassMobileVerification: (value: boolean) => void;
  refreshMobileVerified: () => Promise<boolean | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  // If the first profile read raced ahead of profile creation (common during
  // registration), retry once so mobileVerified becomes false instead of null.
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
      mobileVerified,
      isVerificationLoading,
      otpFlow,
      bypassMobileVerification,
      setOtpFlow,
      clearOtpFlow,
      setBypassMobileVerification,
      refreshMobileVerified,
    }),
    [
      session,
      isLoading,
      mobileVerified,
      isVerificationLoading,
      otpFlow,
      bypassMobileVerification,
      setOtpFlow,
      clearOtpFlow,
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
