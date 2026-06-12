import React, { useState, useMemo } from 'react';
import { useAuditStore } from '../store/auditStore';
import { VirtualTable } from '../components/VirtualTable';
import type { StockItem } from '../types';
import { ScreenGuide } from '../components/ScreenGuide';
import { Search, SlidersHorizontal, ArrowRight, ClipboardCheck } from 'lucide-react';

export const InventoryReview: React.FC = () => {
  const { currentAudit, setTab } = useAuditStore();
  const items = currentAudit.items;

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [selectedAuditRequired, setSelectedAuditRequired] = useState('ALL'); // 'ALL' | 'YES' | 'NO'

  // Sorting State
  const [sortKey, setSortKey] = useState<keyof StockItem | null>('itemCode');
  const [sortAsc, setSortAsc] = useState(true);

  // Derived filter options
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

  // Handle Sort Toggle
  const handleSort = (key: keyof StockItem) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // Filtered & Sorted items
  const processedItems = useMemo(() => {
    let result = [...items];

    // Global Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        item => 
          item.itemCode.toLowerCase().includes(q) || 
          item.itemName.toLowerCase().includes(q)
      );
    }

    // Category Filter
    if (selectedCategory !== 'ALL') {
      result = result.filter(item => item.category === selectedCategory);
    }

    // Location Filter
    if (selectedLocation !== 'ALL') {
      result = result.filter(item => item.location === selectedLocation);
    }

    // Audit Required Filter
    if (selectedAuditRequired !== 'ALL') {
      const isReq = selectedAuditRequired === 'YES';
      result = result.filter(item => item.auditRequired === isReq);
    }

    // Sorting
    if (sortKey) {
      result.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [items, searchQuery, selectedCategory, selectedLocation, selectedAuditRequired, sortKey, sortAsc]);

  // Total Valuations
  const populationStats = useMemo(() => {
    let totalBookVal = 0;
    items.forEach(i => totalBookVal += i.bookValue);
    return {
      totalBookValue: totalBookVal
    };
  }, [items]);

  const columns = [
    { header: 'S.No', accessorKey: 'sNo' as keyof StockItem, className: 'w-16' },
    { header: 'Item Code', accessorKey: 'itemCode' as keyof StockItem, sortableKey: 'itemCode' as keyof StockItem, className: 'w-36 font-semibold text-teal-400' },
    { header: 'Item Name', accessorKey: 'itemName' as keyof StockItem, sortableKey: 'itemName' as keyof StockItem },
    { header: 'Category', accessorKey: 'category' as keyof StockItem, sortableKey: 'category' as keyof StockItem, className: 'w-40' },
    { header: 'Location', accessorKey: 'location' as keyof StockItem, sortableKey: 'location' as keyof StockItem, className: 'w-36' },
    { 
      header: 'Book Qty', 
      accessorKey: (row: StockItem) => `${row.bookQuantity} ${row.uom}`, 
      sortableKey: 'bookQuantity' as keyof StockItem,
      className: 'w-28 text-right' 
    },
    { 
      header: 'Rate (₹)', 
      accessorKey: (row: StockItem) => row.rate.toFixed(2), 
      sortableKey: 'rate' as keyof StockItem,
      className: 'w-24 text-right' 
    },
    { 
      header: 'Value (₹)', 
      accessorKey: (row: StockItem) => row.bookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
      sortableKey: 'bookValue' as keyof StockItem,
      className: 'w-36 text-right' 
    },
    {
      header: 'Audit Req.',
      accessorKey: (row: StockItem) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
          row.auditRequired 
            ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' 
            : 'bg-slate-700/30 text-slate-500 border-slate-700/40'
        }`}>
          {row.auditRequired ? 'Yes' : 'No'}
        </span>
      ),
      className: 'w-28 text-center'
    }
  ];

  const guideSteps = [
    "Review the full list of imported items before selecting the audit sample.",
    "Type an item code or description in the search bar to locate specific records.",
    "Filter by Category, Location, or Audit Requirement badges using the top selectors.",
    "Click the column header text to sort the list (e.g. sort alphabetically or by Book Value).",
    "Once finished reviewing, click 'Setup Audit Sample Selection' to proceed."
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-140px)] space-y-4 animate-fade-in">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-slate-800 p-4 border border-slate-700/60 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Full Inventory Population</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {items.length.toLocaleString()} items imported • Total Value: {populationStats.totalBookValue.toLocaleString(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <button
          onClick={() => setTab('select')}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-teal-500/15 shrink-0"
        >
          Setup Audit Sample Selection
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <ScreenGuide title="Inventory Population Review" steps={guideSteps} guideKey="population_review" />

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0 bg-slate-800/40 border border-slate-800/80 p-3 rounded-xl">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search item code or name..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-600"
          />
        </div>

        {/* Category Filter */}
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

        {/* Location Filter */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-transparent text-xs text-slate-300 w-full focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Locations ({locations.length - 1})</option>
            {locations.filter(l => l !== 'ALL').map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Audit Req. Filter */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={selectedAuditRequired}
            onChange={(e) => setSelectedAuditRequired(e.target.value)}
            className="bg-transparent text-xs text-slate-300 w-full focus:outline-none cursor-pointer"
          >
            <option value="ALL">Audit Req: All</option>
            <option value="YES">Audit Required: Yes</option>
            <option value="NO">Audit Required: No</option>
          </select>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 min-h-0 bg-slate-900/40 rounded-lg">
        <VirtualTable
          data={processedItems}
          columns={columns}
          sortKey={sortKey}
          sortAsc={sortAsc}
          onSort={handleSort}
        />
      </div>

      {/* Record Counter */}
      <div className="flex justify-between items-center text-xs text-slate-400 shrink-0 px-1.5">
        <span>Showing {processedItems.length.toLocaleString()} of {items.length.toLocaleString()} items</span>
        <span>Scroll vertically to browse virtualized rows</span>
      </div>
    </div>
  );
};
