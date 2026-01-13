import { type ReactNode, forwardRef, useId } from "react";
import { cn } from "../../lib/utils/cn";

export interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (props: {
    id: string;
    errorId: string | undefined;
    hintId: string | undefined;
    hasError: boolean;
    ariaDescribedBy: string | undefined;
  }) => ReactNode;
}

export const FormField = ({
  label,
  error,
  hint,
  required,
  children,
}: FormFieldProps) => {
  const generatedId = useId();
  const id = `field-${generatedId}`;
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const hasError = Boolean(error);
  const ariaDescribedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <FormLabel id={id} required={required}>
          {label}
        </FormLabel>
      )}
      {children({ id, errorId, hintId, hasError, ariaDescribedBy })}
      {error && <FormError id={errorId}>{error}</FormError>}
      {hint && !error && <FormHint id={hintId}>{hint}</FormHint>}
    </div>
  );
};

export interface FormLabelProps {
  id: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ id, required, children, className, ...props }, ref) => (
    <label
      ref={ref}
      htmlFor={id}
      className={cn(
        "text-sm font-medium text-neutral-900 dark:text-neutral-100",
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  ),
);
FormLabel.displayName = "FormLabel";

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ error, className, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={error}
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
  ),
);
FormInput.displayName = "FormInput";

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ error, className, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={error}
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
  ),
);
FormTextarea.displayName = "FormTextarea";

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ error, className, placeholder, children, ...props }, ref) => (
    <select
      ref={ref}
      aria-invalid={error}
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
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  ),
);
FormSelect.displayName = "FormSelect";

export interface FormErrorProps {
  id?: string;
  children: ReactNode;
  className?: string;
}

export const FormError = ({ id, children, className }: FormErrorProps) => (
  <p
    id={id}
    className={cn("text-xs text-red-600 dark:text-red-400", className)}
    role="alert"
  >
    {children}
  </p>
);

export interface FormHintProps {
  id?: string;
  children: ReactNode;
  className?: string;
}

export const FormHint = ({ id, children, className }: FormHintProps) => (
  <p
    id={id}
    className={cn("text-xs text-neutral-500 dark:text-neutral-400", className)}
  >
    {children}
  </p>
);

export type ValidationRule<T = unknown> = {
  validate: (value: T) => boolean | string;
  message?: string;
};

export type FieldValidation<T> = {
  value: T;
  rules?: ValidationRule<T>[];
};

export function validateField<T>({
  value,
  rules,
}: FieldValidation<T>): string | null {
  if (!rules?.length) return null;
  for (const rule of rules) {
    const result = rule.validate(value);
    if (result === false) return rule.message || "Validation failed";
    if (typeof result === "string") return result;
  }
  return null;
}

export type FormErrors<T extends Record<string, unknown>> = Partial<
  Record<keyof T, string>
>;

export function hasFormErrors<T extends Record<string, unknown>>(
  errors: FormErrors<T>,
): boolean {
  return Object.values(errors).some((error) => Boolean(error));
}
