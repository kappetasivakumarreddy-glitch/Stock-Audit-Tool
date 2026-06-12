import { useEffect, useState } from 'react';
import { useAuditStore } from './store/auditStore';
import { Dashboard } from './pages/Dashboard';
import { NewAudit } from './pages/NewAudit';
import { ImportInventory } from './pages/ImportInventory';
import { InventoryReview } from './pages/InventoryReview';
import { SampleSelection } from './pages/SampleSelection';
import { PhysicalVerification } from './pages/PhysicalVerification';
import { ReviewSummary } from './pages/ReviewSummary';
import { Export } from './pages/Export';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Settings2, 
  ClipboardCheck, 
  BarChart3, 
  Download, 
  PlusCircle, 
  Clipboard, 
  FolderSync,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  const { currentAudit, activeTab, setTab, loadSavedSessions, resumeSession } = useAuditStore();
  const [resumePromptOpen, setResumePromptOpen] = useState(false);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      await loadSavedSessions();
      
      // Check for last active session
      const savedId = localStorage.getItem('last_active_session_id');
      if (savedId) {
        setLastSessionId(savedId);
        setResumePromptOpen(true);
      }
    };
    initApp();
  }, [loadSavedSessions]);

  // Set last active session ID whenever current audit metadata changes
  useEffect(() => {
    if (currentAudit.metadata) {
      localStorage.setItem('last_active_session_id', currentAudit.metadata.id);
    } else {
      localStorage.removeItem('last_active_session_id');
    }
  }, [currentAudit.metadata]);

  const handleResumeLast = async () => {
    if (lastSessionId) {
      await resumeSession(lastSessionId);
    }
    setResumePromptOpen(false);
  };

  const handleDeclineResume = () => {
    localStorage.removeItem('last_active_session_id');
    setResumePromptOpen(false);
  };

  const metadata = currentAudit.metadata;
  const items = currentAudit.items;
  const hasItems = items && items.length > 0;

  const stepsList = [
    { id: 'new-audit', label: '1. Initialize Session', enabled: !metadata },
    { id: 'import', label: '2. Import Excel', enabled: !!metadata },
    { id: 'review', label: '3. Review Population', enabled: !!metadata && hasItems },
    { id: 'select', label: '4. Sample Selection', enabled: !!metadata && hasItems },
    { id: 'verify', label: '5. Physical Count', enabled: !!metadata && hasItems },
    { id: 'summary', label: '6. Variance Summary', enabled: !!metadata && hasItems },
    { id: 'export', label: '7. Export Report', enabled: !!metadata && hasItems },
  ] as const;

  // Sidebar link details with workflow validation status
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, enabled: true },
    { id: 'new-audit', label: 'New Audit', icon: PlusCircle, enabled: !metadata },
    { id: 'import', label: 'Import Excel', icon: FileSpreadsheet, enabled: !!metadata },
    { id: 'review', label: 'Review Population', icon: Clipboard, enabled: !!metadata && hasItems },
    { id: 'select', label: 'Sample Selection', icon: Settings2, enabled: !!metadata && hasItems },
    { id: 'verify', label: 'Physical Count', icon: ClipboardCheck, enabled: !!metadata && hasItems },
    { id: 'summary', label: 'Variance Summary', icon: BarChart3, enabled: !!metadata && hasItems },
    { id: 'export', label: 'Export Report', icon: Download, enabled: !!metadata && hasItems },
  ] as const;

  // Render current tab component
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'new-audit':
        return <NewAudit />;
      case 'import':
        return <ImportInventory />;
      case 'review':
        return <InventoryReview />;
      case 'select':
        return <SampleSelection />;
      case 'verify':
        return <PhysicalVerification />;
      case 'summary':
        return <ReviewSummary />;
      case 'export':
        return <Export />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-full min-h-screen bg-slate-950 text-slate-100 font-sans relative">
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)} 
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-40 transform transition-transform duration-300 md:transform-none md:flex w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-teal-650 text-white p-2 rounded-lg font-bold shadow-md shadow-teal-500/10">
              📊
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-slate-100">StockVerify</h1>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Offline Audit Tool</span>
            </div>
          </div>
          
          {/* Mobile close menu button */}
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 text-slate-450 hover:text-white md:hidden hover:bg-slate-850 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav List */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                disabled={!item.enabled}
                onClick={() => {
                  setTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/15'
                    : item.enabled
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    : 'text-slate-350 opacity-50 cursor-not-allowed'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Client Storage Status footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 text-[10px] text-slate-500 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% Local Sandboxed</span>
          </div>
          <p className="leading-relaxed">
            Data stays on your machine. No cloud sync, external API, or tracker.
          </p>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Panel */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger trigger */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-450 hover:text-white hover:bg-slate-850 rounded-lg md:hidden transition-colors"
              title="Open Navigation"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
            
            {metadata ? (
              <div className="text-sm truncate max-w-[200px] xs:max-w-xs">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Active Audit</span>
                <span className="font-bold text-slate-200 truncate block">{metadata.clientName}</span>
              </div>
            ) : (
              <span className="text-sm font-semibold text-slate-400">No active audit session</span>
            )}
          </div>
          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            System time: {new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}
          </div>
        </header>

        {/* Content Panel */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-955 flex flex-col gap-6">
          {activeTab !== 'dashboard' && (
            <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 shadow-sm shrink-0">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
                Audit Progress Stepper & Guidance
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {stepsList.map((step) => {
                  const isActive = activeTab === step.id;
                  return (
                    <button
                      key={step.id}
                      disabled={!step.enabled}
                      onClick={() => setTab(step.id)}
                      className={`px-3 py-2 text-left rounded-lg transition-all text-xs font-bold flex flex-col justify-between border ${
                        isActive
                          ? 'bg-teal-600/10 border-teal-500 text-teal-650 shadow-sm ring-1 ring-teal-500/20'
                          : step.enabled
                          ? 'bg-slate-800/40 border-slate-700 text-slate-350 hover:bg-slate-800 hover:text-slate-100'
                          : 'bg-slate-900 border-slate-700/20 text-slate-500 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <span className="truncate">{step.label}</span>
                      <span className="text-[9px] font-semibold text-slate-500 mt-1 uppercase">
                        {isActive ? 'Active' : step.enabled ? 'Ready' : 'Locked'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex-1">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Resume Session Modal */}
      {resumePromptOpen && lastSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-teal-600/10 text-teal-450 rounded-lg shrink-0">
                <FolderSync className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100">Previous Session Found</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  An unfinished stock audit verification session was detected on this device. Would you like to resume?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
              <button
                onClick={handleDeclineResume}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Start New Audit
              </button>
              <button
                onClick={handleResumeLast}
                className="px-4 py-2 bg-teal-650 hover:bg-teal-555 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-teal-500/20"
              >
                Resume Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
