import React, { useMemo } from 'react';
import { useAuditStore } from '../store/auditStore';
import { excelService } from '../utils/excelService';
import { 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Calendar,
  User,
  MapPin,
  FileSpreadsheet
} from 'lucide-react';
import { ScreenGuide } from '../components/ScreenGuide';

export const Export: React.FC = () => {
  const { currentAudit } = useAuditStore();
  const { metadata, items } = currentAudit;

  if (!metadata) return null;

  const sampleItems = useMemo(() => items.filter(i => i.isSelected), [items]);
  const totalSample = sampleItems.length;
  const verifiedCount = useMemo(() => sampleItems.filter(i => i.physicalQuantity !== null).length, [sampleItems]);
  const pendingCount = totalSample - verifiedCount;

  const shortagesCount = useMemo(() => 
    sampleItems.filter(i => i.physicalQuantity !== null && i.differenceQuantity !== null && i.differenceQuantity < 0).length, 
  [sampleItems]);

  const excessesCount = useMemo(() => 
    sampleItems.filter(i => i.physicalQuantity !== null && i.differenceQuantity !== null && i.differenceQuantity > 0).length, 
  [sampleItems]);

  const handleExport = () => {
    excelService.exportAuditExcel(items, metadata.clientName, metadata.auditName);
  };

  const guideSteps = [
    "Verify the client details, audit date, branch unit, and lead auditor listed in the overview card.",
    "Ensure that 'Audit Work Pending' is zero. If pending items remain, complete physical counts before exporting.",
    "Review the final discrepancy counts showing the number of shortages and excesses flagged.",
    "Click 'Export Audit Excel Report' to download the finalized workbook locally.",
    "The downloaded workbook will preserve your original columns and add physical count records for audit reference."
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <ScreenGuide title="Audit Results Export" steps={guideSteps} guideKey="export" />
      <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
          <div className="p-2.5 bg-teal-600/10 text-teal-400 rounded-lg">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">Generate Audit Report</h3>
            <p className="text-xs text-slate-400 mt-0.5">Export reconciled inventory to a standard Excel workbook.</p>
          </div>
        </div>

        {/* Audit Session Overview Card */}
        <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-lg space-y-4">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 uppercase font-semibold">Client Name</span>
            <h4 className="text-lg font-bold text-slate-100">{metadata.clientName}</h4>
            <p className="text-sm text-slate-350">{metadata.auditName}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-400 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Audit Date</span>
                <span className="text-slate-300">{metadata.auditDate}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Lead Auditor</span>
                <span className="text-slate-300 truncate max-w-[120px]" title={metadata.auditorName}>
                  {metadata.auditorName}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 col-span-2 md:col-span-1">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Branch</span>
                <span className="text-slate-300 truncate max-w-[120px]" title={metadata.branchUnit}>
                  {metadata.branchUnit}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress verification check banner */}
        {pendingCount > 0 ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3 text-amber-400 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Audit Work Pending</p>
              <p className="mt-1 text-slate-300 text-xs leading-relaxed">
                There are still <span className="font-bold text-amber-400">{pendingCount} items</span> in your selected sample that have not been physically counted. If you export now, these items will show blank fields in the physical quantity and difference columns.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex gap-3 text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Verification Target Met</p>
              <p className="mt-1 text-slate-300 text-xs leading-relaxed">
                All selected audit samples ({totalSample} items) have been successfully checked and updated with physical verification counts.
              </p>
            </div>
          </div>
        )}

        {/* Summary counts */}
        <div className="bg-slate-900/20 border border-slate-800 rounded-lg p-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
          <div className="p-2 border-r border-slate-800">
            <span className="text-slate-500 block mb-1">TOTAL POPULATION</span>
            <span className="text-lg font-bold text-slate-300">{items.length.toLocaleString()}</span>
          </div>
          <div className="p-2 border-r border-slate-800">
            <span className="text-slate-500 block mb-1">AUDIT SAMPLE</span>
            <span className="text-lg font-bold text-teal-400">{totalSample.toLocaleString()}</span>
          </div>
          <div className="p-2">
            <span className="text-slate-500 block mb-1">VARIANCE FOUND</span>
            <span className="text-lg font-bold text-slate-300">
              <span className="text-red-400">{shortagesCount}</span> / <span className="text-emerald-400">{excessesCount}</span>
            </span>
          </div>
        </div>

        {/* Export Action */}
        <div className="pt-4 border-t border-slate-750 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-2 text-[11px] text-slate-450 max-w-sm">
            <Info className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
            <p>
              The exported spreadsheet will merge your original Excel column layouts with additional columns: 
              <span className="font-semibold text-slate-300"> Physical Quantity, Difference Quantity, Audit Observations, Remarks.</span>
            </p>
          </div>

          <button
            onClick={handleExport}
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Audit Excel Report
          </button>
        </div>
      </div>
    </div>
  );
};
