import React, { useState, useMemo } from 'react';
import { useAuditStore } from '../store/auditStore';
import type { StockItem, CountEntry } from '../types';
import { VirtualTable } from '../components/VirtualTable';
import { ObservationModal } from '../components/ObservationModal';
import { ScreenGuide } from '../components/ScreenGuide';
import { Search, SlidersHorizontal, CheckSquare, AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';

export const ReviewSummary: React.FC = () => {
  const { currentAudit, updatePhysicalQty, setTab } = useAuditStore();
  const items = currentAudit.items;

  // Selected (Audited) Items
  const auditedItems = useMemo(() => items.filter(i => i.isSelected), [items]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'SHORTAGE' | 'EXCESS' | 'PENDING'>('ALL');

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Stats
  const stats = useMemo(() => {
    let shortages = 0;
    let excesses = 0;
    let pending = 0;
    let totalValueBook = 0;
    let totalValuePhysical = 0;

    auditedItems.forEach(i => {
      totalValueBook += i.bookValue;
      if (i.physicalQuantity === null) {
        pending++;
        totalValuePhysical += i.bookValue;
      } else {
        totalValuePhysical += (i.physicalQuantity * i.rate);
        if (i.differenceQuantity !== null) {
          if (i.differenceQuantity < 0) shortages++;
          if (i.differenceQuantity > 0) excesses++;
        }
      }
    });

    return {
      shortages,
      excesses,
      pending,
      netVariance: totalValuePhysical - totalValueBook
    };
  }, [auditedItems]);

  // Filtered List
  const processedItems = useMemo(() => {
    let result = [...auditedItems];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        i => i.itemCode.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q)
      );
    }

    if (filterType !== 'ALL') {
      if (filterType === 'SHORTAGE') {
        result = result.filter(i => i.physicalQuantity !== null && i.differenceQuantity !== null && i.differenceQuantity < 0);
      } else if (filterType === 'EXCESS') {
        result = result.filter(i => i.physicalQuantity !== null && i.differenceQuantity !== null && i.differenceQuantity > 0);
      } else if (filterType === 'PENDING') {
        result = result.filter(i => i.physicalQuantity === null);
      }
    }

    return result;
  }, [auditedItems, searchQuery, filterType]);

  const handleRowClick = (item: StockItem) => {
    setEditingItem(item);
  };

  const handleSaveObservation = async (countEntries: CountEntry[]) => {
    if (editingItem) {
      await updatePhysicalQty(editingItem.id, countEntries);
    }
  };

  const columns = [
    { header: 'Item Code', accessorKey: 'itemCode' as keyof StockItem, className: 'w-36 font-semibold text-teal-400' },
    { header: 'Item Name', accessorKey: 'itemName' as keyof StockItem },
    { 
      header: 'Book Qty', 
      accessorKey: (row: StockItem) => `${row.bookQuantity} ${row.uom}`, 
      className: 'w-28 text-right text-slate-400 font-medium' 
    },
    { 
      header: 'Physical Qty', 
      accessorKey: (row: StockItem) => (
        row.physicalQuantity !== null ? (
          <span className="font-semibold text-white">{row.physicalQuantity} {row.uom}</span>
        ) : (
          <span className="text-amber-500 font-semibold flex items-center gap-1 justify-end">
            <AlertTriangle className="w-3.5 h-3.5" /> Pending
          </span>
        )
      ), 
      className: 'w-32 text-right' 
    },
    { 
      header: 'Difference', 
      accessorKey: (row: StockItem) => {
        if (row.differenceQuantity === null) return <span className="text-slate-655 font-mono">-</span>;
        if (row.differenceQuantity < 0) {
          return <span className="text-red-400 font-bold font-mono">{row.differenceQuantity} {row.uom}</span>;
        }
        if (row.differenceQuantity > 0) {
          return <span className="text-emerald-400 font-bold font-mono">+{row.differenceQuantity} {row.uom}</span>;
        }
        return <span className="text-slate-400 font-bold font-mono">0</span>;
      },
      className: 'w-32 text-right' 
    },
    {
      header: 'Observations',
      accessorKey: (row: StockItem) => (
        <span className="text-xs text-slate-350 italic truncate block max-w-[200px]" title={row.remarks}>
          {row.tags.length > 0 ? `[${row.tags.join(', ')}] ` : ''}
          {row.remarks ? `"${row.remarks}"` : ''}
        </span>
      )
    }
  ];

  const guideSteps = [
    "Cross-examine the computed audit discrepancies (shortages and excesses) across verified stock.",
    "Toggle the summary filter at the top to focus specifically on 'Shortages', 'Excesses', or 'Pending counts'.",
    "Click/Tap any item card or table row directly to make final corrections to physical numbers.",
    "Inspect the Net Valuation Variance at the top to understand the total cash value delta.",
    "Ensure no pending items remain, then click 'Proceed to Export Excel' to download your sheet."
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-140px)] space-y-4 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-slate-800 p-4 border border-slate-700/60 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Audit Review Summary</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review and adjust quantities prior to generating the final spreadsheet export
            </p>
          </div>
        </div>

        <button
          onClick={() => setTab('export')}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-teal-500/15 shrink-0 animate-pulse"
        >
          Proceed to Export Excel
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <ScreenGuide title="Variance & Discrepancy Review" steps={guideSteps} guideKey="review_summary" />

      {/* Variance Dashboard Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0 font-medium text-slate-400 text-xs">
        {/* Shortages */}
        <div className="bg-slate-800/40 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 uppercase font-semibold">Shortages</span>
            <span className="text-lg font-bold text-red-400 block">{stats.shortages} Items</span>
          </div>
          <AlertCircle className="w-8 h-8 text-red-500/20" />
        </div>

        {/* Excesses */}
        <div className="bg-slate-800/40 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 uppercase font-semibold">Excesses</span>
            <span className="text-lg font-bold text-emerald-400 block">{stats.excesses} Items</span>
          </div>
          <CheckSquare className="w-8 h-8 text-emerald-500/20" />
        </div>

        {/* Pending */}
        <div className="bg-slate-800/40 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 uppercase font-semibold">Pending Verify</span>
            <span className="text-lg font-bold text-amber-500 block">{stats.pending} Items</span>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-500/20" />
        </div>

        {/* Net Valuation Variance */}
        <div className="bg-slate-800/40 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 uppercase font-semibold">Net Variance</span>
            <span className={`text-lg font-bold block ${stats.netVariance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {stats.netVariance.toLocaleString(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
            </span>
          </div>
          <span className="text-slate-500 font-mono text-sm font-bold">VAL</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0 bg-slate-800/40 border border-slate-800/80 p-3 rounded-xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items in sample..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-600"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-transparent text-xs text-slate-300 w-full focus:outline-none cursor-pointer"
          >
            <option value="ALL">Variance Type: All Audited Items</option>
            <option value="SHORTAGE">Shortage Items ({stats.shortages})</option>
            <option value="EXCESS">Excess Items ({stats.excesses})</option>
            <option value="PENDING">Pending Count Verification ({stats.pending})</option>
          </select>
        </div>
      </div>

      {/* Grid container */}
      <div className="flex-1 min-h-0 bg-slate-900/40 rounded-lg">
        <VirtualTable
          data={processedItems}
          columns={columns}
          onRowClick={handleRowClick}
          sortKey={null}
          sortAsc={true}
          onSort={() => {}}
        />
      </div>

      {/* Record info */}
      <div className="flex justify-between items-center text-xs text-slate-400 shrink-0 px-1.5">
        <span>Showing {processedItems.length} matching rows • Click any row to make final count changes</span>
      </div>

      {/* Observation Input Modal */}
      <ObservationModal
        item={editingItem}
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveObservation}
      />
    </div>
  );
};
