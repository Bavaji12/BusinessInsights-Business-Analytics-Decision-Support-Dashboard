import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function MonthlyCustomerGrowthChart({ data = [], loading = false }) {
  if (loading) {
    return <div className="h-72 flex items-center justify-center text-slate-400 text-sm">Loading growth trajectory...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="h-72 flex items-center justify-center text-slate-400 text-sm">No growth records available.</div>;
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1 border border-slate-700">
          <p className="font-semibold text-slate-200">{p.month}</p>
          <p className="text-emerald-400 font-bold text-sm">+{p.new_customers} New Customers</p>
          <div className="flex justify-between gap-4 text-slate-300 pt-1 border-t border-slate-800">
            <span>Cumulative: {p.total_customers}</span>
            <span>MoM Growth: {p.growth_rate_pct}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="total_customers"
            stroke="#0ea5e9"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#0ea5e9' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
