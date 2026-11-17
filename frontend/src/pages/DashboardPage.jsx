import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import api from '../api/client';
import DateFilterBar from '../components/common/DateFilterBar';
import MetricCard from '../components/common/MetricCard';
import RevenueTrendChart from '../components/charts/RevenueTrendChart';
import CategorySalesChart from '../components/charts/CategorySalesChart';
import RegionPieChart from '../components/charts/RegionPieChart';
import CustomerSegmentDonut from '../components/charts/CustomerSegmentDonut';
import OrderStatusChart from '../components/charts/OrderStatusChart';
import MonthlyCustomerGrowthChart from '../components/charts/MonthlyCustomerGrowthChart';
import {
  DollarSign,
  ShoppingCart,
  Users,
  CreditCard,
  Percent,
  Star,
  TrendingUp,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage({ onNavigateTo }) {
  const { getFilterParams, refreshKey } = useFilters();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [regionRevenue, setRegionRevenue] = useState([]);
  const [customerSegments, setCustomerSegments] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  const [customerGrowth, setCustomerGrowth] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchDashboardData() {
      setLoading(true);
      setError(null);
      const params = getFilterParams();

      try {
        const [
          summaryRes,
          revenueRes,
          productsRes,
          regionsRes,
          customersRes,
          statusRes,
          growthRes,
        ] = await Promise.all([
          api.get('/dashboard/summary', { params }),
          api.get('/analytics/revenue', { params }),
          api.get('/analytics/products', { params }),
          api.get('/analytics/regions', { params }),
          api.get('/analytics/customers'),
          api.get('/dashboard/order-status', { params }),
          api.get('/dashboard/customer-growth'),
        ]);

        if (isMounted) {
          setSummary(summaryRes.data);
          setRevenueTrend(revenueRes.data || []);
          setCategorySales(productsRes.data?.by_category || []);
          setRegionRevenue(regionsRes.data || []);
          setCustomerSegments(customersRes.data?.segments || []);
          setOrderStatus(statusRes.data || []);
          setCustomerGrowth(growthRes.data || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load dashboard data:', err);
          setError(err.message || 'Error loading dashboard metrics.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, [getFilterParams, refreshKey]);

  return (
    <div className="space-y-6">
      {/* Date & Region Filter Bar */}
      <DateFilterBar />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Revenue"
          value={summary ? `$${summary.total_revenue.toLocaleString()}` : '$0'}
          icon={DollarSign}
          trendPct={summary?.revenue_growth_pct}
          trendLabel="vs prior period"
          formula="Sum of completed order amounts"
          color="blue"
        />

        <MetricCard
          title="Total Orders"
          value={summary ? summary.total_orders.toLocaleString() : '0'}
          icon={ShoppingCart}
          trendLabel="Total placed"
          formula="Count of valid orders in period"
          color="indigo"
        />

        <MetricCard
          title="Total Customers"
          value={summary ? summary.total_customers.toLocaleString() : '0'}
          icon={Users}
          trendLabel={`${summary?.active_customers || 0} active in period`}
          formula="Total registered customer accounts"
          color="emerald"
        />

        <MetricCard
          title="Avg Order Value"
          value={summary ? `$${summary.average_order_value.toLocaleString()}` : '$0'}
          icon={CreditCard}
          trendLabel="Per completed transaction"
          formula="Total Revenue / Completed Orders count"
          color="amber"
        />

        <MetricCard
          title="Revenue Growth"
          value={summary ? `${summary.revenue_growth_pct > 0 ? '+' : ''}${summary.revenue_growth_pct}%` : '0%'}
          icon={Percent}
          trendPct={summary?.revenue_growth_pct}
          trendLabel="Period-over-Period"
          formula="((Current Rev - Prior Rev) / Prior Rev) * 100"
          color="purple"
        />

        <MetricCard
          title="Customer CSAT"
          value={summary ? `${summary.customer_satisfaction_score} / 5.0` : '0.0'}
          icon={Star}
          trendLabel="Average review score"
          formula="Mean score of verified customer reviews"
          color="emerald"
        />
      </div>

      {/* Decision Support Alert Callout */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950">
              Decision Support Notice
            </span>
            <span className="text-xs text-blue-200">Automated Data Analysis Engine</span>
          </div>
          <h3 className="text-base font-bold text-white">
            Actionable Business Bottlenecks & Strategic Recommendations Identified
          </h3>
          <p className="text-xs text-blue-200 max-w-2xl">
            Mathematical rule evaluation detected key opportunities in regional sales balance, inventory velocity, and customer retention.
          </p>
        </div>
        <button
          onClick={() => onNavigateTo('insights')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-blue-900 hover:bg-blue-50 transition shadow-sm shrink-0"
        >
          <span>View Business Insights</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Charts - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue Trend Over Time</h3>
              <p className="text-xs text-slate-500">Sales velocity and order volume progression</p>
            </div>
            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
              Line Chart
            </span>
          </div>
          <RevenueTrendChart data={revenueTrend} loading={loading} />
        </div>

        {/* Sales by Product Category */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sales by Product Category</h3>
              <p className="text-xs text-slate-500">Revenue and units sold contribution by department</p>
            </div>
            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
              Bar Chart
            </span>
          </div>
          <CategorySalesChart data={categorySales} loading={loading} />
        </div>

        {/* Revenue by Region */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue by Region</h3>
              <p className="text-xs text-slate-500">Geographic sales performance across market zones</p>
            </div>
            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
              Pie Chart
            </span>
          </div>
          <RegionPieChart data={regionRevenue} loading={loading} />
        </div>

        {/* Customer Segmentation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Customer Segmentation</h3>
              <p className="text-xs text-slate-500">High Value, Regular, New, and At Risk cohorts</p>
            </div>
            <button
              onClick={() => onNavigateTo('customers')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Details &rarr;
            </button>
          </div>
          <CustomerSegmentDonut data={customerSegments} loading={loading} />
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Order Fulfillment Distribution</h3>
              <p className="text-xs text-slate-500">Completed vs Processing vs Cancelled/Refunded</p>
            </div>
            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
              Status Volume
            </span>
          </div>
          <OrderStatusChart data={orderStatus} loading={loading} />
        </div>

        {/* Monthly Customer Growth */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Customer Acquisition</h3>
              <p className="text-xs text-slate-500">Cumulative accounts and acquisition velocity</p>
            </div>
            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
              Acquisition Curve
            </span>
          </div>
          <MonthlyCustomerGrowthChart data={customerGrowth} loading={loading} />
        </div>
      </div>
    </div>
  );
}
