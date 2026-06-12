import { create } from 'zustand';
import type { AuditSessionMetadata, StockItem, CountEntry } from '../types';
import { indexedDbService } from '../services/indexedDb';
import { selectRandomSample } from '../utils/random';

interface AuditState {
  currentAudit: {
    metadata: AuditSessionMetadata | null;
    items: StockItem[];
  };
  sessions: AuditSessionMetadata[];
  loading: boolean;
  activeTab: 'dashboard' | 'new-audit' | 'import' | 'review' | 'select' | 'verify' | 'summary' | 'export';
  
  // Navigation
  setTab: (tab: AuditState['activeTab']) => void;

  // Session Management
  loadSavedSessions: () => Promise<void>;
  createAudit: (metadata: {
    clientName: string;
    auditName: string;
    auditDate: string;
    branchUnit: string;
    auditorName: string;
  }) => Promise<void>;
  importInventory: (items: StockItem[]) => Promise<void>;
  resumeSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  clearCurrentAudit: () => void;

  // Audit Selection
  toggleItemSelection: (id: string) => Promise<void>;
  setItemSelectionBatch: (ids: string[], isSelected: boolean) => Promise<void>;
  selectAllItems: (isSelected: boolean) => Promise<void>;
  
  // Random Sampling
  generateSample: (percentage: number, seed: string, method: 'items' | 'value' | 'quantity') => Promise<void>;
  lockSample: () => Promise<void>;
  regenerateSample: (seed: string) => Promise<void>;

  // Physical Verification
  updatePhysicalQty: (
    id: string, 
    countEntries: CountEntry[]
  ) => Promise<void>;
  addManualItem: (newItem: {
    itemCode: string;
    itemName: string;
    physicalQuantity: number;
    location: string;
    binLocation: string;
    batchNo: string;
    rate: number;
    uom: string;
    category: string;
    remarks: string;
    tags: string[];
  }) => Promise<void>;
}

// Helper to save current store state to DB
async function syncToDb(metadata: AuditSessionMetadata | null, items: StockItem[]) {
  if (metadata) {
    await indexedDbService.saveSession({ metadata, items });
  }
}

