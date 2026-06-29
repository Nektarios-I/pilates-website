import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variants: Record<ButtonVariant, string> = {
  primary:
    'border-0 bg-[#2D3A1F] text-[#F4F1E8] font-sans font-semibold text-[13px] uppercase tracking-widest transition-all duration-200 hover:bg-[#B8A678] disabled:opacity-40',
  secondary:
    'border border-[#CDD2C9] text-[#2D3A1F] font-sans font-semibold text-[13px] uppercase tracking-widest bg-transparent transition-all duration-200 hover:bg-[#E8E2D0] disabled:opacity-40',
  ghost:
    'inline-flex min-h-11 items-center font-sans font-medium text-[#2D3A1F] border-b border-[#B8A678] px-1 py-2.5 hover:text-[#B8A678] transition-colors duration-200 bg-transparent rounded-none normal-case tracking-normal',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-4 py-2 rounded-full',
  md: 'min-h-11 px-8 py-4 rounded-full',
  lg: 'min-h-12 px-8 py-4 rounded-full',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8A678] disabled:cursor-not-allowed',
        variants[variant],
        variant !== 'ghost' ? sizes[size] : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
