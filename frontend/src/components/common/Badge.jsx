import React from 'react';

const VARIANT_MAP = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  default: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';
  const colorClass = VARIANT_MAP[variant] || VARIANT_MAP.default;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${sizeClasses} ${colorClass} ${className}`}
    >
      {children}
    </span>
  );
}
