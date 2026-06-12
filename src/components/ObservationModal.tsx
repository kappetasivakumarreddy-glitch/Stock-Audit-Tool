import React, { useState, useEffect } from 'react';
import type { StockItem, ObservationTag, CountEntry } from '../types';
import { QUICK_TAGS } from '../types';
import { X, CheckCircle, AlertTriangle, Plus, Trash2, Clock } from 'lucide-react';

interface ObservationModalProps {
  item: StockItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (countEntries: CountEntry[]) => Promise<void>;
}

export const ObservationModal: React.FC<ObservationModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
}) => {
  // Existing entries list
  const [countEntries, setCountEntries] = useState<CountEntry[]>([]);

  // Fields for adding a new entry
  const [newQty, setNewQty] = useState<string>('');
  const [newRemarks, setNewRemarks] = useState<string>('');
  const [newTags, setNewTags] = useState<ObservationTag[]>([]);
  
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (item) {
      setCountEntries(item.countEntries || []);
      setError('');
      // reset form
      setNewQty('');
      setNewRemarks('');
      setNewTags([]);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleAddCount = () => {
    if (newQty === '') {
      setError('Quantity cannot be blank.');
      return;
    }

    const numQty = Number(newQty);
    if (isNaN(numQty) || numQty < 0) {
      setError('Please enter a valid positive quantity.');
      return;
    }

    const entry: CountEntry = {
      id: `count_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      quantity: numQty,
      timestamp: Date.now(),
      remarks: newRemarks,
      tags: newTags,
    };

    setCountEntries((prev) => [...prev, entry]);
    setNewQty('');
    setNewRemarks('');
    setNewTags([]);
    setError('');
  };

  const handleRemoveCount = (id: string) => {
    setCountEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const toggleTag = (tag: ObservationTag) => {
    setNewTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleConfirmSave = async () => {
    await onSave(countEntries);
    onClose();
  };

  const totalPhysicalQuantity = countEntries.reduce((sum, entry) => sum + entry.quantity, 0);
  const hasEntries = countEntries.length > 0;
  const computedDiff = hasEntries ? totalPhysicalQuantity - item.bookQuantity : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div className="bg-slate-800 border-t sm:border border-slate-700 w-full max-w-lg rounded-t-2xl sm:rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/80 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Audit Verification Counts</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">Item Code: {item.itemCode}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 flex-1 space-y-5 overflow-y-auto">
          {/* Metadata Display Card */}
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-850 grid grid-cols-2 gap-3.5 text-xs">
            <div className="col-span-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Item Name</span>
              <span className="font-semibold text-slate-200 text-sm">{item.itemName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Location / Bin</span>
              <span className="font-medium text-slate-350 truncate block">
                {item.location || 'N/A'} {item.binLocation ? ` / ${item.binLocation}` : ''}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Book Quantity (ERP)</span>
              <span className="font-bold text-teal-405 text-sm">{item.bookQuantity} {item.uom}</span>
            </div>
          </div>

          {/* List of current counts */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Recorded Counts List ({countEntries.length})
            </label>
            {countEntries.length === 0 ? (
              <div className="border border-dashed border-slate-700 p-4 rounded-lg text-center text-xs text-slate-500">
                No counts recorded yet. Add physical logs below.
              </div>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {countEntries.map((entry, index) => (
                  <div key={entry.id} className="bg-slate-900/40 border border-slate-800 p-3 rounded-lg flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">
                          #{index + 1}: {entry.quantity} {item.uom}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      {entry.remarks && (
                        <p className="text-slate-400 italic font-medium truncate">"{entry.remarks}"</p>
                      )}
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.map(t => (
                            <span key={t} className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[9px] font-bold">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveCount(entry.id)}
                      className="text-slate-500 hover:text-red-400 hover:bg-slate-800 p-1.5 rounded-lg transition-colors shrink-0"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form to Add Count Entry */}
          <div className="bg-slate-800/60 border border-slate-750 p-4 rounded-lg space-y-4 shrink-0">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Add New Count Entry
            </h4>
            
            {/* Quantity */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400">
                Quantity Counted
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={newQty}
                  onChange={(e) => {
                    setNewQty(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g. 20"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg py-1.5 px-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder-slate-700 text-sm font-semibold"
                />
                <span className="text-xs font-semibold text-slate-400 w-12">{item.uom}</span>
              </div>
            </div>

            {/* Quick Observation Tags */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400">
                Observational Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.filter(t => t !== 'Shortage' && t !== 'Excess').map((tag) => {
                  const isSelected = newTags.includes(tag);
                  let colorClass = 'bg-slate-900/50 text-slate-400 border-slate-750 hover:bg-slate-900';
                  
                  if (isSelected) {
                    if (tag === 'Damaged' || tag === 'Obsolete' || tag === 'Slow Moving') {
                      colorClass = 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30';
                    } else if (tag === 'Good Condition') {
                      colorClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30';
                    } else {
                      colorClass = 'bg-teal-500/20 text-teal-400 border-teal-500/40 hover:bg-teal-500/30';
                    }
                  }

                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${colorClass}`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400">
                Count Specific Remarks
              </label>
              <input
                type="text"
                value={newRemarks}
                onChange={(e) => setNewRemarks(e.target.value)}
                placeholder="e.g. Row 2 in Freezer, batch discrepancy"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder-slate-700"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}

            <button
              onClick={handleAddCount}
              className="w-full bg-slate-900 border border-slate-700 hover:bg-slate-750 text-slate-200 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-teal-400" />
              Add Count Log
            </button>
          </div>

          {/* Variance Calculator Display */}
          {hasEntries && computedDiff !== null && (
            <div className={`p-3.5 rounded-lg border flex items-center justify-between text-xs shrink-0 ${
              computedDiff < 0 
                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                : computedDiff > 0 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
            }`}>
              <div className="space-y-0.5">
                <span className="font-semibold block">Consolidated Physical Stock: {totalPhysicalQuantity} {item.uom}</span>
                <span className="text-[10px] text-slate-450">Compared to ERP book value: {item.bookQuantity} {item.uom}</span>
              </div>
              <span className="font-bold text-sm shrink-0">
                Variance: {computedDiff > 0 ? `+${computedDiff}` : computedDiff} {item.uom}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSave}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
          >
            <CheckCircle className="w-4 h-4" />
            Save Verification
          </button>
        </div>
      </div>
    </div>
  );
};
