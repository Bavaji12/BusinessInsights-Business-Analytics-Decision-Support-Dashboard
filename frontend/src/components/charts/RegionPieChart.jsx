import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const REGION_COLORS = {
  North: '#2563eb',
  South: '#10b981',
  East: '#f59e0b',
  West: '#8b5cf6',
  Central: '#06b6d4',
};

const DEFAULT_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

export default function RegionPieChart({ data = [], loading = false }) {
  if (loading) {
    return <div className="h-72 flex items-center justify-center text-slate-400 text-sm">Loading regional data...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="h-72 flex items-center justify-center text-slate-400 text-sm">No regional sales data.</div>;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1 border border-slate-700">
          <p className="font-semibold text-slate-200">{p.region} Region</p>
          <p className="text-emerald-400 font-bold text-sm">
            ${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex justify-between gap-4 text-slate-300 pt-1 border-t border-slate-800">
            <span>Orders: {p.orders_count}</span>
            <span>Share: {p.percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="revenue"
            nameKey="region"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={REGION_COLORS[entry.region] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value, entry) => (
              <span className="text-xs font-medium text-slate-600">
                {value} ({entry.payload.percentage}%)
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
