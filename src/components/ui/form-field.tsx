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
      <label className="block font-sans text-sm font-medium text-[#2D3A1F]" htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>
      <div className="mt-2">{children}</div>
      {hint && !error && (
        <p className="mt-1.5 font-sans text-xs leading-5 text-[#2D3A1F] opacity-70" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-1.5 text-xs leading-5 text-red-600" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
