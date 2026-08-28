import { useEffect, useState } from 'react';

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function useOtpCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const reset = () => {
    setSecondsLeft(initialSeconds);
  };

  return {
    secondsLeft,
    formatted: formatCountdown(secondsLeft),
    canResend: secondsLeft === 0,
    reset,
  };
}
