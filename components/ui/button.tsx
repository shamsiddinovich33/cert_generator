import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyle =
      'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer';

    const variants = {
      primary: 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 border border-indigo-500/10',
      secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-transparent',
      outline: 'border border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-300',
      danger: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-rose-500/20 border border-rose-500/10',
      ghost: 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 dark:hover:bg-slate-850 dark:text-slate-400 dark:hover:text-slate-100',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const classes = `${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`;

    return <button ref={ref} className={classes} {...props} />;
  }
);

Button.displayName = 'Button';
