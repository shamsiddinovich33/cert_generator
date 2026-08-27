import * as React from 'react';

export interface ProgressProps {
  value: number; // 0 to 100
  className?: string;
}

export function Progress({ value, className = '' }: ProgressProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-200/20 ${className}`}>
      <div
        className="bg-gradient-to-r from-indigo-600 to-violet-600 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
