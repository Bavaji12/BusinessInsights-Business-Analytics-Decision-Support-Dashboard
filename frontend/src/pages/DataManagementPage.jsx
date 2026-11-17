import React, { useState } from 'react';
import { useFilters } from '../context/FilterContext';
import api from '../api/client';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Download,
  RefreshCw,
  Database,
  ArrowRight,
  FileSpreadsheet,
  Layers,
  Copy,
} from 'lucide-react';

const ENTITY_CONFIGS = [
  {
    id: 'customers',
    label: 'Customers Dataset',
    required: 'name, email, region',
    templateName: 'sample_customers.csv',
  },
  {
    id: 'products',
    label: 'Products Dataset',
    required: 'name, category, price',
    templateName: 'sample_products.csv',
  },
  {
    id: 'orders',
    label: 'Orders Dataset',
    required: 'customer_id, total_amount, status, region',
    templateName: 'sample_orders.csv',
  },
  {
    id: 'feedback',
    label: 'Customer Feedback Dataset',
    required: 'customer_id, rating, category',
    templateName: 'sample_feedback.csv',
  },
];

export default function DataManagementPage() {
  const { triggerRefresh, addToast } = useFilters();

  const [selectedEntity, setSelectedEntity] = useState('customers');
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);

  const [validationResult, setValidationResult] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith('.csv')) {
        addToast('Please upload a valid .csv file', 'warning');
        return;
      }
      setFile(selected);
      setValidationResult(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (!dropped.name.endsWith('.csv')) {
        addToast('Please upload a valid .csv file', 'warning');
        return;
      }
      setFile(dropped);
      setValidationResult(null);
    }
  };

  // Step 1: Validate CSV (commit = false)
  const handleValidateCSV = async () => {
    if (!file) {
      addToast('Please choose a CSV file first', 'warning');
      return;
    }
    setValidating(true);
    setValidationResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', selectedEntity);
    formData.append('commit', 'false');

    try {
      const res = await api.post('/data/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setValidationResult(res.data);
      if (res.data.valid) {
        addToast('Validation Passed! Ready to import.', 'success');
      } else {
        addToast('Validation found schema/data discrepancies. Please review.', 'warning');
      }
    } catch (err) {
      addToast('Validation Error: ' + err.message, 'error');
    } finally {
      setValidating(false);
    }
  };

  // Step 2: Commit valid records to database
  const handleCommitImport = async () => {
    if (!file) return;
    setImporting(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', selectedEntity);
    formData.append('commit', 'true');

    try {
      const res = await api.post('/data/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addToast(res.data.message || 'Records imported successfully!', 'success');
      triggerRefresh();
      // Reset
      setFile(null);
      setValidationResult(null);
    } catch (err) {
      addToast('Import failed: ' + err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  // Load / Reset Sample Data
  const handleLoadSampleData = async () => {
    if (!window.confirm('Reset SQLite database and reload full realistic sample business data?')) {
      return;
    }
    setLoadingSample(true);
    try {
      const res = await api.post('/data/load-sample');
      addToast(res.data.message || 'Sample business data populated successfully!', 'success');
      triggerRefresh();
    } catch (err) {
      addToast('Failed to load sample data: ' + err.message, 'error');
    } finally {
      setLoadingSample(false);
    }
  };

  const handleDownloadSampleTemplate = (entityId) => {
    window.open(`/api/data/sample-template/${entityId}`, '_blank');
    addToast(`Downloading ${entityId} sample CSV template...`, 'info');
  };

  const handleExportEntity = (entity) => {
    window.open(`/api/data/export?entity=${entity}`, '_blank');
    addToast(`Exporting ${entity} dataset as CSV...`, 'info');
  };

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Database className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Data Management & Validation Pipeline
            </h2>
            <Badge variant="purple">Strict Validation</Badge>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Upload CSV datasets with column validation, preview, missing value detection, and duplicate checks. Never silently accept invalid records.
          </p>
        </div>

        {/* Quick Sample Data Reset Button */}
        <button
          onClick={handleLoadSampleData}
          disabled={loadingSample}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loadingSample ? 'animate-spin' : ''}`} />
          <span>{loadingSample ? 'Resetting Data...' : 'Reset & Load Realistic Sample Data'}</span>
        </button>
      </div>

      {/* Grid: Upload & Validate Pipeline vs Download Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: CSV Upload & Validation */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span>Step 1: Select Target Entity & Upload CSV</span>
            </h3>
            <p className="text-xs text-slate-500">
              Choose the entity schema you are importing to perform strict column and value verification
            </p>
          </div>

          {/* Entity Type Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ENTITY_CONFIGS.map((cfg) => {
              const isSelected = selectedEntity === cfg.id;
              return (
                <button
                  key={cfg.id}
                  onClick={() => {
                    setSelectedEntity(cfg.id);
                    setValidationResult(null);
                  }}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-semibold ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="font-bold">{cfg.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{cfg.required}</p>
                </button>
              );
            })}
          </div>

          {/* Drag & Drop File Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50/40'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 mb-1">
              Drag and drop your CSV file here, or{' '}
              <label className="text-blue-600 hover:underline cursor-pointer">
                browse files
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-[11px] text-slate-400">
              Only UTF-8 encoded .csv files are supported
            </p>

            {file && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100/70 border border-blue-200 text-xs font-medium text-blue-900">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleValidateCSV}
              disabled={!file || validating}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{validating ? 'Validating CSV...' : 'Validate CSV Records'}</span>
            </button>

            {validationResult && validationResult.valid_rows_count > 0 && (
              <button
                onClick={handleCommitImport}
                disabled={importing}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition disabled:opacity-50"
              >
                <span>{importing ? 'Importing...' : `Commit ${validationResult.valid_rows_count} Valid Records to Database`}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right 1 Col: Download Sample Templates & Exports */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Sample CSV Templates</span>
            </h3>
            <p className="text-xs text-slate-500">
              Download pre-formatted sample files to test the upload pipeline
            </p>
          </div>

          <div className="space-y-2.5">
            {ENTITY_CONFIGS.map((cfg) => (
              <div
                key={cfg.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-800">{cfg.label}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{cfg.templateName}</p>
                </div>
                <button
                  onClick={() => handleDownloadSampleTemplate(cfg.id)}
                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                  title={`Download ${cfg.templateName}`}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Export Live System Reports
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleExportEntity('orders')}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Orders CSV</span>
              </button>
              <button
                onClick={() => handleExportEntity('customers')}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Customers CSV</span>
              </button>
              <button
                onClick={() => handleExportEntity('feedback')}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Feedback CSV</span>
              </button>
              <button
                onClick={() => handleExportEntity('insights')}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Insights CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Results Report Card */}
      {validationResult && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                {validationResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
                <span>Validation Diagnostic Report</span>
              </h3>
              <p className="text-xs text-slate-500">{validationResult.message}</p>
            </div>
            <div>
              {validationResult.valid ? (
                <Badge variant="success">All Rows Valid</Badge>
              ) : (
                <Badge variant="warning">Discrepancies Detected</Badge>
              )}
            </div>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400">Total Rows</span>
              <p className="text-base font-bold text-slate-800">{validationResult.total_rows}</p>
            </div>
            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <span className="text-emerald-700">Valid Rows</span>
              <p className="text-base font-bold text-emerald-800">{validationResult.valid_rows_count}</p>
            </div>
            <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100">
              <span className="text-rose-700">Invalid Rows</span>
              <p className="text-base font-bold text-rose-800">{validationResult.invalid_rows_count}</p>
            </div>
            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
              <span className="text-amber-700">Duplicate Rows</span>
              <p className="text-base font-bold text-amber-800">{validationResult.duplicate_rows}</p>
            </div>
          </div>

          {/* Errors list */}
          {validationResult.schema_errors?.length > 0 && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Schema Error:
              </p>
              {validationResult.schema_errors.map((err, i) => (
                <p key={i}>&bull; {err}</p>
              ))}
            </div>
          )}

          {validationResult.missing_value_errors?.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Missing Required Values:
              </p>
              {validationResult.missing_value_errors.map((err, i) => (
                <p key={i}>
                  &bull; {err.message} (Affected row indices: {err.affected_rows.slice(0, 5).join(', ')}
                  {err.affected_rows.length > 5 && ' ...'})
                </p>
              ))}
            </div>
          )}

          {/* Preview of first 10 rows */}
          {validationResult.preview_data?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                CSV Records Preview (First 10 Rows)
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      {Object.keys(validationResult.preview_data[0]).map((key) => (
                        <th key={key} className="px-3 py-2 font-mono">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {validationResult.preview_data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 text-slate-700">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
