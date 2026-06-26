import type { ReactNode } from 'react';

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
};

export function FormField({ id, label, error, required, hint, children }: FormFieldProps) {
  return (
    <div>
      <label className="block font-sans text-sm font-medium text-foreground" htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-destructive">
            *
          </span>
        )}
      </label>
      <div className="mt-2">{children}</div>
      {hint && !error && (
        <p className="mt-1.5 font-sans text-xs leading-5 text-foreground opacity-70" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-1.5 text-xs leading-5 text-destructive" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
