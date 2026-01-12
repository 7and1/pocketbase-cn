import { type InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "../../lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <label className="space-y-1.5">
        {label && (
          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {label}
            {props.required && <span className="text-red-500"> *</span>}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors",
            "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
            "dark:bg-neutral-950",
            error
              ? "border-red-500 bg-red-50 dark:bg-red-950/20"
              : "border-neutral-200 bg-white dark:border-neutral-800",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        {error && (
          <p
            id={errorId}
            className="text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            id={hintId}
            className="text-xs text-neutral-500 dark:text-neutral-400"
          >
            {hint}
          </p>
        )}
      </label>
    );
  },
);

Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = error ? `${textareaId}-error` : undefined;
    const hintId = hint ? `${textareaId}-hint` : undefined;

    return (
      <label className="space-y-1.5">
        {label && (
          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {label}
            {props.required && <span className="text-red-500"> *</span>}
          </div>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors",
            "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
            "dark:bg-neutral-950",
            error
              ? "border-red-500 bg-red-50 dark:bg-red-950/20"
              : "border-neutral-200 bg-white dark:border-neutral-800",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        {error && (
          <p
            id={errorId}
            className="text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            id={hintId}
            className="text-xs text-neutral-500 dark:text-neutral-400"
          >
            {hint}
          </p>
        )}
      </label>
    );
  },
);

Textarea.displayName = "Textarea";
