import { useCallback, useEffect, useRef, useState } from 'react';

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function useOtpCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (seconds: number) => {
      clearTimer();
      setSecondsLeft(seconds);
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    },
    [clearTimer]
  );

  useEffect(() => {
    startTimer(initialSeconds);
    return clearTimer;
  }, [clearTimer, initialSeconds, startTimer]);

  const reset = useCallback(
    (nextSeconds = initialSeconds) => {
      startTimer(nextSeconds);
    },
    [initialSeconds, startTimer]
  );

  return {
    secondsLeft,
    formatted: formatCountdown(secondsLeft),
    canResend: secondsLeft === 0,
    isExpired: secondsLeft === 0,
    reset,
  };
}
