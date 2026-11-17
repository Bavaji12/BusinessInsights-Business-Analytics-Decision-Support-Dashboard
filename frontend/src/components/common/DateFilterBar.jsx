import React, { useState } from 'react';
import { useFilters } from '../../context/FilterContext';
import { Calendar, Filter, MapPin, Check } from 'lucide-react';

const PRESETS = [
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: '1y', label: 'This Year' },
  { id: 'all', label: 'All Time' },
  { id: 'custom', label: 'Custom Range' },
];

const REGIONS = ['All', 'North', 'South', 'East', 'West', 'Central'];

export default function DateFilterBar() {
  const {
    dateFilter,
    setDateFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    region,
    setRegion,
    addToast,
  } = useFilters();

  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate || '2026-10-01');
  const [tempEnd, setTempEnd] = useState(endDate || '2026-11-15');

  const handleSelectPreset = (id) => {
    setDateFilter(id);
    if (id === 'custom') {
      setIsCustomOpen(true);
    } else {
      setIsCustomOpen(false);
      addToast(`Date filter updated to ${PRESETS.find((p) => p.id === id)?.label}`, 'info');
    }
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!tempStart || !tempEnd) {
      addToast('Please select both start and end dates', 'warning');
      return;
    }
    setStartDate(tempStart);
    setEndDate(tempEnd);
    setDateFilter('custom');
    setIsCustomOpen(false);
    addToast(`Custom date range applied: ${tempStart} to ${tempEnd}`, 'info');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
      {/* Date Presets */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>Timeline:</span>
        </span>

        {PRESETS.map((preset) => {
          const isActive = dateFilter === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Region Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Region:</span>
        </span>
        <select
          value={region}
          onChange={(e) => {
            setRegion(e.target.value);
            addToast(`Region filter updated to: ${e.target.value}`, 'info');
          }}
          className="bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r === 'All' ? 'All Regions' : `${r} Region`}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Range Drawer / Modal */}
      {isCustomOpen && (
        <div className="w-full pt-3 mt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-slate-600">Select Date Range:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={tempStart}
              onChange={(e) => setTempStart(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-slate-400 text-xs font-medium">to</span>
            <input
              type="date"
              value={tempEnd}
              onChange={(e) => setTempEnd(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleApplyCustom}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Dates
          </button>
          <button
            onClick={() => setIsCustomOpen(false)}
            className="text-xs text-slate-500 hover:text-slate-700 py-1.5"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
