import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import { cn } from "../../lib/utils/cn";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (
    message: string,
    type?: ToastType,
    options?: Partial<Omit<ToastProps, "id" | "message" | "type">>,
  ) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;

const toastConfig: Record<ToastType, { icon: string; colors: string }> = {
  success: {
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`,
    colors:
      "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300",
  },
  error: {
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />`,
    colors:
      "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300",
  },
  warning: {
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />`,
    colors:
      "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300",
  },
  info: {
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`,
    colors:
      "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = "info",
      options: Partial<Omit<ToastProps, "id" | "message" | "type">> = {},
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const newToast: ToastProps = {
        id,
        type,
        message,
        duration: DEFAULT_DURATION,
        ...options,
      };
      setToasts((prev) => [...prev, newToast]);
      return id;
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastContainerProps {
  toasts: ToastProps[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastProps;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const { id, type, message, duration, action } = toast;
  const [isLeaving, setIsLeaving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  const config = toastConfig[type];

  useEffect(() => {
    if (isPaused) return;

    const interval = 50;
    const step = 100 / ((duration || DEFAULT_DURATION) / interval);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - step;
        if (next <= 0) {
          setIsLeaving(true);
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, isPaused]);

  useEffect(() => {
    if (isLeaving) {
      const timer = setTimeout(() => onRemove(id), 300);
      return () => clearTimeout(timer);
    }
  }, [isLeaving, id, onRemove]);

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300 min-w-[320px] max-w-md overflow-hidden",
        config.colors,
        isLeaving ? "translate-x-full opacity-0" : "translate-x-0 opacity-100",
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="alert"
      aria-live="assertive"
    >
      <svg
        className="mt-0.5 h-5 w-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <g dangerouslySetInnerHTML={{ __html: config.icon }} />
      </svg>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{message}</p>
        {action && (
          <button
            type="button"
            onClick={() => {
              action.onClick();
              onRemove(id);
            }}
            className="mt-2 text-sm font-medium underline underline-offset-2 focus:outline-none focus:rounded focus:ring-2 focus:ring-current"
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          setIsLeaving(true);
        }}
        className="shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
        aria-label="Close notification"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-current opacity-30">
        <div
          className="h-full transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Standalone hook for apps without ToastProvider
let externalToastId = 0;
let externalToastListeners: Set<(toast: ToastProps) => void> = new Set();

export function showToast(
  message: string,
  type: ToastType = "info",
  options?: Partial<Omit<ToastProps, "id" | "message" | "type">>,
): string {
  const id = `toast-${++externalToastId}`;
  const toast: ToastProps = { id, type, message, ...options };
  externalToastListeners.forEach((listener) => listener(toast));
  return id;
}

export function useToastListener(callback: (toast: ToastProps) => void) {
  useEffect(() => {
    externalToastListeners.add(callback);
    return () => {
      externalToastListeners.delete(callback);
    };
  }, [callback]);
}
