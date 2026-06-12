import React, { useState, useRef } from 'react';
import { useAuditStore } from '../store/auditStore';
import { excelService } from '../utils/excelService';
import { validateExcelData } from '../validators/validators';
import type { ValidationError, StockItem } from '../types';
import { ScreenGuide } from '../components/ScreenGuide';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  ChevronLeft,
  Info
} from 'lucide-react';

export const ImportInventory: React.FC = () => {
  const { currentAudit, importInventory, setTab } = useAuditStore();
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [parsedData, setParsedData] = useState<StockItem[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeMetadata = currentAudit.metadata;

  if (!activeMetadata) {
    return (
      <div className="text-center py-12 space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <p className="text-slate-350">No active audit session detected. Please create a session first.</p>
        <button
          onClick={() => setTab('new-audit')}
          className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Create Session
        </button>
      </div>
    );
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setFileError(null);
    setValidationErrors([]);
    setParsedData(null);
    setFileName(file.name);

    try {
      const result = await excelService.parseExcelFile(file);
      
      if (result.error) {
        setFileError(result.error);
        setLoading(false);
        return;
      }

      // Bulk validation
      const { items, errors } = validateExcelData(result.rows);
      setValidationErrors(errors);
      
      const hasFatalErrors = errors.some(e => e.severity === 'error');
      if (!hasFatalErrors) {
        setParsedData(items);
      }
    } catch (err) {
      setFileError('An unexpected error occurred while parsing the file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleImportConfirm = async () => {
    if (parsedData && parsedData.length > 0) {
      await importInventory(parsedData);
    }
  };

  const fatalErrors = validationErrors.filter(e => e.severity === 'error');
  const warningErrors = validationErrors.filter(e => e.severity === 'warning');

  const guideSteps = [
    "Select or drop your inventory workbook in .xlsx or .xls format.",
    "Verify that mandatory columns exist: 'Item Code', 'Item Name', 'Book Quantity', and 'Rate'.",
    "Inspect the parsing report. Critical errors (blank mandatory fields, non-numeric values) will block the import.",
    "Duplicate Item Codes will raise warnings. You can still confirm the import but review the warnings carefully.",
    "Click 'Confirm and Import Inventory' to load the records into the browser database."
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4">
        <div>
          <button
            onClick={() => setTab('dashboard')}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
        <ScreenGuide title="Spreadsheet Upload & Validation" steps={guideSteps} guideKey="import_inventory" />
      </div>

      <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
          <div className="p-2.5 bg-teal-600/10 text-teal-400 rounded-lg">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">Import Inventory Spreadsheet</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload stock files for <span className="font-semibold text-slate-200">{activeMetadata.clientName}</span>.
            </p>
          </div>
        </div>

        {/* Template Download Prompt */}
        {!loading && !parsedData && fatalErrors.length === 0 && (
          <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>📋</span> Download Stock Inventory Template
              </h4>
              <p className="text-xs text-slate-450 leading-relaxed max-w-lg">
                Download a clean, pre-structured Excel template with required columns to align your ERP exports (SAP, Tally, Zoho) for frictionless local parsing.
              </p>
            </div>
            <button
              onClick={() => excelService.downloadTemplateExcel()}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-400" />
              Download Template (.xlsx)
            </button>
          </div>
        )}

        {/* Uploader Box */}
        {!loading && !parsedData && fatalErrors.length === 0 && (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
              dragActive 
                ? 'border-teal-500 bg-teal-500/5' 
                : 'border-slate-700 bg-slate-900/20 hover:border-slate-650 hover:bg-slate-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="p-4 bg-slate-800/80 rounded-full border border-slate-700 text-slate-400 shadow-md">
              <FileSpreadsheet className="w-8 h-8 text-teal-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-200">
                Drag and drop your inventory Excel here, or <span className="text-teal-400 underline hover:text-teal-300">browse file</span>
              </p>
              <p className="text-xs text-slate-500">Supports .xlsx and .xls formats</p>
            </div>

            {/* Hint Box */}
            <div className="mt-4 bg-slate-900/50 rounded-lg p-3 border border-slate-800/80 max-w-lg flex items-start gap-2.5 text-left text-xs text-slate-400">
              <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-350 block mb-1">Expected Template Headers:</span>
                S.No, Item Code, Item Name, Category, UOM, Location, Bin Location, Batch No, Book Quantity, Rate, Book Value, Audit Required
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            <p className="text-sm font-medium">Reading spreadsheet and performing validation checks...</p>
          </div>
        )}

        {/* Fatal Errors Panel */}
        {fileError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3 text-red-400 text-sm">
            <AlertOctagon className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">File Verification Error</p>
              <p className="mt-1 text-slate-300">{fileError}</p>
              <button
                onClick={() => { setFileError(null); setParsedData(null); }}
                className="mt-3 bg-red-500/20 text-red-350 hover:bg-red-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                Try Another File
              </button>
            </div>
          </div>
        )}

        {/* Detailed Zod Schema Validation Failure Logs */}
        {fatalErrors.length > 0 && (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3 text-red-400 text-sm">
              <AlertOctagon className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Validation Check Failed: {fatalErrors.length} Critical Issues Found</p>
                <p className="text-xs text-slate-300 mt-0.5">
                  The spreadsheet contains blank required columns or non-numeric values in quantities/rates. Fix these rows to proceed.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800 border-b border-slate-755 text-slate-400 font-semibold sticky top-0">
                    <th className="py-2 px-3">Excel Row</th>
                    <th className="py-2 px-3">Column</th>
                    <th className="py-2 px-3">Invalid Value</th>
                    <th className="py-2 px-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {fatalErrors.map((err, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 text-slate-300">
                      <td className="py-2.5 px-3 text-slate-450">Row {err.row}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{err.column}</td>
                      <td className="py-2.5 px-3 text-red-400 truncate max-w-[120px]">
                        {err.value === '' ? <span className="italic opacity-50">&lt;empty&gt;</span> : err.value}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{err.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-750">
              <button
                onClick={() => { setValidationErrors([]); setParsedData(null); }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-lg text-sm font-semibold transition-colors"
              >
                Clear and Re-upload
              </button>
            </div>
          </div>
        )}

        {/* Successful Validation, showing warnings (if any) and final Import Action */}
        {parsedData && parsedData.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex gap-3 text-emerald-400 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Verification Complete: {parsedData.length.toLocaleString()} Items Validated</p>
                <p className="text-xs text-slate-300 mt-0.5">
                  Spreadsheet loaded cleanly. All rows parsed and conform to the data schema requirements.
                </p>
              </div>
            </div>

            {/* Warnings log (e.g. Duplicate Item Codes) */}
            {warningErrors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Warnings Log ({warningErrors.length} notices)</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-lg max-h-40 overflow-y-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800 border-b border-slate-755 text-slate-400 font-semibold sticky top-0">
                        <th className="py-2 px-3">Excel Row</th>
                        <th className="py-2 px-3">Item Code</th>
                        <th className="py-2 px-3">Notice Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-350">
                      {warningErrors.map((err, i) => (
                        <tr key={i} className="hover:bg-slate-800/30">
                          <td className="py-2 px-3">Row {err.row}</td>
                          <td className="py-2 px-3 font-semibold text-slate-200">{err.value}</td>
                          <td className="py-2 px-3 text-slate-400">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import Metadata Preview */}
            <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-lg flex items-center justify-between text-sm">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider block">Target Session</span>
                <span className="font-bold text-slate-200">{fileName}</span>
              </div>
              <div className="text-right space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider block">Record Count</span>
                <span className="font-bold text-teal-400">{parsedData.length.toLocaleString()} Rows</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-750">
              <button
                onClick={() => { setParsedData(null); setValidationErrors([]); }}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:bg-slate-700/60 hover:text-white transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleImportConfirm}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-teal-500/20"
              >
                Confirm and Import Inventory
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
