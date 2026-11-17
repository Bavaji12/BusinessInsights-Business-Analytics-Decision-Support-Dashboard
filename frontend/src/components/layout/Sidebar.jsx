import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Lightbulb,
  MessageSquare,
  Database,
  BarChart3,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sales', label: 'Sales Analytics', icon: TrendingUp },
  { id: 'customers', label: 'Customer Analytics', icon: Users },
  { id: 'insights', label: 'Business Insights', icon: Lightbulb, badge: 'Decision Engine' },
  { id: 'feedback', label: 'Customer Feedback', icon: MessageSquare },
  { id: 'data', label: 'Data Management', icon: Database },
];

export default function Sidebar({ activeTab, onSelectTab, isOpen, onClose }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Header & Logo */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  BusinessInsights
                </h1>
                <p className="text-[11px] text-blue-400 font-medium">ITOrizon Decision Suite</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-3">
            <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Core Modules
            </p>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded shadow-sm">
                        {item.badge}
                      </span>
                    ) : (
                      isActive && <ChevronRight className="w-4 h-4 text-blue-200" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Analyst Profile & System Status */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
              BA
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">Business Analyst</p>
              <p className="text-[11px] text-slate-400 truncate">assignment@itorizon.com</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live SQLite Data
            </span>
            <span className="text-slate-400 font-mono text-[10px]">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
