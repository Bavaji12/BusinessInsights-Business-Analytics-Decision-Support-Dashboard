import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import api from '../api/client';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Clock,
  Briefcase,
  Target,
  Sparkles,
  Download,
  Filter,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function BusinessInsightsPage() {
  const { refreshKey, addToast } = useFilters();

  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [expandedInsight, setExpandedInsight] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchInsightsData() {
      setLoading(true);
      try {
        const [insightsRes, recsRes] = await Promise.all([
          api.get('/insights'),
          api.get('/recommendations'),
        ]);

        if (isMounted) {
          setInsights(insightsRes.data || []);
          setRecommendations(recsRes.data || []);
          if (insightsRes.data?.length > 0) {
            setExpandedInsight(insightsRes.data[0].id);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load business insights:', err);
          addToast('Failed to load insights: ' + err.message, 'error');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchInsightsData();
    return () => {
      isMounted = false;
    };
  }, [refreshKey, addToast]);

  const handleExportInsights = () => {
    window.open('/api/data/export?entity=insights', '_blank');
    addToast('Exporting Business Insights & Recommendations report as CSV...', 'info');
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return <Badge variant="danger">High Priority</Badge>;
      case 'Medium':
        return <Badge variant="warning">Medium Priority</Badge>;
      case 'Low':
        return <Badge variant="success">Low Priority</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getEffortBadge = (effort) => {
    switch (effort) {
      case 'Quick Win':
        return <Badge variant="success">Quick Win</Badge>;
      case 'Medium Effort':
        return <Badge variant="info">Medium Effort</Badge>;
      case 'Strategic Project':
        return <Badge variant="purple">Strategic Project</Badge>;
      default:
        return <Badge>{effort}</Badge>;
    }
  };

  const filteredInsights = insights.filter((item) => {
    if (priorityFilter === 'All') return true;
    return item.priority === priorityFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Lightbulb className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Data-Driven Business Problem Identification
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              100% Calculated Logic
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl">
            This module applies deterministic mathematical thresholds against transactional records, fulfillment status, and customer reviews to diagnose business risks and generate executive decision support actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority Only</option>
            <option value="Medium">Medium Priority Only</option>
            <option value="Low">Low Priority Only</option>
          </select>

          {/* Export Button */}
          <button
            onClick={handleExportInsights}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Action Plan CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Evaluating business rules and diagnostics..." />
      ) : (
        <div className="space-y-6">
          {/* Section 1: Business Problem Statements */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Identified Business Problems ({filteredInsights.length})</span>
            </h3>

            <div className="space-y-4">
              {filteredInsights.map((insight) => {
                const isExpanded = expandedInsight === insight.id;
                const rec = recommendations.find((r) => r.insight_id === insight.id);

                return (
                  <div
                    key={insight.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:border-blue-300"
                  >
                    {/* Collapsible Card Header */}
                    <div
                      onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                      className="p-5 flex items-start justify-between gap-4 cursor-pointer select-none hover:bg-slate-50/60 transition"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {getPriorityBadge(insight.priority)}
                          <Badge variant="indigo">{insight.category}</Badge>
                          <span className="font-mono text-[11px] text-slate-400">
                            Ref: {insight.id}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900">{insight.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {insight.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button className="text-slate-400 hover:text-slate-600 p-1">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Detailed Analysis Content */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/30">
                        {/* 3 Column Analysis Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          {/* Supporting Data */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-blue-600" />
                              Supporting Data
                            </span>
                            <div className="space-y-1 font-mono text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              {Object.entries(insight.supporting_data || {}).map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-2">
                                  <span className="text-slate-400 capitalize">
                                    {k.replace(/_/g, ' ')}:
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {typeof v === 'number'
                                      ? v.toLocaleString(undefined, { maximumFractionDigits: 2 })
                                      : Array.isArray(v)
                                      ? v.join(', ')
                                      : String(v)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Business Impact */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                              Business Impact
                            </span>
                            <p className="text-slate-700 leading-relaxed">
                              {insight.business_impact}
                            </p>
                          </div>

                          {/* Recommended Action */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Recommended Action
                            </span>
                            <p className="text-slate-700 leading-relaxed">
                              {insight.recommended_action}
                            </p>
                          </div>
                        </div>

                        {/* Connected Action Plan Box */}
                        {rec && (
                          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                                  <Briefcase className="w-3.5 h-3.5 text-blue-700" />
                                  Tactical Action Plan: {rec.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {getEffortBadge(rec.effort)}
                                <Badge variant="indigo">Owner: {rec.department}</Badge>
                              </div>
                            </div>

                            <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md inline-block border border-emerald-200">
                              Expected Business Lift: {rec.expected_impact}
                            </p>

                            <div className="space-y-1.5">
                              {rec.action_plan?.map((step, sIdx) => (
                                <div key={sIdx} className="flex items-start gap-2 text-xs text-slate-700">
                                  <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                    {sIdx + 1}
                                  </span>
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Recommendation Matrix Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Recommendation Execution Matrix</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Operational roadmap categorized by department, effort level, and projected ROI
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Ref ID</th>
                    <th className="px-4 py-3">Initiative Title</th>
                    <th className="px-4 py-3">Department Owner</th>
                    <th className="px-4 py-3">Implementation Effort</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Projected Business Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recommendations.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">{rec.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{rec.title}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">{rec.problem_ref}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{rec.department}</td>
                      <td className="px-4 py-3">{getEffortBadge(rec.effort)}</td>
                      <td className="px-4 py-3">{getPriorityBadge(rec.priority)}</td>
                      <td className="px-4 py-3 text-emerald-700 font-semibold">{rec.expected_impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
