import React, { useState, useMemo } from 'react';
import { useAuditStore } from '../store/auditStore';
import type { StockItem, CountEntry } from '../types';
import { VirtualTable } from '../components/VirtualTable';
import { ObservationModal } from '../components/ObservationModal';
import { ScreenGuide } from '../components/ScreenGuide';
import { Search, SlidersHorizontal, Edit3, Clipboard, AlertTriangle, X, Plus, CheckCircle } from 'lucide-react';

export const PhysicalVerification: React.FC = () => {
  const { currentAudit, updatePhysicalQty, addManualItem, setTab } = useAuditStore();
  const items = currentAudit.items;

  // Selected (Sample) Items Only
  const sampleItems = useMemo(() => items.filter(i => i.isSelected), [items]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'SHORTAGE' | 'EXCESS' | 'DAMAGED'>('ALL');

  // Active Item for editing
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Manual Add states
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [mItemCode, setMItemCode] = useState('');
  const [mItemName, setMItemName] = useState('');
  const [mQty, setMQty] = useState('');
  const [mCategory, setMCategory] = useState('Unrecorded');
  const [mUom, setMUom] = useState('PCS');
  const [mLocation, setMLocation] = useState('Floor');
  const [mBin, setMBin] = useState('');
  const [mBatch, setMBatch] = useState('');
  const [mRate, setMRate] = useState('');
  const [mRemarks, setMRemarks] = useState('Manually added unrecorded physical stock found on site');
  const [mError, setMError] = useState('');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    sampleItems.forEach(i => { if (i.category) set.add(i.category); });
    return ['ALL', ...Array.from(set).sort()];
  }, [sampleItems]);

  // Stats
  const totalCount = sampleItems.length;
  const verifiedCount = sampleItems.filter(i => i.physicalQuantity !== null).length;
  const progressPercent = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  // Filtered target list
  const processedItems = useMemo(() => {
    let result = [...sampleItems];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        i => i.itemCode.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q)
      );
    }

    // Category
    if (selectedCategory !== 'ALL') {
      result = result.filter(i => i.category === selectedCategory);
    }

    // Status
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'PENDING') {
        result = result.filter(i => i.physicalQuantity === null);
      } else if (selectedStatus === 'VERIFIED') {
        result = result.filter(i => i.physicalQuantity !== null);
      } else if (selectedStatus === 'SHORTAGE') {
        result = result.filter(i => i.physicalQuantity !== null && i.differenceQuantity !== null && i.differenceQuantity < 0);
      } else if (selectedStatus === 'EXCESS') {
        result = result.filter(i => i.physicalQuantity !== null && i.differenceQuantity !== null && i.differenceQuantity > 0);
      } else if (selectedStatus === 'DAMAGED') {
        result = result.filter(i => i.tags.includes('Damaged'));
      }
    }

    return result;
  }, [sampleItems, searchQuery, selectedCategory, selectedStatus]);

  const handleRowClick = (item: StockItem) => {
    setEditingItem(item);
  };

  const handleSaveObservation = async (countEntries: CountEntry[]) => {
    if (editingItem) {
      await updatePhysicalQty(editingItem.id, countEntries);
    }
  };

  const handleSaveManualItem = async () => {
    if (!mItemCode.trim()) {
      setMError('Item code is required.');
      return;
    }
    if (!mItemName.trim()) {
      setMError('Item name is required.');
      return;
    }
    if (mQty === '') {
      setMError('Physical count quantity is required.');
      return;
    }
    const quantity = Number(mQty);
    if (isNaN(quantity) || quantity < 0) {
      setMError('Physical count must be a valid positive number.');
      return;
    }
    const rate = mRate !== '' ? Number(mRate) : 0;
    if (isNaN(rate) || rate < 0) {
      setMError('Rate must be a valid positive number.');
      return;
    }

    await addManualItem({
      itemCode: mItemCode.trim(),
      itemName: mItemName.trim(),
      physicalQuantity: quantity,
      location: mLocation.trim(),
      binLocation: mBin.trim(),
      batchNo: mBatch.trim(),
      rate,
      uom: mUom.trim(),
      category: mCategory.trim(),
      remarks: mRemarks.trim(),
      tags: [],
    });

    setIsAddingManual(false);
    // Reset form
    setMItemCode('');
    setMItemName('');
    setMQty('');
    setMRate('');
    setMBin('');
    setMBatch('');
    setMRemarks('Manually added unrecorded physical stock found on site');
    setMError('');
  };

  const columns = [
    { header: 'S.No', accessorKey: 'sNo' as keyof StockItem, className: 'w-16' },
    { header: 'Item Code', accessorKey: 'itemCode' as keyof StockItem, className: 'w-36 font-semibold text-teal-400' },
    { header: 'Item Name', accessorKey: 'itemName' as keyof StockItem },
    { header: 'Location', accessorKey: 'location' as keyof StockItem, className: 'w-36' },
    { 
      header: 'Book Qty', 
      accessorKey: (row: StockItem) => `${row.bookQuantity} ${row.uom}`, 
      className: 'w-24 text-right font-medium text-slate-400' 
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
        if (row.differenceQuantity === null) return <span className="text-slate-600 font-mono">-</span>;
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
        <div className="flex flex-wrap gap-1">
          {row.tags.map(t => {
            let color = 'bg-slate-800 text-slate-400';
            if (t === 'Shortage' || t === 'Damaged') color = 'bg-red-500/15 text-red-400';
            if (t === 'Excess' || t === 'Good Condition') color = 'bg-emerald-500/15 text-emerald-400';
            return (
              <span key={t} className={`px-2 py-0.5 rounded text-[10px] font-bold ${color}`}>
                {t}
              </span>
            );
          })}
          {row.remarks && (
            <span className="text-slate-500 italic text-xs truncate max-w-[120px]" title={row.remarks}>
              "{row.remarks}"
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Action',
      accessorKey: () => (
        <button className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 font-semibold hover:bg-teal-500/10 px-2.5 py-1 rounded transition-colors border border-teal-500/20">
          <Edit3 className="w-3.5 h-3.5" /> Edit
        </button>
      ),
      className: 'w-24 text-center'
    }
  ];

  if (totalCount === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-8 max-w-xl mx-auto text-center space-y-4 shadow-lg animate-fade-in">
        <Clipboard className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">No Verification Targets Selected</h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          You need to select items for physical audit first. You can perform random sampling or select items manually.
        </p>
        <button
          onClick={() => setTab('select')}
          className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          Configure Sample Selection
        </button>
      </div>
    );
  }

  const guideSteps = [
    "This list displays only the targeted sample items chosen for physical audit.",
    "Walk the storage warehouse and locate the physical stock matching the item code.",
    "Click/Tap any row to open the verification sheet slide-up panel.",
    "Key in the exact counted physical stock quantity. The variance difference is auto-calculated.",
    "Select relevant observation tags (e.g. Damaged, Obsolete, Recount Required) and input custom notes, then save."
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-140px)] space-y-4 animate-fade-in">
      {/* Top Banner with Stats & Progress */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-slate-800 p-4 border border-slate-700/60 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
            <Clipboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Physical Count Verification</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify {totalCount.toLocaleString()} items selected for physical auditing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 min-w-[240px] md:justify-end">
          <div className="text-right text-xs font-semibold text-slate-350 shrink-0">
            <span>Verified: {verifiedCount} / {totalCount} ({progressPercent}%)</span>
          </div>
          <div className="w-32 bg-slate-700 h-2 rounded-full overflow-hidden shrink-0">
            <div className="bg-teal-600 h-full rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
          <button
            onClick={() => setIsAddingManual(true)}
            className="flex items-center gap-1.5 bg-teal-650 hover:bg-teal-555 text-white py-1.5 px-3 rounded-lg text-xs font-semibold shrink-0 shadow-md shadow-teal-500/10"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Unrecorded Stock
          </button>
          <button
            onClick={() => setTab('summary')}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-755 hover:bg-slate-750 text-slate-300 py-1.5 px-3 rounded-lg text-xs font-semibold shrink-0"
          >
            Review Summary
          </button>
        </div>
      </div>

      <ScreenGuide title="Physical Count Verification" steps={guideSteps} guideKey="physical_verification" />

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0 bg-slate-800/40 border border-slate-800/80 p-3 rounded-xl">
        {/* Search */}
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

        {/* Category */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent text-xs text-slate-300 w-full focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories ({categories.length - 1})</option>
            {categories.filter(c => c !== 'ALL').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Verification Status */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="bg-transparent text-xs text-slate-300 w-full focus:outline-none cursor-pointer"
          >
            <option value="ALL">Status: All Items</option>
            <option value="PENDING">Status: Pending Verification</option>
            <option value="VERIFIED">Status: Verified Items</option>
            <option value="SHORTAGE">Status: Variances (Shortage)</option>
            <option value="EXCESS">Status: Variances (Excess)</option>
            <option value="DAMAGED">Status: Damaged Stock</option>
          </select>
        </div>
      </div>

      {/* Grid */}
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

      {/* Foot info */}
      <div className="flex justify-between items-center text-xs text-slate-400 shrink-0 px-1.5">
        <span>Showing {processedItems.length} matching rows • Click any row to edit physical counts</span>
      </div>

      {/* Observation Input Modal */}
      <ObservationModal
        item={editingItem}
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveObservation}
      />

      {/* Manual Unrecorded Stock Modal */}
      {isAddingManual && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
          <div className="bg-slate-800 border-t sm:border border-slate-700 w-full max-w-lg rounded-t-2xl sm:rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/80 shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Add Unrecorded Physical Stock</h3>
                <p className="text-xs text-slate-400 mt-0.5">Record items found physically on-site that are not in the ERP book records.</p>
              </div>
              <button
                onClick={() => setIsAddingManual(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-5 sm:p-6 flex-1 space-y-4 overflow-y-auto text-xs font-semibold text-slate-350">
              <div className="grid grid-cols-2 gap-4">
                {/* Item Code */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] font-bold">Item Code *</label>
                  <input
                    type="text"
                    value={mItemCode}
                    onChange={(e) => setMItemCode(e.target.value)}
                    placeholder="e.g. ITM-NEW-99"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                </div>

                {/* Item Name */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] font-bold">Item Name *</label>
                  <input
                    type="text"
                    value={mItemName}
                    onChange={(e) => setMItemName(e.target.value)}
                    placeholder="e.g. Extra Flour Bags"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] font-bold">Physical Count *</label>
                  <input
                    type="number"
                    value={mQty}
                    onChange={(e) => setMQty(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold text-sm"
                  />
                </div>

                {/* UOM */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] font-bold">Unit (UOM)</label>
                  <input
                    type="text"
                    value={mUom}
                    onChange={(e) => setMUom(e.target.value)}
                    placeholder="e.g. PCS, KG, BOX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] font-bold">Location</label>
                  <input
                    type="text"
                    value={mLocation}
                    onChange={(e) => setMLocation(e.target.value)}
                    placeholder="e.g. Freezer, Kitchen"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Bin Location */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] font-bold">Bin Location</label>
                  <input
                    type="text"
                    value={mBin}
                    onChange={(e) => setMBin(e.target.value)}
                    placeholder="e.g. Shelf B-4"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                </div>

                {/* Batch No */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] font-bold">Batch Number</label>
                  <input
                    type="text"
                    value={mBatch}
                    onChange={(e) => setMBatch(e.target.value)}
                    placeholder="e.g. BATCH-2026"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                </div>

                {/* Rate */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] font-bold">Unit Rate (₹)</label>
                  <input
                    type="number"
                    value={mRate}
                    onChange={(e) => setMRate(e.target.value)}
                    placeholder="e.g. 150.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5 col-span-2">
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] font-bold">Category</label>
                  <input
                    type="text"
                    value={mCategory}
                    onChange={(e) => setMCategory(e.target.value)}
                    placeholder="e.g. Raw Materials, Spices"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Remarks */}
                <div className="space-y-1.5 col-span-2">
                  <label className="block text-slate-400 uppercase tracking-wider text-[10px] font-bold">Remarks</label>
                  <textarea
                    value={mRemarks}
                    onChange={(e) => setMRemarks(e.target.value)}
                    placeholder="Describe where this item was found..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 h-16 resize-none"
                  />
                </div>
              </div>

              {mError && (
                <p className="text-red-400 font-semibold flex items-center gap-1 mt-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {mError}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/50 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsAddingManual(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-205 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveManualItem}
                className="px-4 py-2 bg-teal-650 hover:bg-teal-555 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
              >
                <CheckCircle className="w-4 h-4" />
                Add & Verify Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
