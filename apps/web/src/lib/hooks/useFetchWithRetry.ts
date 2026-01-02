import { useState, useCallback, useRef } from "react";

interface FetchOptions extends RequestInit {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export function useFetchWithRetry<T = unknown>() {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (url: string, options: FetchOptions = {}): Promise<T | null> => {
      const {
        maxAttempts = 3,
        delayMs = 1000,
        backoffMultiplier = 2,
        ...fetchOptions
      } = options;

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setState({ data: null, isLoading: true, error: null });

      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const response = await fetch(url, {
            ...fetchOptions,
            signal: abortControllerRef.current.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          setState({ data, isLoading: false, error: null });
          return data;
        } catch (error) {
          lastError = error as Error;

          // Don't retry if it's an abort error
          if (error instanceof Error && error.name === "AbortError") {
            setState({ data: null, isLoading: false, error: lastError });
            return null;
          }

          // Retry on network errors or 5xx errors
          if (attempt < maxAttempts - 1) {
            const delay = delayMs * Math.pow(backoffMultiplier, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      setState({ data: null, isLoading: false, error: lastError });
      return null;
    },
    [],
  );

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
