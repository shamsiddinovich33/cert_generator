import * as React from 'react';

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className = '', ...props }, ref) => (
    <div className="relative w-full overflow-auto rounded-xl border border-slate-200/60 dark:border-slate-800">
      <table ref={ref} className={`w-full caption-bottom text-sm ${className}`} {...props} />
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', ...props }, ref) => (
    <thead ref={ref} className={`bg-slate-50/70 border-b border-slate-250/60 dark:bg-slate-900/60 dark:border-slate-800 ${className}`} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', ...props }, ref) => (
    <tbody ref={ref} className={`divide-y divide-slate-100 dark:divide-slate-800/80 ${className}`} {...props} />
  )
);
TableBody.displayName = 'TableBody';

export const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', ...props }, ref) => (
    <tfoot ref={ref} className={`bg-slate-50 dark:bg-slate-900 border-t border-slate-200 ${className}`} {...props} />
  )
);
TableFooter.displayName = 'TableFooter';

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className = '', ...props }, ref) => (
    <tr
      ref={ref}
      className={`transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40 ${className}`}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className = '', ...props }, ref) => (
    <th
      ref={ref}
      className={`h-12 px-4 text-left align-middle font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs ${className}`}
      {...props}
    />
  )
);
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className = '', ...props }, ref) => (
    <td
      ref={ref}
      className={`p-4 align-middle text-slate-700 dark:text-slate-350 ${className}`}
      {...props}
    />
  )
);
TableCell.displayName = 'TableCell';
