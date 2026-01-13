import { type ReactNode, useState, useTransition, useCallback } from "react";
import { cn } from "../../lib/utils/cn";
import { useStore } from "@nanostores/react";
import { authToken, isAuthenticated } from "../../lib/stores/auth";
import { POCKETBASE_URL } from "../../lib/constants/config";

export interface ActionButtonProps {
  slug: string;
  endpoint: string;
  method?: "POST" | "DELETE";
  icon: ReactNode;
  activeIcon?: ReactNode;
  labels: {
    default: string;
    active: string;
    success?: string;
    removed?: string;
  };
  initialState?: boolean;
  count?: number;
  size?: "sm" | "md";
  onSuccess?: (data: unknown) => void;
  className?: string;
}

/**
 * Unified action button for Star/Vote/Toggle actions.
 * Handles authentication, loading states, optimistic updates, and error recovery.
 */
export function ActionButton({
  slug,
  endpoint,
  method = "POST",
  icon,
  activeIcon,
  labels,
  initialState = false,
  count = 0,
  size = "md",
  onSuccess,
  className,
}: ActionButtonProps) {
  const authed = useStore(isAuthenticated);
  const token = useStore(authToken);

  const [isActive, setIsActive] = useState(initialState);
  const [currentCount, setCurrentCount] = useState(count);
  const [pending, startPending] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const isLoading = pending;

  const handleClick = useCallback(async () => {
    if (!authed || !token) {
      // Redirect to login with return URL
      window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    if (isLoading) return;

    // Optimistic update
    const wasActive = isActive;
    const optimisticActive = !wasActive;
    const optimisticCount = optimisticActive
      ? currentCount + 1
      : Math.max(0, currentCount - 1);

    setIsActive(optimisticActive);
    setCurrentCount(optimisticCount);
    setError(null);

    startPending(() => {
      (async () => {
        try {
          const url = new URL(endpoint, POCKETBASE_URL);
          const response = await fetch(url.toString(), {
            method: optimisticActive ? "POST" : "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ slug }),
          });

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || `HTTP ${response.status}`);
          }

          const data = await response.json();

          // Show success feedback
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);

          onSuccess?.(data);
        } catch (e) {
          // Rollback on error
          setIsActive(wasActive);
          setCurrentCount(currentCount);
          setError(e instanceof Error ? e.message : "操作失败");
          setTimeout(() => setError(null), 3000);
        }
      })();
    });
  }, [
    authed,
    token,
    isLoading,
    isActive,
    currentCount,
    endpoint,
    startPending,
  ]);

  const sizeStyles = {
    sm: "gap-1 px-2 py-1 text-xs",
    md: "gap-1.5 px-2.5 py-1.5 text-sm",
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-label={isActive ? labels.active : labels.default}
      aria-pressed={isActive}
      className={cn(
        "inline-flex items-center rounded-md border font-medium outline-none transition-colors",
        "focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        isActive
          ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-950 dark:text-brand-300"
          : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-200",
        sizeStyles[size],
        className,
      )}
    >
      {showSuccess ? (
        <>
          <svg
            className="h-4 w-4 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="sr-only">
            {isActive
              ? labels.success || labels.active
              : labels.removed || labels.default}
          </span>
        </>
      ) : isLoading ? (
        <svg
          className="h-4 w-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth={4}
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : isActive && activeIcon ? (
        activeIcon
      ) : (
        icon
      )}
      <span className="tabular-nums">
        {currentCount > 0 ? currentCount : ""}
      </span>
      {error && (
        <span className="sr-only" role="alert">
          {error}
        </span>
      )}
    </button>
  );
}
