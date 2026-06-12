import React, { useState, useMemo, useEffect } from 'react';
import { useAuditStore } from '../store/auditStore';
import { generateRandomSeed } from '../utils/random';
import type { StockItem } from '../types';
import { ScreenGuide } from '../components/ScreenGuide';
import { 
  Percent, 
  Settings2, 
  Lock, 
  Unlock, 
  RotateCw,
  CheckCircle,
  Eye
} from 'lucide-react';
import { VirtualTable } from '../components/VirtualTable';

export const SampleSelection: React.FC = () => {
  const { 
    currentAudit, 
    generateSample, 
    lockSample, 
    toggleItemSelection, 
    selectAllItems, 
    setItemSelectionBatch,
    setTab 
  } = useAuditStore();

  const { metadata, items } = currentAudit;

  const [samplePct, setSamplePct] = useState<string>(
    metadata?.samplePercentage ? String(metadata.samplePercentage) : '10'
  );
  const [seed, setSeed] = useState<string>(
    metadata?.randomSeed || generateRandomSeed()
  );
  const [activeSelectTab, setActiveSelectTab] = useState<'random' | 'manual'>('random');
  const [samplingMethod, setSamplingMethod] = useState<'items' | 'value' | 'quantity'>('items');

  // Manual Filter selections (to allow select by Category or Location)
  const [selCategory, setSelCategory] = useState('ALL');
  const [selLocation, setSelLocation] = useState('ALL');

  useEffect(() => {
    if (metadata?.randomSeed) {
      setSeed(metadata.randomSeed);
    }
    if (metadata?.samplePercentage) {
      setSamplePct(String(metadata.samplePercentage));
    }
    if (metadata?.samplingMethod) {
      setSamplingMethod(metadata.samplingMethod);
    }
  }, [metadata]);

  if (!metadata) return null;

  // Stats
  const eligibleItems = useMemo(() => items.filter(i => i.auditRequired), [items]);
  const populationSize = eligibleItems.length;
  const selectedItems = useMemo(() => items.filter(i => i.isSelected), [items]);
  const selectedIds = useMemo(() => new Set(selectedItems.map(s => s.id)), [selectedItems]);

  const targetSampleSize = useMemo(() => {
    const pct = Number(samplePct);
    if (isNaN(pct) || pct <= 0) return 0;
    
    if (samplingMethod === 'items') {
      return Math.max(1, Math.round(populationSize * (pct / 100)));
    } else if (samplingMethod === 'value') {
      const sortedByValue = [...eligibleItems].sort((a, b) => b.bookValue - a.bookValue);
      const totalValue = eligibleItems.reduce((sum, item) => sum + item.bookValue, 0);
      const targetValue = totalValue * (pct / 100);
      
      let cumulativeValue = 0;
      let count = 0;
      for (const item of sortedByValue) {
        count++;
        cumulativeValue += item.bookValue;
        if (cumulativeValue >= targetValue) break;
      }
      return count;
    } else if (samplingMethod === 'quantity') {
      const sortedByQty = [...eligibleItems].sort((a, b) => b.bookQuantity - a.bookQuantity);
      const totalQty = eligibleItems.reduce((sum, item) => sum + item.bookQuantity, 0);
      const targetQty = totalQty * (pct / 100);
      
      let cumulativeQty = 0;
      let count = 0;
      for (const item of sortedByQty) {
        count++;
        cumulativeQty += item.bookQuantity;
        if (cumulativeQty >= targetQty) break;
      }
      return count;
    }
    return 0;
  }, [populationSize, samplePct, samplingMethod, eligibleItems]);

  // Derived filter options for category/location manual selection
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { if (i.category) set.add(i.category); });
    return ['ALL', ...Array.from(set).sort()];
  }, [items]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { if (i.location) set.add(i.location); });
    return ['ALL', ...Array.from(set).sort()];
  }, [items]);

  const filteredSubset = useMemo(() => {
    let result = [...items];
    if (selCategory !== 'ALL') {
      result = result.filter(i => i.category === selCategory);
    }
    if (selLocation !== 'ALL') {
      result = result.filter(i => i.location === selLocation);
    }
    return result;
  }, [items, selCategory, selLocation]);

  const handleGenerateSample = async () => {
    const pct = Number(samplePct);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      alert('Please enter a valid sample percentage between 0.1% and 100%.');
      return;
    }
    if (samplingMethod === 'items' && !seed.trim()) {
      alert('Please enter or generate a random seed.');
      return;
    }
    await generateSample(pct, seed.trim(), samplingMethod);
  };

  const handleNewSeed = () => {
    setSeed(generateRandomSeed());
  };

  const handleLockSample = async () => {
    if (selectedItems.length === 0) {
      alert('Cannot lock sample: No items have been selected for auditing. Select manually or generate random sample.');
      return;
    }
    if (confirm('Lock selection? This will prevent any further additions or removals to the sample, securing the audit trial before physical count begins.')) {
      await lockSample();
    }
  };

  const handleBatchSelect = async (select: boolean) => {
    const ids = filteredSubset.map(f => f.id);
    await setItemSelectionBatch(ids, select);
  };

  // Virtualized list of current selections columns
  const columns = [
    { header: 'S.No', accessorKey: 'sNo' as keyof StockItem, className: 'w-16' },
    { header: 'Item Code', accessorKey: 'itemCode' as keyof StockItem, className: 'w-36 font-semibold text-teal-400' },
    { header: 'Item Name', accessorKey: 'itemName' as keyof StockItem },
    { header: 'Category', accessorKey: 'category' as keyof StockItem, className: 'w-36' },
    { header: 'Location', accessorKey: 'location' as keyof StockItem, className: 'w-36' },
    { header: 'Book Qty', accessorKey: (row: StockItem) => `${row.bookQuantity} ${row.uom}`, className: 'w-28 text-right' },
    { header: 'Rate (₹)', accessorKey: (row: StockItem) => row.rate.toFixed(2), className: 'w-24 text-right' },
  ];

  const guideSteps = [
    "Determine which inventory items require physical audit inspection.",
    "Option 1 (Random): Enter a percentage (e.g. 10%) and an editable alphanumeric Seed, then click 'Generate' to perform deterministic local sampling.",
    "Option 2 (Manual): Toggle the Category/Location filters and click 'Select All Group' to manually target rows.",
    "Option 3 (Individual): Tap/Click the checkbox on individual grid cards to refine selection targets.",
    "IMPORTANT: Once targeting is complete, click 'Lock Sample Selection' to freeze your sample and enable physical count entries."
  ];

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <ScreenGuide title="Audit Target Selection & Sampling" steps={guideSteps} guideKey="sample_selection" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Controls Column */}
      <div className="lg:col-span-1 space-y-6">
        {/* Sample Status Card */}
        <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-700">
            <h3 className="font-bold text-slate-100 flex items-center gap-2 text-base">
              <Percent className="w-5 h-5 text-teal-400" />
              Sample Status
            </h3>
            {metadata.sampleLocked ? (
              <span className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs px-2 py-0.5 rounded-full font-semibold">
                <Lock className="w-3.5 h-3.5" /> Locked
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2 py-0.5 rounded-full font-semibold">
                <Unlock className="w-3.5 h-3.5" /> Open
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-400">
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850">
              <span className="block text-slate-500 uppercase">Population</span>
              <span className="text-xl font-bold text-slate-200 mt-1 block">{populationSize.toLocaleString()}</span>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850">
              <span className="block text-slate-500 uppercase">Sample Size</span>
              <span className="text-xl font-bold text-teal-400 mt-1 block">{selectedItems.length.toLocaleString()}</span>
            </div>
          </div>

          {metadata.sampleLocked ? (
            <button
              onClick={() => setTab('verify')}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-500/15"
            >
              <CheckCircle className="w-4 h-4" />
              Proceed to Physical Verification
            </button>
          ) : (
            <button
              onClick={handleLockSample}
              disabled={selectedItems.length === 0}
              className="w-full bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/15 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              Lock Sample Selection
            </button>
          )}
        </div>

        {/* Configuration Panel */}
        {!metadata.sampleLocked && (
          <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex border-b border-slate-700">
              <button
                onClick={() => setActiveSelectTab('random')}
                className={`flex-1 pb-2 text-sm font-semibold border-b-2 transition-colors ${
                  activeSelectTab === 'random' 
                    ? 'border-teal-500 text-teal-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Random Sampling
              </button>
              <button
                onClick={() => setActiveSelectTab('manual')}
                className={`flex-1 pb-2 text-sm font-semibold border-b-2 transition-colors ${
                  activeSelectTab === 'manual' 
                    ? 'border-teal-500 text-teal-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Manual / Group
              </button>
            </div>
            {activeSelectTab === 'random' ? (
              <div className="space-y-4">
                {/* Sampling Basis dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider">
                    Sampling Basis Option
                  </label>
                  <select
                    value={samplingMethod}
                    onChange={(e) => setSamplingMethod(e.target.value as 'items' | 'value' | 'quantity')}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="items">1. Based on Total No. of Items (Random Rows %)</option>
                    <option value="value">2. Based on Total Stock Value (High Value Coverage %)</option>
                    <option value="quantity">3. Based on Total Quantity (High Qty Coverage %)</option>
                  </select>
                </div>

                {/* Sample Rate / Coverage */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {samplingMethod === 'items' 
                      ? 'Sample Rate (%)' 
                      : samplingMethod === 'value' 
                      ? 'Cumulative Stock Value Coverage (%)' 
                      : 'Cumulative Quantity Coverage (%)'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={samplePct}
                      onChange={(e) => setSamplePct(e.target.value)}
                      placeholder="10"
                      min="0.1"
                      max="100"
                      step="any"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="bg-slate-900 border border-slate-700 text-slate-400 px-3 py-2 rounded-lg text-sm font-semibold shrink-0">
                      %
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-450 mt-1 block">
                    Calculated target size: <span className="font-bold text-slate-200">{targetSampleSize.toLocaleString()}</span> items
                  </span>
                </div>

                {/* Seed (Only visible if samplingMethod === 'items') */}
                {samplingMethod === 'items' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Deterministic Random Seed
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={seed}
                        onChange={(e) => setSeed(e.target.value.toUpperCase())}
                        placeholder="SEED"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono tracking-widest text-center"
                      />
                      <button
                        onClick={handleNewSeed}
                        className="bg-slate-900 hover:bg-slate-750 border border-slate-700 text-slate-355 hover:text-slate-200 p-2 rounded-lg transition-colors shrink-0"
                        title="Generate New Seed"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-455 mt-1 block leading-relaxed">
                      Same seed + percentage values will always select the identical items.
                    </span>
                  </div>
                )}

                <button
                  onClick={handleGenerateSample}
                  className="w-full bg-teal-650 hover:bg-teal-555 text-white py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-500/15"
                >
                  <Settings2 className="w-4 h-4" />
                  Generate Audit Sample
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Filter Category
                  </label>
                  <select
                    value={selCategory}
                    onChange={(e) => setSelCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 text-slate-300 rounded-lg py-2 px-3 text-xs focus:outline-none cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'ALL' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Filter Location
                  </label>
                  <select
                    value={selLocation}
                    onChange={(e) => setSelLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 text-slate-300 rounded-lg py-2 px-3 text-xs focus:outline-none cursor-pointer"
                  >
                    {locations.map(loc => (
                      <option key={loc} value={loc}>
                        {loc === 'ALL' ? 'All Locations' : loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector Action Buttons */}
                <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-lg text-xs text-slate-400 space-y-1">
                  <p>Filtered Rows: <span className="font-bold text-slate-300">{filteredSubset.length}</span></p>
                  <p>This allows selecting or deselecting the entire filtered block at once.</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleBatchSelect(true)}
                    className="bg-teal-600/10 hover:bg-teal-600/20 text-teal-400 border border-teal-500/20 py-2 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Select All Group
                  </button>
                  <button
                    onClick={() => handleBatchSelect(false)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Deselect Group
                  </button>
                </div>

                <div className="border-t border-slate-750 pt-3 flex gap-2">
                  <button
                    onClick={() => selectAllItems(true)}
                    className="flex-1 bg-slate-900 hover:bg-slate-750 border border-slate-700 text-slate-300 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    Select Entire Inventory
                  </button>
                  <button
                    onClick={() => selectAllItems(false)}
                    className="flex-1 bg-slate-900 hover:bg-slate-750 border border-slate-700 text-slate-350 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    Clear All Selection
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Items Grid (Population details) */}
      <div className="lg:col-span-2 flex flex-col h-[65vh] lg:h-[calc(100vh-140px)] min-h-[400px]">
        <div className="flex items-center gap-2 bg-slate-800 p-4 border border-slate-700/60 rounded-t-xl justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Eye className="w-5 h-5 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-100">Sample Verification Targets ({selectedItems.length})</h3>
          </div>
          {!metadata.sampleLocked && (
            <span className="text-[11px] text-slate-400 italic">
              * Click checkbox in rows to manually adjust selection
            </span>
          )}
        </div>
        
        <div className="flex-1 min-h-0 bg-slate-900/40 rounded-b-xl border border-t-0 border-slate-800">
          <VirtualTable
            data={items}
            columns={columns}
            selectedItemIds={selectedIds}
            onToggleSelect={!metadata.sampleLocked ? toggleItemSelection : undefined}
            onToggleSelectAll={!metadata.sampleLocked ? selectAllItems : undefined}
            sortKey={null}
            sortAsc={true}
            onSort={() => {}}
          />
        </div>
      </div>
    </div>
  </div>
);
};
