import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import api from '../api/client';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Package,
} from 'lucide-react';

const CATEGORIES = ['All', 'Electronics', 'Office Supplies', 'Furniture', 'Software', 'Hardware'];
const REGIONS = ['All', 'North', 'South', 'East', 'West', 'Central'];
const STATUSES = ['All', 'Completed', 'Processing', 'Cancelled', 'Refunded'];

export default function SalesAnalyticsPage() {
  const { refreshKey, addToast } = useFilters();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [region, setRegion] = useState('All');
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState('order_date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Best & Low performers
  const [bestSellers, setBestSellers] = useState([]);
  const [lowPerformers, setLowPerformers] = useState([]);

  // Selected Order for Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchOrders() {
      setLoading(true);
      try {
        const params = {
          page,
          page_size: 15,
          search: search.trim() || undefined,
          category: category !== 'All' ? category : undefined,
          region: region !== 'All' ? region : undefined,
          status: status !== 'All' ? status : undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        };

        const [ordersRes, prodRes] = await Promise.all([
          api.get('/orders', { params }),
          api.get('/analytics/products?date_filter=all'),
        ]);

        if (isMounted) {
          setOrders(ordersRes.data.orders || []);
          setTotalRecords(ordersRes.data.total_records || 0);
          setTotalSales(ordersRes.data.total_sales || 0);
          setAvgOrderValue(ordersRes.data.average_order_value || 0);
          setTotalPages(ordersRes.data.total_pages || 1);

          setBestSellers(prodRes.data.best_sellers || []);
          setLowPerformers(prodRes.data.low_performers || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load sales data:', err);
          addToast('Failed to load transactions: ' + err.message, 'error');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOrders();
    return () => {
      isMounted = false;
    };
  }, [page, search, category, region, status, sortBy, sortOrder, refreshKey, addToast]);

  const handleViewOrder = async (orderId) => {
    setOrderDetailLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrder(res.data);
    } catch (err) {
      addToast('Error loading order details: ' + err.message, 'error');
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const handleDownloadReport = () => {
    window.open('/api/data/export?entity=orders', '_blank');
    addToast('Generating downloadable sales transactions CSV...', 'info');
  };

  const getStatusBadge = (statusName) => {
    switch (statusName) {
      case 'Completed':
        return <Badge variant="success">Completed</Badge>;
      case 'Processing':
        return <Badge variant="info">Processing</Badge>;
      case 'Cancelled':
        return <Badge variant="warning">Cancelled</Badge>;
      case 'Refunded':
        return <Badge variant="danger">Refunded</Badge>;
      default:
        return <Badge>{statusName}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Filtered Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-1">Completed orders in current view</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Order Value</span>
            <ShoppingCart className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-1">Average cart ticket size</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Product</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base font-bold text-slate-900 truncate">
            {bestSellers[0]?.name || 'N/A'}
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            ${bestSellers[0]?.total_revenue?.toLocaleString() || 0} ({bestSellers[0]?.units_sold || 0} units)
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Lowest Product</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-base font-bold text-slate-900 truncate">
            {lowPerformers[0]?.name || 'N/A'}
          </div>
          <p className="text-xs text-rose-600 font-semibold mt-1">
            ${lowPerformers[0]?.total_revenue?.toLocaleString() || 0} ({lowPerformers[0]?.units_sold || 0} units)
          </p>
        </div>
      </div>

      {/* Product Velocity Comparison Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best-Sellers */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Top 5 Best-Selling Products</h3>
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">High Velocity</span>
          </div>

          <div className="divide-y divide-slate-100">
            {bestSellers.map((item, idx) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500 shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400">{item.category}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-900">${item.total_revenue.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-500">{item.units_sold} units</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Performers */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <TrendingDown className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Low-Performing Products (Action Required)</h3>
            </div>
            <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Slow Moving</span>
          </div>

          <div className="divide-y divide-slate-100">
            {lowPerformers.map((item, idx) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                    !
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400">{item.category}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-900">${item.total_revenue.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-500">{item.units_sold} units sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar for Transactions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order ID (#102) or Customer name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Download CSV Report */}
          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sales CSV Report</span>
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Filters:</span>
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

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

          {/* Status */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st === 'All' ? 'All Statuses' : st}
              </option>
            ))}
          </select>

          {/* Sorting */}
          <div className="ml-auto flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="order_date">Date</option>
              <option value="total_amount">Revenue</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading sales transactions..." />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders found"
            description="No transactions match the selected filters or search terms."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Order ID</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Region</th>
                  <th className="px-4 py-3.5">Items</th>
                  <th className="px-4 py-3.5">Categories</th>
                  <th className="px-4 py-3.5 text-right">Total Amount</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-medium text-blue-600">
                      #{o.id}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{o.customer_name}</p>
                      <p className="text-[11px] text-slate-400">{o.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{o.order_date}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-700">{o.region}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">
                        {o.items_count} items
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {o.item_categories?.slice(0, 2).join(', ')}
                      {o.item_categories?.length > 2 && ' +more'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      ${o.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(o.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewOrder(o.id)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View Line Items"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{orders.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalRecords}</span> total transactions
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

      {/* Order Line Items Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-slide-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Order Details #{selectedOrder.id}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedOrder.customer_name} &bull; {selectedOrder.order_date}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                <span className="text-slate-500">Fulfillment Status:</span>
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Line Items Purchased
                </h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Package className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-800">{item.product_name}</p>
                          <p className="text-[11px] text-slate-400">
                            Category: {item.category} &bull; Qty: {item.quantity} &times; ${item.unit_price}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">${item.total}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Total Order Amount:</span>
                <span className="text-base font-bold text-slate-900">
                  ${selectedOrder.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
