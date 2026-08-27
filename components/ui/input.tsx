import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          type={type}
          className={`flex h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:focus:ring-indigo-500/20 ${
            error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''
          } ${className}`}
          ref={ref}
          {...props}
        />
        {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
