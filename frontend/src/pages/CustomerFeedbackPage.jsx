import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import api from '../api/client';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  MessageSquare,
  Search,
  Filter,
  Download,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const CATEGORIES = [
  'All',
  'Product Quality',
  'Delivery',
  'Customer Support',
  'Pricing',
  'Website Usability',
];

export default function CustomerFeedbackPage() {
  const { refreshKey, triggerRefresh, addToast } = useFilters();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [ratingFilter, setRatingFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sentimentFilter, setSentimentFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Submit Feedback Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCustId, setNewCustId] = useState('1');
  const [newRating, setNewRating] = useState('5');
  const [newCategory, setNewCategory] = useState('Product Quality');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchFeedback() {
      setLoading(true);
      try {
        const params = {
          page,
          page_size: 15,
          rating: ratingFilter !== 'All' ? parseInt(ratingFilter) : undefined,
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
          sentiment: sentimentFilter !== 'All' ? sentimentFilter : undefined,
          search: search.trim() || undefined,
        };

        const res = await api.get('/feedback', { params });
        if (isMounted) {
          setSummary(res.data.summary);
          setFeedbacks(res.data.feedbacks || []);
          setTotalRecords(res.data.total_records || 0);
          setTotalPages(res.data.total_pages || 1);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load feedback:', err);
          addToast('Failed to load feedback: ' + err.message, 'error');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchFeedback();
    return () => {
      isMounted = false;
    };
  }, [page, ratingFilter, categoryFilter, sentimentFilter, search, refreshKey, addToast]);

  const handleExportCSV = () => {
    window.open('/api/data/export?entity=feedback', '_blank');
    addToast('Exporting Customer Feedback report as CSV...', 'info');
  };

  const handleCreateFeedback = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      addToast('Please enter a feedback comment', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/feedback', {
        customer_id: parseInt(newCustId) || 1,
        rating: parseInt(newRating),
        category: newCategory,
        comment: newComment.trim(),
      });
      addToast('Feedback submitted successfully! Recalculating CSAT metrics...', 'success');
      setShowSubmitModal(false);
      setNewComment('');
      triggerRefresh();
    } catch (err) {
      addToast('Failed to submit feedback: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
            }`}
          />
        ))}
      </div>
    );
  };

  const getSentimentBadge = (sentiment) => {
    switch (sentiment) {
      case 'Positive':
        return <Badge variant="success">Positive</Badge>;
      case 'Neutral':
        return <Badge variant="warning">Neutral</Badge>;
      case 'Negative':
        return <Badge variant="danger">Negative</Badge>;
      default:
        return <Badge>{sentiment}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Rating (CSAT)</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summary?.average_rating || 0} / 5.0
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Based on {summary?.total_feedbacks || 0} customer reviews
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Positive Feedback</span>
            <ThumbsUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {summary?.positive_percentage || 0}%
          </div>
          <p className="text-xs text-slate-400 mt-1">4 & 5 star customer ratings</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Negative Feedback</span>
            <ThumbsDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">
            {summary?.negative_percentage || 0}%
          </div>
          <p className="text-xs text-slate-400 mt-1">1 & 2 star customer ratings</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Complaints</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summary?.total_complaints || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Complaints requiring operational review</p>
        </div>
      </div>

      {/* Analytical Charts: Rating Breakdown & CSAT Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution & Complaint Categories */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Rating Distribution & Complaint Drivers
          </h3>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = summary?.rating_distribution?.[stars] || 0;
              const total = summary?.total_feedbacks || 1;
              const pct = Math.round((count / total) * 100);

              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-medium text-slate-600">{stars} Stars</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stars >= 4 ? 'bg-emerald-500' : stars === 3 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-slate-500 font-mono">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Primary Complaint Categories (1-2 Stars)
            </h4>
            <div className="flex flex-wrap gap-2">
              {summary?.category_breakdown?.map((cat) => (
                <span
                  key={cat.category}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1.5"
                >
                  <span className="font-semibold">{cat.category}:</span>
                  <span className="text-rose-600 font-bold">{cat.complaints_count}</span>
                  <span className="text-slate-400 text-[10px]">({cat.percentage}%)</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* CSAT Trend Over Time */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Customer Satisfaction Trend</h3>
              <p className="text-xs text-slate-500">Monthly average rating trajectory</p>
            </div>
            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
              Trend Line
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[1, 5]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val} / 5.0`, 'Avg CSAT']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="average_rating"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search feedback comment or customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            <option value="All">All Star Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          {/* Sentiment Filter */}
          <select
            value={sentimentFilter}
            onChange={(e) => {
              setSentimentFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            <option value="All">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>

          {/* Submit New Feedback Trigger */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Submit Feedback</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Customer Feedback List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading customer feedback..." />
        ) : feedbacks.length === 0 ? (
          <EmptyState
            title="No feedback matching criteria"
            description="Adjust your search query, star rating, or category filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Rating</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Sentiment</th>
                  <th className="px-4 py-3.5">Comment</th>
                  <th className="px-4 py-3.5">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feedbacks.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {f.customer_name}
                    </td>
                    <td className="px-4 py-3">{renderStars(f.rating)}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{f.category}</td>
                    <td className="px-4 py-3">{getSentimentBadge(f.sentiment)}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-md">{f.comment}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {f.created_at}
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
            Showing <span className="font-semibold text-slate-800">{feedbacks.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalRecords}</span> reviews
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

      {/* Submit Feedback Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-slide-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Submit New Customer Feedback
              </h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFeedback} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer ID (e.g. 1 - 125)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={newCustId}
                  onChange={(e) => setNewCustId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rating (1 to 5 Stars)
                </label>
                <select
                  value={newRating}
                  onChange={(e) => setNewRating(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Average / Neutral</option>
                  <option value="2">2 - Poor</option>
                  <option value="1">1 - Very Dissatisfied (Complaint)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Comment
                </label>
                <textarea
                  rows="3"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share details regarding product quality, packaging, delivery or support..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Post Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
