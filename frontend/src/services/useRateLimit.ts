import { useState, useEffect } from "react";

export interface RateLimitState {
  isLimited: boolean;
  retryAfter: number;
  message: string;
}

export const useRateLimit = (error: string | null): RateLimitState => {
  const [retryAfter, setRetryAfter] = useState(0);

  useEffect(() => {
    if (error && error.includes("Try again in")) {
      // Extract the number from "Try again in X seconds"
      const match = error.match(/Try again in (\d+) seconds/);
      if (match) {
        const seconds = parseInt(match[1], 10);
        setRetryAfter(seconds);
      }
    }
  }, [error]);

  useEffect(() => {
    if (retryAfter > 0) {
      const timer = setTimeout(() => {
        setRetryAfter(retryAfter - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [retryAfter]);

  const isLimited = retryAfter > 0;
  const message = isLimited 
    ? `Rate limited! You can tap again in ${retryAfter} seconds`
    : error || "";

  return {
    isLimited,
    retryAfter,
    message,
  };
};
