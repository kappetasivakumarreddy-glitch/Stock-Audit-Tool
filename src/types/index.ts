export interface AuditSessionMetadata {
  id: string;
  clientName: string;
  auditName: string;
  auditDate: string;
  branchUnit: string;
  auditorName: string;
  randomSeed: string;
  samplePercentage: number;
  sampleLocked: boolean;
  createdAt: number;
  updatedAt: number;
  samplingMethod?: 'items' | 'value' | 'quantity';
}

export interface CountEntry {
  id: string;
  quantity: number;
  timestamp: number;
  remarks: string;
  tags: string[];
}

export interface StockItem {
  id: string;
  sNo: string;
  itemCode: string;
  itemName: string;
  category: string;
  uom: string;
  location: string;
  binLocation: string;
  batchNo: string;
  bookQuantity: number;
  rate: number;
  bookValue: number;
  auditRequired: boolean; // 'Y' or 'N' initially
  isSelected: boolean;    // Chosen for physical audit
  physicalQuantity: number | null; // null represents pending
  differenceQuantity: number | null; // physicalQuantity - bookQuantity
  tags: string[];         // e.g. ["Shortage", "Damaged"]
  remarks: string;
  countEntries?: CountEntry[]; // Multiple count entries
}

export interface AuditSession {
  metadata: AuditSessionMetadata;
  items: StockItem[];
}

export interface ValidationError {
  row: number; // 1-based index (Excel row number)
  column: string;
  value: string;
  message: string;
  severity: 'error' | 'warning';
}

export type ObservationTag = 
  | 'Shortage'
  | 'Excess'
  | 'Damaged'
  | 'Obsolete'
  | 'Slow Moving'
  | 'Good Condition'
  | 'Recount Required';

export const QUICK_TAGS: ObservationTag[] = [
  'Shortage',
  'Excess',
  'Damaged',
  'Obsolete',
  'Slow Moving',
  'Good Condition',
  'Recount Required',
];
