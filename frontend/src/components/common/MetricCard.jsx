import React from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

export default function MetricCard({
  title,
  value,
  icon: Icon,
  trendPct = null,
  trendLabel = 'vs previous period',
  formula = null,
  format = 'standard', // 'currency', 'number', 'percentage', 'rating'
  color = 'blue',
}) {
  const colorSchemes = {
    blue: {
      iconBg: 'bg-blue-50 text-blue-600',
      border: 'border-slate-200 hover:border-blue-300',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600',
      border: 'border-slate-200 hover:border-emerald-300',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600',
      border: 'border-slate-200 hover:border-amber-300',
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600',
      border: 'border-slate-200 hover:border-purple-300',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600',
      border: 'border-slate-200 hover:border-rose-300',
    },
  };

  const scheme = colorSchemes[color] || colorSchemes.blue;

  const renderTrend = () => {
    if (trendPct === null || trendPct === undefined) return null;

    const isPositive = trendPct > 0;
    const isZero = trendPct === 0;

    let badgeBg = 'bg-slate-100 text-slate-700';
    let TrendIcon = Minus;

    if (isPositive) {
      badgeBg = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      TrendIcon = TrendingUp;
    } else if (trendPct < 0) {
      badgeBg = 'bg-rose-50 text-rose-700 border border-rose-200';
      TrendIcon = TrendingDown;
    }

    return (
      <div className="flex items-center gap-1.5 mt-2">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold ${badgeBg}`}>
          <TrendIcon className="w-3 h-3" />
          {isPositive ? `+${trendPct}%` : `${trendPct}%`}
        </span>
        <span className="text-xs text-slate-400 font-normal">{trendLabel}</span>
      </div>
    );
  };

  return (
    <div
      className={`bg-white rounded-xl border p-5 shadow-sm transition-all duration-200 ${scheme.border} relative group`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">
            <span>{title}</span>
            {formula && (
              <span className="text-slate-400 hover:text-slate-700 cursor-help" title={formula}>
                <Info className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
          {renderTrend()}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl ${scheme.iconBg} shadow-sm shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
