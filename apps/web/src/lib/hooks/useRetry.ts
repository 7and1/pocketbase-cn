import { useState, useCallback } from "react";

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

interface RetryState {
  isLoading: boolean;
  error: Error | null;
  attempt: number;
}

export function useRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {},
) {
  const { maxAttempts = 3, delayMs = 1000, backoffMultiplier = 2 } = options;

  const [state, setState] = useState<RetryState>({
    isLoading: false,
    error: null,
    attempt: 0,
  });

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
      setState({ isLoading: true, error: null, attempt: 0 });

      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        setState({ isLoading: true, error: null, attempt: attempt + 1 });

        try {
          const result = await fn(...args);
          setState({ isLoading: false, error: null, attempt: attempt + 1 });
          return result;
        } catch (error) {
          lastError = error as Error;

          if (attempt < maxAttempts - 1) {
            const delay = delayMs * Math.pow(backoffMultiplier, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      setState({ isLoading: false, error: lastError, attempt: maxAttempts });
      return null;
    },
    [fn, maxAttempts, delayMs, backoffMultiplier],
  );

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, attempt: 0 });
  }, []);

  return {
    execute,
    reset,
    ...state,
  };
}
