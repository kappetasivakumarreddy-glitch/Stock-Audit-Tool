import React, { useEffect } from 'react';
import { useAuditStore } from '../store/auditStore';
import { 
  FileSpreadsheet, 
  Layers, 
  CheckCircle2, 
  PlusCircle, 
  Trash2, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FolderOpen
} from 'lucide-react';
import { ScreenGuide } from '../components/ScreenGuide';

export const Dashboard: React.FC = () => {
  const { 
    currentAudit, 
    sessions, 
    loadSavedSessions, 
    resumeSession, 
    deleteSession, 
    clearCurrentAudit,
    setTab 
  } = useAuditStore();

  useEffect(() => {
    loadSavedSessions();
  }, [loadSavedSessions]);

  const activeMetadata = currentAudit.metadata;
  const items = currentAudit.items;

  // Compute stats for current audit
  const totalItems = items.length;
  const selectedItems = items.filter(i => i.isSelected);
  const selectedCount = selectedItems.length;
  const verifiedCount = selectedItems.filter(i => i.physicalQuantity !== null).length;
  const pendingCount = selectedCount - verifiedCount;
  
  let shortageCount = 0;
  let excessCount = 0;
  let totalBookValue = 0;
  let totalPhysicalValue = 0;

  items.forEach(item => {
    totalBookValue += item.bookValue;
    if (item.isSelected && item.physicalQuantity !== null) {
      const pVal = item.physicalQuantity * item.rate;
      totalPhysicalValue += pVal;
      if (item.differenceQuantity !== null) {
        if (item.differenceQuantity < 0) shortageCount++;
        if (item.differenceQuantity > 0) excessCount++;
      }
    } else {
      totalPhysicalValue += item.bookValue; // assume book value for non-audited/pending items
    }
  });

  const varianceValuation = totalPhysicalValue - totalBookValue;

  const progressPercent = selectedCount > 0 
    ? Math.round((verifiedCount / selectedCount) * 100) 
    : 0;

  const handleResume = async (id: string) => {
    await resumeSession(id);
    setTab('dashboard');
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this audit session and all verification data? This action cannot be undone.')) {
      await deleteSession(id);
    }
  };

  const guideSteps = [
    "Start a new audit session by clicking the 'Start New Audit' button above, or select a saved session from the table below.",
    "If you have an active session, check the quick KPI indicators for population size, sample size, verification progress, and variance values.",
    "Click 'Import Inventory Excel' to upload your inventory spreadsheet, or 'Go to Verification' to record physical counts.",
    "You can close the current active session safely; your work is automatically saved on this device."
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">Stock Audit Workspace</h2>
          <p className="text-sm text-slate-400 mt-1">
            Perform offline physical stock counts, sample selections, and ERP data reconciliations securely.
          </p>
        </div>
        {!activeMetadata && (
          <button
            onClick={() => setTab('new-audit')}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-teal-500/20"
          >
            <PlusCircle className="w-5 h-5" />
            Start New Audit
          </button>
        )}
      </div>

      <ScreenGuide title="Dashboard Workspace Overview" steps={guideSteps} guideKey="dashboard" />

      {/* Active Audit Session Banner / Quick Links */}
      {activeMetadata && (
        <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-6 shadow-xl relative overflow-hidden">
          {/* Decorative Gradient Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-600 to-indigo-500" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="bg-teal-500/10 text-teal-405 text-xs px-2.5 py-1 rounded-full font-semibold border border-teal-500/20">
                ACTIVE SESSION
              </span>
              <h3 className="text-xl font-bold text-slate-100 mt-2">{activeMetadata.clientName}</h3>
              <p className="text-sm text-slate-300 font-medium">{activeMetadata.auditName}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-1.5">
                <span>Auditor: {activeMetadata.auditorName}</span>
                <span>•</span>
                <span>Branch: {activeMetadata.branchUnit}</span>
                <span>•</span>
                <span>Date: {activeMetadata.auditDate}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {totalItems === 0 ? (
                <button
                  onClick={() => setTab('import')}
                  className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  Import Inventory Excel
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setTab('review')}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Population
                  </button>
                  <button
                    onClick={() => setTab('verify')}
                    className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-teal-500/15"
                  >
                    Go to Verification
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={clearCurrentAudit}
                className="text-slate-400 hover:text-red-400 hover:bg-slate-700/40 border border-slate-700 hover:border-red-500/20 px-3 py-2 rounded-lg text-sm transition-colors"
                title="Close session (data is saved)"
              >
                Close Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      {activeMetadata && totalItems > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Population Size */}
            <div className="bg-slate-800/60 border border-slate-800 p-5 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-lg">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Population Items</span>
                <span className="text-2xl font-bold text-slate-100">{totalItems.toLocaleString()}</span>
              </div>
            </div>

            {/* Selection Sample */}
            <div className="bg-slate-800/60 border border-slate-800 p-5 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-450 rounded-lg">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Audit Sample Size</span>
                <span className="text-2xl font-bold text-slate-100">
                  {selectedCount.toLocaleString()}
                  <span className="text-xs text-slate-500 font-medium ml-1">
                    ({activeMetadata.samplePercentage}% rate)
                  </span>
                </span>
              </div>
            </div>            {/* Verification Stats */}
            <div className="bg-slate-800/60 border border-slate-800 p-5 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-450 rounded-lg">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Verified / Pending</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-100">
                    {verifiedCount.toLocaleString()}
                    <span className="text-sm text-slate-400 font-normal"> / {selectedCount}</span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-555">{progressPercent}%</span>
                </div>
              </div>
            </div>

            {/* Valuation Delta */}
            <div className="bg-slate-800/60 border border-slate-800 p-5 rounded-xl flex items-center gap-4">
              <div className={`p-3 rounded-lg ${
                varianceValuation < 0 
                  ? 'bg-red-500/10 text-red-400' 
                  : varianceValuation > 0 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-slate-700/50 text-slate-400'
              }`}>
                {varianceValuation < 0 ? (
                  <TrendingDown className="w-6 h-6" />
                ) : (
                  <TrendingUp className="w-6 h-6" />
                )}
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Value Variance</span>
                <span className={`text-xl font-bold ${
                  varianceValuation < 0 
                    ? 'text-red-400' 
                    : varianceValuation > 0 
                    ? 'text-emerald-400' 
                    : 'text-slate-100'
                }`}>
                  {varianceValuation.toLocaleString(undefined, {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          {selectedCount > 0 && (
            <div className="bg-slate-800/40 border border-slate-800/80 rounded-xl p-5">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-300 mb-2">
                <span>Verification Completion Progress</span>
                <span>{verifiedCount} of {selectedCount} Items Counted ({progressPercent}%)</span>
              </div>
              <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <span>Pending Items: {pendingCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Shortages Flagged: {shortageCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Excesses Flagged: {excessCount}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span>Deterministic seed: "{activeMetadata?.randomSeed || 'None'}"</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visual Step-by-Step Tutorial Roadmap */}
      <div className="bg-slate-800 border border-slate-800 rounded-xl p-6 space-y-4 shadow-md">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
          <span className="text-lg">📖</span>
          <h3 className="text-lg font-bold text-slate-100">Step-by-Step Audit Guide</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-9 gap-3 items-center text-center">
          {/* Step 1 */}
          <div className="md:col-span-1 bg-slate-905 p-3 rounded-lg border border-slate-750 flex flex-col justify-between h-full min-h-[120px]">
            <div className="text-xl">📋</div>
            <div className="font-bold text-xs text-slate-100 mt-1">1. New Session</div>
            <p className="text-[10px] text-slate-400 mt-1">Click "New Audit" and enter client specs.</p>
          </div>
          <div className="md:col-span-1 flex justify-center text-teal-600 font-extrabold text-xl py-1 transform rotate-90 md:rotate-0">➔</div>

          {/* Step 2 */}
          <div className="md:col-span-1 bg-slate-905 p-3 rounded-lg border border-slate-750 flex flex-col justify-between h-full min-h-[120px]">
            <div className="text-xl">📤</div>
            <div className="font-bold text-xs text-slate-100 mt-1">2. Import Excel</div>
            <p className="text-[10px] text-slate-400 mt-1">Upload inventory; errors are checked instantly.</p>
          </div>
          <div className="md:col-span-1 flex justify-center text-teal-600 font-extrabold text-xl py-1 transform rotate-90 md:rotate-0">➔</div>

          {/* Step 3 */}
          <div className="md:col-span-1 bg-slate-905 p-3 rounded-lg border border-slate-750 flex flex-col justify-between h-full min-h-[120px]">
            <div className="text-xl">🎲</div>
            <div className="font-bold text-xs text-slate-100 mt-1">3. Select Sample</div>
            <p className="text-[10px] text-slate-400 mt-1">Select manually or generate a random sample.</p>
          </div>
          <div className="md:col-span-1 flex justify-center text-teal-600 font-extrabold text-xl py-1 transform rotate-90 md:rotate-0">➔</div>

          {/* Step 4 */}
          <div className="md:col-span-1 bg-slate-905 p-3 rounded-lg border border-slate-750 flex flex-col justify-between h-full min-h-[120px]">
            <div className="text-xl">✏️</div>
            <div className="font-bold text-xs text-slate-100 mt-1">4. Verify Count</div>
            <p className="text-[10px] text-slate-400 mt-1">Count items on-site and enter physical counts.</p>
          </div>
          <div className="md:col-span-1 flex justify-center text-teal-600 font-extrabold text-xl py-1 transform rotate-90 md:rotate-0">➔</div>

          {/* Step 5 */}
          <div className="md:col-span-1 bg-slate-905 p-3 rounded-lg border border-slate-750 flex flex-col justify-between h-full min-h-[120px]">
            <div className="text-xl">💾</div>
            <div className="font-bold text-xs text-slate-100 mt-1">5. Export Report</div>
            <p className="text-[10px] text-slate-400 mt-1">Export original sheets merged with audit logs.</p>
          </div>
        </div>
      </div>

      {/* Saved Session Management Table */}
      <div className="bg-slate-800 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
          <FolderOpen className="w-5 h-5 text-slate-450" />
          <h3 className="text-lg font-bold text-slate-100">Saved Sessions List</h3>
        </div>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-2.5 text-center">
            <FolderOpen className="w-10 h-10 opacity-30" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">No audit sessions found locally.</p>
              <p className="text-xs text-slate-600 max-w-xs">
                To begin working, click "Start New Audit" to name the client and upload their stock spreadsheet.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Client Name / Audit Name</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Auditor</th>
                  <th className="py-3 px-4">Last Modified</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sessions.map((sess) => {
                  const isActive = activeMetadata?.id === sess.id;
                  return (
                    <tr
                      key={sess.id}
                      onClick={() => handleResume(sess.id)}
                      className={`hover:bg-slate-700/30 transition-colors cursor-pointer group ${
                        isActive ? 'bg-teal-950/10 border-l-2 border-l-teal-500' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200 group-hover:text-teal-400 transition-colors">
                          {sess.clientName}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{sess.auditName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">{sess.branchUnit}</td>
                      <td className="py-3.5 px-4 text-slate-300">{sess.auditorName}</td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {new Date(sess.updatedAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleResume(sess.id)}
                            className="bg-slate-700 hover:bg-teal-600 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          >
                            Resume
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, sess.id)}
                            className="text-slate-500 hover:text-red-400 hover:bg-slate-700/60 p-2 rounded-lg transition-colors"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
