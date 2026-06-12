import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { StockItem } from '../types';
import { ArrowUpDown, ArrowUp, ArrowDown, CheckSquare, Square, Info } from 'lucide-react';

interface ColumnDef<T> {
  header: string;
  accessorKey: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  sortableKey?: keyof T;
}

interface VirtualTableProps {
  data: StockItem[];
  columns: ColumnDef<StockItem>[];
  onRowClick?: (item: StockItem) => void;
  // Selection
  selectedItemIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: (isSelected: boolean) => void;
  // Sorting
  sortKey: keyof StockItem | null;
  sortAsc: boolean;
  onSort: (key: keyof StockItem) => void;
}

export const VirtualTable: React.FC<VirtualTableProps> = ({
  data,
  columns,
  onRowClick,
  selectedItemIds,
  onToggleSelect,
  onToggleSelectAll,
  sortKey,
  sortAsc,
  onSort,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Resize listener to toggle mobile card vs desktop table row
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // The virtualizer needs to know the total length of the data list
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (isMobile ? 140 : 48), // taller height for mobile cards
    overscan: 10,
  });

  const isAllSelected = useMemo(() => {
    if (data.length === 0 || !selectedItemIds) return false;
    return data.every(item => selectedItemIds.has(item.id));
  }, [data, selectedItemIds]);

  const handleSelectAllToggle = () => {
    if (onToggleSelectAll) {
      onToggleSelectAll(!isAllSelected);
    }
  };

  if (isMobile) {
    // Render Mobile Cards layout (optimized for small screen viewing and tapping)
    return (
      <div className="flex flex-col h-full bg-slate-950 gap-3">
        {onToggleSelect && (
          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-850 shrink-0 text-xs text-slate-300 font-semibold select-none">
            <span>Select / Verify Target Count</span>
            <button
              onClick={handleSelectAllToggle}
              className="flex items-center gap-1.5 bg-slate-900 border border-slate-750 px-2.5 py-1.5 rounded-md hover:text-white"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare className="w-4 h-4 text-teal-500" />
                  Deselect All
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  Select All
                </>
              )}
            </button>
          </div>
        )}

        <div
          ref={parentRef}
          className="flex-1 overflow-y-auto bg-slate-950 space-y-3 pr-1"
        >
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
              <Info className="w-8 h-8 opacity-60" />
              <p className="text-sm">No inventory matches current filters.</p>
            </div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const item = data[virtualRow.index];
                const isSelected = selectedItemIds?.has(item.id) || false;

                return (
                  <div
                    key={virtualRow.key}
                    onClick={() => onRowClick?.(item)}
                    className={`absolute left-0 w-full flex flex-col p-4 rounded-xl border transition-all cursor-pointer select-none bg-slate-900/90 ${
                      isSelected 
                        ? 'border-teal-500/50 shadow-md shadow-teal-500/5 bg-slate-900' 
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                    style={{
                      height: `${virtualRow.size - 12}px`, // leave a gap between virtualized items
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {/* Card Header: Checkbox + Item Code & Name */}
                    <div className="flex items-start gap-3">
                      {onToggleSelect && (
                        <div
                          className="pt-0.5 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelect(item.id);
                          }}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-teal-500" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-teal-400 truncate block">{item.itemCode}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Row {item.sNo}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-200 mt-1 truncate block">{item.itemName}</h4>
                      </div>
                    </div>

                    {/* Metadata Specs (Location, Book Qty, Value) */}
                    <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] text-slate-400 border-t border-slate-850 pt-2.5">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Location</span>
                        <span className="truncate block text-slate-300 mt-0.5 font-medium">{item.location || 'N/A'}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Book Stock</span>
                        <span className="font-semibold text-slate-300 mt-0.5 block">{item.bookQuantity} {item.uom}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Book Value</span>
                        <span className="font-medium text-slate-300 mt-0.5 block">₹{item.bookValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>

                    {/* Verification Status Banner (for verification list only) */}
                    {(item.physicalQuantity !== null || item.remarks || item.tags.length > 0) && (
                      <div className="mt-3 flex items-center justify-between gap-2 text-[10px] bg-slate-950/65 p-2 rounded-lg border border-slate-850">
                        <div className="flex items-center gap-1.5 text-slate-350">
                          <span className="font-bold">Count:</span>
                          <span className="font-semibold text-white">{item.physicalQuantity} {item.uom}</span>
                          {item.differenceQuantity !== null && (
                            <span className={`font-extrabold ${item.differenceQuantity < 0 ? 'text-red-400' : item.differenceQuantity > 0 ? 'text-emerald-400' : 'text-slate-550'}`}>
                              ({item.differenceQuantity > 0 ? `+${item.differenceQuantity}` : item.differenceQuantity})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {item.tags.slice(0, 1).map(t => (
                            <span key={t} className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${t === 'Shortage' || t === 'Damaged' ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Desktop Table (Default View)
  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      <div className="flex-1 flex flex-col overflow-x-auto">
        <div className="min-w-[950px] lg:min-w-0 flex-1 flex flex-col">
          {/* Table Headers */}
          <div className="bg-slate-800 border-b border-slate-700 select-none shrink-0">
            <table className="w-full table-fixed text-left">
              <thead>
                <tr className="flex items-center text-xs font-semibold text-slate-300 py-3 px-4">
                  {onToggleSelect && (
                    <th className="w-12 flex items-center justify-center">
                      <button
                        onClick={handleSelectAllToggle}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Select All"
                      >
                        {isAllSelected ? (
                          <CheckSquare className="w-5 h-5 text-teal-500 fill-teal-500/10" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </th>
                  )}
                  {columns.map((col, index) => {
                    const isSortable = !!col.sortableKey;
                    const isSorted = col.sortableKey === sortKey;

                    return (
                      <th
                        key={index}
                        className={`flex-1 flex items-center gap-1.5 px-2 ${col.className || ''}`}
                      >
                        {isSortable ? (
                          <button
                            onClick={() => onSort(col.sortableKey!)}
                            className="flex items-center gap-1 hover:text-white transition-colors uppercase tracking-wider"
                          >
                            {col.header}
                            {isSorted ? (
                              sortAsc ? (
                                <ArrowUp className="w-3.5 h-3.5 text-teal-450" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-teal-450" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                            )}
                          </button>
                        ) : (
                          <span className="uppercase tracking-wider">{col.header}</span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
            </table>
          </div>

          {/* Table Body (Virtualized Container) */}
          <div
            ref={parentRef}
            className="flex-1 overflow-y-auto bg-slate-900/50"
            style={{ contentVisibility: 'auto' }}
          >
            {data.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-2">
                <Info className="w-8 h-8 opacity-60" />
                <p className="text-sm">No inventory records match the current filters.</p>
              </div>
            ) : (
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const item = data[virtualRow.index];
                  const isSelected = selectedItemIds?.has(item.id) || false;

                  return (
                    <div
                      key={virtualRow.key}
                      onClick={() => onRowClick?.(item)}
                      className={`absolute top-0 left-0 w-full flex items-center border-b border-slate-800/80 text-sm py-2 px-4 hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isSelected ? 'bg-teal-950/15' : ''
                      }`}
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {onToggleSelect && (
                        <div
                          className="w-12 flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelect(item.id);
                          }}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-teal-500 fill-teal-500/10" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-650 hover:text-slate-400" />
                          )}
                        </div>
                      )}
                      {columns.map((col, cIdx) => {
                        const content =
                          typeof col.accessorKey === 'function'
                            ? col.accessorKey(item)
                            : (item[col.accessorKey as keyof StockItem] as React.ReactNode);

                        return (
                          <div
                            key={cIdx}
                            className={`flex-1 truncate px-2 text-slate-355 ${col.className || ''}`}
                          >
                            {content}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
