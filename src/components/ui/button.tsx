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
    'border-0 bg-primary text-primary-foreground font-sans font-semibold text-[13px] uppercase tracking-widest transition-all duration-200 hover:bg-accent disabled:opacity-40',
  secondary:
    'border border-border text-foreground font-sans font-semibold text-[13px] uppercase tracking-widest bg-transparent transition-all duration-200 hover:bg-surface disabled:opacity-40',
  ghost:
    'font-sans font-medium text-foreground border-b border-accent pb-0.5 hover:text-accent transition-colors duration-200 bg-transparent px-0 py-0 rounded-none normal-case tracking-normal min-h-0',
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
        'inline-flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed',
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
