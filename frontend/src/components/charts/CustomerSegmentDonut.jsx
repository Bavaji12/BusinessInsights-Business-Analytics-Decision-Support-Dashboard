import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const SEGMENT_COLORS = {
  'High Value': '#10b981', // Emerald
  Regular: '#2563eb',    // Blue
  New: '#06b6d4',        // Cyan
  'At Risk': '#f43f5e',   // Rose
};

export default function CustomerSegmentDonut({ data = [], loading = false }) {
  if (loading) {
    return <div className="h-72 flex items-center justify-center text-slate-400 text-sm">Loading segments...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="h-72 flex items-center justify-center text-slate-400 text-sm">No segmentation data.</div>;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1 border border-slate-700">
          <p className="font-semibold text-slate-200">{p.segment}</p>
          <p className="text-emerald-400 font-bold text-sm">
            {p.count} Customers ({p.percentage}%)
          </p>
          <div className="flex justify-between gap-4 text-slate-300 pt-1 border-t border-slate-800">
            <span>Total: ${p.total_revenue?.toLocaleString() || 0}</span>
            <span>Avg Spend: ${p.avg_spend || 0}</span>
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
            innerRadius={55}
            outerRadius={85}
            paddingAngle={4}
            dataKey="count"
            nameKey="segment"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={SEGMENT_COLORS[entry.segment] || '#94a3b8'} />
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
