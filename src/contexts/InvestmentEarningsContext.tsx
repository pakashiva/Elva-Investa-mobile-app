import React, { useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  processUserInvestmentInterest,
  resetInvestmentInterestProcessing,
} from '../services/investmentInterestService';
import { isMissingTableError } from '../utils/supabaseErrors';

/**
 * Runs investment interest accrual when the user session becomes available.
 * Idempotent — Postgres tracks completed 30-day periods.
 */
export function InvestmentEarningsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !session?.user?.id) {
      resetInvestmentInterestProcessing();
      return;
    }

    const userId = session.user.id;

    processUserInvestmentInterest(userId).catch((error) => {
      if (!isMissingTableError(error)) {
        console.warn('Investment interest processing failed:', error);
      }
    });
  }, [isAuthenticated, session?.user?.id]);

  return <>{children}</>;
}
