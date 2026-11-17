import React, { useState } from 'react';
import { Menu, RefreshCw, Download, Database, CheckCircle2 } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import api from '../../api/client';

export default function Topbar({ title, subtitle, onToggleMobileMenu, activeTab }) {
  const { triggerRefresh, addToast } = useFilters();
  const [loadingSample, setLoadingSample] = useState(false);

  const handleReloadSampleData = async () => {
    if (!window.confirm('Reset and reload realistic fictional sample business data (125 customers, 450 orders, 135 feedback)?')) {
      return;
    }
    setLoadingSample(true);
    try {
      const res = await api.post('/data/load-sample');
      addToast(res.data.message || 'Sample data loaded successfully!', 'success');
      triggerRefresh();
    } catch (err) {
      addToast(`Failed to load sample data: ${err.message}`, 'error');
    } finally {
      setLoadingSample(false);
    }
  };

  const handleQuickExport = () => {
    const entityMap = {
      dashboard: 'orders',
      sales: 'orders',
      customers: 'customers',
      insights: 'insights',
      feedback: 'feedback',
      data: 'orders',
    };
    const entity = entityMap[activeTab] || 'orders';
    window.open(`/api/data/export?entity=${entity}`, '_blank');
    addToast(`Exporting ${entity} report as CSV...`, 'info');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3.5 flex items-center justify-between transition-all">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Verified Fictional Sample Data
            </span>
          </div>
          {subtitle && <p className="text-xs text-slate-500 hidden md:block">{subtitle}</p>}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleReloadSampleData}
          disabled={loadingSample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
          title="Reset database and generate fresh realistic sample data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingSample ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">Load Sample Data</span>
        </button>

        <button
          onClick={handleQuickExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>
    </header>
  );
}
