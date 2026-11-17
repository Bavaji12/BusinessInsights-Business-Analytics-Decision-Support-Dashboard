import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import api from '../api/client';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import {
  Users,
  UserCheck,
  UserPlus,
  Repeat,
  DollarSign,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Info,
} from 'lucide-react';

const REGIONS = ['All', 'North', 'South', 'East', 'West', 'Central'];
const SEGMENTS = ['All', 'High Value', 'Regular', 'New', 'At Risk'];

export default function CustomerAnalyticsPage() {
  const { refreshKey, addToast } = useFilters();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [segment, setSegment] = useState('All');

  useEffect(() => {
    let isMounted = true;
    async function fetchCustomerData() {
      setLoading(true);
      try {
        const params = {
          page,
          page_size: 15,
          search: search.trim() || undefined,
          region: region !== 'All' ? region : undefined,
          segment: segment !== 'All' ? segment : undefined,
        };

        const res = await api.get('/customers', { params });
        if (isMounted) {
          setSummary(res.data.summary);
          setCustomers(res.data.customers || []);
          setTotalRecords(res.data.total_records || 0);
          setTotalPages(res.data.total_pages || 1);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load customer analytics:', err);
          addToast('Failed to load customer analytics: ' + err.message, 'error');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCustomerData();
    return () => {
      isMounted = false;
    };
  }, [page, search, region, segment, refreshKey, addToast]);

  const handleExportCSV = () => {
    window.open('/api/data/export?entity=customers', '_blank');
    addToast('Exporting Customer Analytics report as CSV...', 'info');
  };

  const getSegmentBadge = (seg) => {
    switch (seg) {
      case 'High Value':
        return <Badge variant="success">High Value</Badge>;
      case 'Regular':
        return <Badge variant="info">Regular</Badge>;
      case 'New':
        return <Badge variant="purple">New Account</Badge>;
      case 'At Risk':
        return <Badge variant="danger">At Risk</Badge>;
      default:
        return <Badge>{seg}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Customers</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summary?.total_customers?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Total registered accounts</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">New Customers</span>
            <UserPlus className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summary?.new_customers?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">First-time buyers (single order)</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Returning Buyers</span>
            <Repeat className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summary?.returning_customers?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Placed 2+ completed orders</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Purchase Frequency</span>
            <UserCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summary?.purchase_frequency || 0} orders
          </div>
          <p className="text-xs text-slate-400 mt-1">Average orders per customer</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Customer Spend</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${summary?.avg_customer_spending?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <p className="text-xs text-slate-400 mt-1">Total revenue / Total accounts</p>
        </div>
      </div>

      {/* Customer Segmentation Rules & Breakdown Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Customer Segmentation Framework</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                Transparent Rules
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Deterministic mathematical cohorting derived from lifetime transactions and behavioral signals
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summary?.segments?.map((seg) => {
            const rules = {
              'High Value': 'Spend >= $2,000 OR (Orders >= 4 & Spend >= $1,000)',
              Regular: 'Orders >= 2 and Spend between $300 - $2,000',
              New: 'Account age <= 60 days or total orders <= 1',
              'At Risk': 'Last order > 90 days ago OR prior refund / rating <= 2',
            };

            const colors = {
              'High Value': 'border-emerald-200 bg-emerald-50/40 text-emerald-900',
              Regular: 'border-blue-200 bg-blue-50/40 text-blue-900',
              New: 'border-purple-200 bg-purple-50/40 text-purple-900',
              'At Risk': 'border-rose-200 bg-rose-50/40 text-rose-900',
            };

            return (
              <div
                key={seg.segment}
                className={`p-4 rounded-xl border ${colors[seg.segment] || 'border-slate-200 bg-slate-50'} space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider">{seg.segment}</span>
                  <span className="font-bold text-sm">{seg.percentage}%</span>
                </div>
                <div className="text-xl font-bold">{seg.count} customers</div>
                <div className="text-xs space-y-0.5 opacity-90 pt-1 border-t border-slate-200/60">
                  <p>Total Spend: <span className="font-semibold">${seg.total_revenue.toLocaleString()}</span></p>
                  <p>Avg Spend: <span className="font-semibold">${seg.avg_spend}</span></p>
                </div>
                <div className="text-[10px] opacity-75 pt-1.5 flex items-start gap-1">
                  <Info className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>Rule: {rules[seg.segment]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer by name, email, or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Region */}
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r === 'All' ? 'All Regions' : `${r} Region`}
              </option>
            ))}
          </select>

          {/* Segment */}
          <select
            value={segment}
            onChange={(e) => {
              setSegment(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            {SEGMENTS.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Segments' : s}
              </option>
            ))}
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading customer records..." />
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers match filter criteria"
            description="Adjust your search term, selected region, or customer segment."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Customer ID</th>
                  <th className="px-4 py-3.5">Name & Email</th>
                  <th className="px-4 py-3.5">Region</th>
                  <th className="px-4 py-3.5">Join Date</th>
                  <th className="px-4 py-3.5 text-center">Total Orders</th>
                  <th className="px-4 py-3.5 text-right">Total Spending</th>
                  <th className="px-4 py-3.5 text-center">Segment</th>
                  <th className="px-4 py-3.5 text-center">Last Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-medium text-slate-500">
                      #{c.id}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{c.name}</p>
                      <p className="text-[11px] text-slate-400">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{c.region}</td>
                    <td className="px-4 py-3 text-slate-500">{c.created_at}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-slate-800">{c.total_orders}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      ${c.total_spending?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">{getSegmentBadge(c.customer_segment)}</td>
                    <td className="px-4 py-3 text-center text-slate-500 font-mono text-[11px]">
                      {c.last_order_date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{customers.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalRecords}</span> customers
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