export const useAuditStore = create<AuditState>((set, get) => ({
  currentAudit: {
    metadata: null,
    items: [],
  },
  sessions: [],
  loading: false,
  activeTab: 'dashboard',

  setTab: (tab) => {
    set({ activeTab: tab });
    // Persist the active tab into the session metadata so it survives a refresh
    const { metadata, items } = get().currentAudit;
    if (metadata) {
      const updatedMetadata = { ...metadata, lastActiveTab: tab };
      set({ currentAudit: { metadata: updatedMetadata, items } });
      syncToDb(updatedMetadata, items);
    }
  },

  loadSavedSessions: async () => {
    set({ loading: true });
    try {
      const sessions = await indexedDbService.getAllSessions();
      set({ sessions });
    } catch (err) {
      console.error('Failed to load saved sessions', err);
    } finally {
      set({ loading: false });
    }
  },

  createAudit: async (formMeta) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    const newMetadata: AuditSessionMetadata = {
      id,
      ...formMeta,
      randomSeed: '',
      samplePercentage: 0,
      sampleLocked: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set({
      currentAudit: {
        metadata: newMetadata,
        items: [],
      },
      activeTab: 'import',
    });

    await syncToDb(newMetadata, []);
    await get().loadSavedSessions();
  },

  importInventory: async (items) => {
    const { metadata } = get().currentAudit;
    if (!metadata) return;

    set({
      currentAudit: {
        metadata,
        items,
      },
      activeTab: 'review',
    });

    await syncToDb(metadata, items);
  },

  resumeSession: async (id) => {
    set({ loading: true });
    try {
      const session = await indexedDbService.getSession(id);
      if (session) {
        const restoredTab = (session.metadata.lastActiveTab as AuditState['activeTab']) || 'dashboard';
        set({
          currentAudit: session,
          activeTab: restoredTab,
        });
      }
    } catch (err) {
      console.error('Failed to resume session', err);
    } finally {
      set({ loading: false });
    }
  },

  deleteSession: async (id) => {
    await indexedDbService.deleteSession(id);
    const { metadata } = get().currentAudit;
    if (metadata && metadata.id === id) {
      set({
        currentAudit: { metadata: null, items: [] },
      });
    }
    await get().loadSavedSessions();
  },

  clearCurrentAudit: () => {
    set({
      currentAudit: { metadata: null, items: [] },
      activeTab: 'dashboard',
    });
  },

  toggleItemSelection: async (id) => {
    const { metadata, items } = get().currentAudit;
    if (!metadata) return;

    const updatedItems = items.map((item) => {
      if (item.id === id) {
        return { ...item, isSelected: !item.isSelected };
      }
      return item;
    });

    set({
      currentAudit: {
        metadata,
        items: updatedItems,
      },
    });

    await syncToDb(metadata, updatedItems);
  },

  setItemSelectionBatch: async (ids, isSelected) => {
    const { metadata, items } = get().currentAudit;
    if (!metadata) return;

    const idsSet = new Set(ids);
    const updatedItems = items.map((item) => {
      if (idsSet.has(item.id)) {
        return { ...item, isSelected };
      }
      return item;
    });

    set({
      currentAudit: {
        metadata,
        items: updatedItems,
      },
    });

    await syncToDb(metadata, updatedItems);
  },

  selectAllItems: async (isSelected) => {
    const { metadata, items } = get().currentAudit;
    if (!metadata) return;

    const updatedItems = items.map((item) => ({
      ...item,
      isSelected,
    }));

    set({
      currentAudit: {
        metadata,
        items: updatedItems,
      },
    });

    await syncToDb(metadata, updatedItems);
  },

  generateSample: async (percentage, seed, method) => {
    const { metadata, items } = get().currentAudit;
    if (!metadata || metadata.sampleLocked) return;

    // Filter items eligible for audit
    const eligibleItems = items.filter((item) => item.auditRequired);
    let selectedIds = new Set<string>();

    if (method === 'items') {
      const sampleSize = Math.max(1, Math.round(eligibleItems.length * (percentage / 100)));
      const sampledEligible = selectRandomSample(eligibleItems, sampleSize, seed);
      selectedIds = new Set(sampledEligible.map((s) => s.id));
    } else if (method === 'value') {
      // Sort items by bookValue descending (focus on highest value items first)
      const sortedByValue = [...eligibleItems].sort((a, b) => b.bookValue - a.bookValue);
      const totalValue = eligibleItems.reduce((sum, item) => sum + item.bookValue, 0);
      const targetValue = totalValue * (percentage / 100);
      
      let currentCumulativeValue = 0;
      for (const item of sortedByValue) {
        selectedIds.add(item.id);
        currentCumulativeValue += item.bookValue;
        if (currentCumulativeValue >= targetValue) {
          break;
        }
      }
    } else if (method === 'quantity') {
      // Sort items by bookQuantity descending (focus on highest quantity items first)
      const sortedByQty = [...eligibleItems].sort((a, b) => b.bookQuantity - a.bookQuantity);
      const totalQty = eligibleItems.reduce((sum, item) => sum + item.bookQuantity, 0);
      const targetQty = totalQty * (percentage / 100);
      
      let currentCumulativeQty = 0;
      for (const item of sortedByQty) {
        selectedIds.add(item.id);
        currentCumulativeQty += item.bookQuantity;
        if (currentCumulativeQty >= targetQty) {
          break;
        }
      }
    }

    const updatedItems = items.map((item) => {
      if (!item.auditRequired) {
        return { ...item, isSelected: false };
      }
      return {
        ...item,
        isSelected: selectedIds.has(item.id),
      };
    });

    const updatedMetadata: AuditSessionMetadata = {
      ...metadata,
      samplePercentage: percentage,
      randomSeed: seed,
      samplingMethod: method,
    };

    set({
      currentAudit: {
        metadata: updatedMetadata,
        items: updatedItems,
      },
    });

    await syncToDb(updatedMetadata, updatedItems);
  },

  lockSample: async () => {
    const { metadata, items } = get().currentAudit;
    if (!metadata) return;

    const updatedMetadata: AuditSessionMetadata = {
      ...metadata,
      sampleLocked: true,
    };

    set({
      currentAudit: {
        metadata: updatedMetadata,
        items,
      },
    });

    await syncToDb(updatedMetadata, items);
  },

  regenerateSample: async (seed) => {
    const { metadata } = get().currentAudit;
    if (!metadata || metadata.sampleLocked) return;
    await get().generateSample(
      metadata.samplePercentage, 
      seed, 
      metadata.samplingMethod || 'items'
    );
  },

  updatePhysicalQty: async (id, countEntries) => {
    const { metadata, items } = get().currentAudit;
    if (!metadata) return;

    const updatedItems = items.map((item) => {
      if (item.id === id) {
        // If there are no count entries, it's considered pending (null)
        if (countEntries.length === 0) {
          return {
            ...item,
            physicalQuantity: null,
            differenceQuantity: null,
            tags: [],
            remarks: '',
            countEntries: [],
          };
        }

        const physicalQty = countEntries.reduce((sum, entry) => sum + entry.quantity, 0);
        const diff = physicalQty - item.bookQuantity;

        // Combine all tags from all sub-entries
        const combinedTagsSet = new Set<string>();
        countEntries.forEach(entry => entry.tags.forEach(t => combinedTagsSet.add(t)));

        // Auto-assign shortage/excess tags based on variance
        if (diff < 0) {
          combinedTagsSet.delete('Excess');
          combinedTagsSet.add('Shortage');
        } else if (diff > 0) {
          combinedTagsSet.delete('Shortage');
          combinedTagsSet.add('Excess');
        } else {
          combinedTagsSet.delete('Shortage');
          combinedTagsSet.delete('Excess');
          if (combinedTagsSet.size === 0) combinedTagsSet.add('Good Condition');
        }

        // Combine all remarks: e.g. "Freezer: 20 units; Kitchen: 40 units"
        const combinedRemarks = countEntries
          .map(entry => entry.remarks.trim())
          .filter(Boolean)
          .join('; ');

        return {
          ...item,
          physicalQuantity: physicalQty,
          differenceQuantity: diff,
          tags: Array.from(combinedTagsSet),
          remarks: combinedRemarks,
          countEntries,
        };
      }
      return item;
    });

    set({
      currentAudit: {
        metadata,
        items: updatedItems,
      },
    });

    await syncToDb(metadata, updatedItems);
  },

  addManualItem: async (newItem) => {
    const { metadata, items } = get().currentAudit;
    if (!metadata) return;

    const id = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const formattedItem: StockItem = {
      id,
      sNo: `M-${items.length + 1}`,
      itemCode: newItem.itemCode.trim(),
      itemName: newItem.itemName.trim(),
      category: newItem.category.trim() || 'Manual Entry',
      uom: newItem.uom.trim() || 'PCS',
      location: newItem.location.trim() || 'Floor',
      binLocation: newItem.binLocation.trim() || '',
      batchNo: newItem.batchNo.trim() || '',
      bookQuantity: 0,
      rate: newItem.rate || 0,
      bookValue: 0,
      auditRequired: true,
      isSelected: true,
      physicalQuantity: newItem.physicalQuantity,
      differenceQuantity: newItem.physicalQuantity,
      tags: newItem.tags.includes('Excess') ? newItem.tags : [...newItem.tags, 'Excess'],
      remarks: newItem.remarks.trim() || 'Manually added unrecorded physical stock found',
      countEntries: [
        {
          id: `count_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          quantity: newItem.physicalQuantity,
          timestamp: Date.now(),
          remarks: newItem.remarks.trim() || 'Initial manual count',
          tags: newItem.tags,
        }
      ]
    };

    const updatedItems = [...items, formattedItem];
    
    set({
      currentAudit: {
        metadata,
        items: updatedItems,
      }
    });

    await syncToDb(metadata, updatedItems);
  },
}));
