import { useCallback, useEffect, useRef, useState } from 'react';

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

type OtpTimersOptions = {
  /** How long the OTP stays valid for verify. */
  expiresInSeconds: number;
  /** How soon the user can request another SMS (independent of expiry). */
  resendCooldownSeconds: number;
};

/**
 * Separate OTP expiry vs resend cooldown.
 * Users can resend after a short wait even while the previous code is still valid.
 */
export function useOtpCountdown({
  expiresInSeconds,
  resendCooldownSeconds,
}: OtpTimersOptions) {
  const [expiresLeft, setExpiresLeft] = useState(expiresInSeconds);
  const [resendLeft, setResendLeft] = useState(resendCooldownSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimers = useCallback(
    (expiresSeconds: number, resendSeconds: number) => {
      clearTimer();
      setExpiresLeft(expiresSeconds);
      setResendLeft(resendSeconds);
      intervalRef.current = setInterval(() => {
        setExpiresLeft((prev) => (prev > 0 ? prev - 1 : 0));
        setResendLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    },
    [clearTimer]
  );

  useEffect(() => {
    startTimers(expiresInSeconds, resendCooldownSeconds);
    return clearTimer;
  }, [clearTimer, expiresInSeconds, resendCooldownSeconds, startTimers]);

  const reset = useCallback(
    (
      nextExpiresSeconds = expiresInSeconds,
      nextResendSeconds = resendCooldownSeconds
    ) => {
      startTimers(nextExpiresSeconds, nextResendSeconds);
    },
    [expiresInSeconds, resendCooldownSeconds, startTimers]
  );

  return {
    expiresLeft,
    resendLeft,
    formattedExpires: formatCountdown(expiresLeft),
    formattedResend: formatCountdown(resendLeft),
    canResend: resendLeft === 0,
    isExpired: expiresLeft === 0,
    reset,
  };
}
