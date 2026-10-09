import { useCallback, useEffect, useRef, useState } from 'react';

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

type OtpTimersOptions = {
  expiresInSeconds: number;
  resendCooldownSeconds: number;
};

/**
 * Separate OTP expiry vs resend cooldown.
 * Timers start only after reset() — typically when an OTP is actually sent.
 */
export function useOtpCountdown({
  expiresInSeconds,
  resendCooldownSeconds,
}: OtpTimersOptions) {
  const [started, setStarted] = useState(false);
  const [expiresLeft, setExpiresLeft] = useState(0);
  const [resendLeft, setResendLeft] = useState(0);
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
      setStarted(true);
      setExpiresLeft(expiresSeconds);
      setResendLeft(resendSeconds);
      intervalRef.current = setInterval(() => {
        setExpiresLeft((prev) => (prev > 0 ? prev - 1 : 0));
        setResendLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    },
    [clearTimer]
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

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
    canResend: started && resendLeft === 0,
    isExpired: started && expiresLeft === 0,
    started,
    reset,
  };
}
