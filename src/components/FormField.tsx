import React from 'react';
import { Loader2 } from 'lucide-react';

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  id,
  label,
  error,
  required = false,
  hint,
  children,
  className = '',
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold text-slate-300">
          {label}
          {required && <span className="text-red-400 ml-1" aria-hidden="true">*</span>}
        </label>
        {hint && (
          <span id={hintId} className="text-[11px] text-slate-500">
            {hint}
          </span>
        )}
      </div>

      <div className="relative">
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<any>, {
              id: (children as React.ReactElement<any>).props.id || id,
              'aria-invalid': !!error,
              'aria-describedby': error ? errorId : hint ? hintId : undefined,
              className: `${(children as React.ReactElement<any>).props.className || ''} ${
                error ? 'border-red-500 focus:ring-red-500/20' : ''
              }`.trim(),
            })
          : children}
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-400 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

export interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isSubmitting?: boolean;
  children: React.ReactNode;
}

export function SubmitButton({
  isSubmitting = false,
  disabled = false,
  children,
  className = '',
  ...props
}: SubmitButtonProps) {
  const isDisabled = disabled || isSubmitting;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-busy={isSubmitting}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      {...props}
    >
      {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export interface ServerErrorPayload {
  error?: string;
  message?: string;
  details?: Array<{ field?: string; path?: string | (string | number)[]; message: string }>;
}

export function mapServerErrors(payload: ServerErrorPayload): Record<string, string> {
  const errors: Record<string, string> = {};

  if (payload.details && Array.isArray(payload.details) && payload.details.length > 0) {
    for (const item of payload.details) {
      let fieldName = item.field;
      if (!fieldName && item.path) {
        fieldName = Array.isArray(item.path) ? item.path.join('.') : String(item.path);
      }
      if (fieldName) {
        errors[fieldName] = item.message;
      }
    }
  }

  if (Object.keys(errors).length === 0 && (payload.error || payload.message)) {
    errors['root'] = payload.error || payload.message || 'An error occurred';
  }

  return errors;
}
