import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Spinner({ size = 'md', className = '', style }: { size?: 'sm' | 'md' | 'lg'; className?: string; style?: React.CSSProperties }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' };
  return (
    <Loader2
      className={`animate-spin ${sizeMap[size]} text-indigo-500 ${className}`}
      style={style}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-3">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 animate-ping absolute" />
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
      <span className="text-xs font-medium text-slate-400 dark:text-zinc-500 animate-pulse tracking-wide uppercase">
        Loading...
      </span>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse space-y-2 p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3.5 rounded-lg border bg-white/40 dark:bg-zinc-900/40 border-slate-100 dark:border-zinc-800">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 rounded-md flex-1 bg-slate-200/60 dark:bg-zinc-800/80" />
          ))}
        </div>
      ))}
    </div>
  );
}
