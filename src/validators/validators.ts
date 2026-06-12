import { z } from 'zod';
import type { ValidationError, StockItem } from '../types';

export const ExcelRowSchema = z.object({
  'S.No': z.any().optional().transform(val => val !== undefined && val !== null ? String(val).trim() : ''),
  'Item Code': z.string().min(1, 'Item Code cannot be blank'),
  'Item Name': z.string().min(1, 'Item Name cannot be blank'),
  'Category': z.any().optional().transform(val => val !== undefined && val !== null ? String(val).trim() : ''),
  'UOM': z.any().optional().transform(val => val !== undefined && val !== null ? String(val).trim() : ''),
  'Location': z.any().optional().transform(val => val !== undefined && val !== null ? String(val).trim() : ''),
  'Bin Location': z.any().optional().transform(val => val !== undefined && val !== null ? String(val).trim() : ''),
  'Batch No': z.any().optional().transform(val => val !== undefined && val !== null ? String(val).trim() : ''),
  'Book Quantity': z.union([z.number(), z.string()]).transform((val, ctx) => {
    const num = Number(val);
    if (isNaN(num)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Book Quantity must be a valid number, got "${val}"`,
      });
      return 0;
    }
    return num;
  }),
  'Rate': z.union([z.number(), z.string()]).transform((val, ctx) => {
    const num = Number(val);
    if (isNaN(num)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Rate must be a valid number, got "${val}"`,
      });
      return 0;
    }
    return num;
  }),
  'Book Value': z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === undefined || val === null) return null;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }),
  'Audit Required': z.any().optional().transform(val => {
    if (val === undefined || val === null) return true;
    const str = String(val).trim().toUpperCase();
    return str === 'N' || str === 'NO' || str === 'FALSE' ? false : true;
  }),
});

export const MANDATORY_COLUMNS = ['Item Code', 'Item Name', 'Book Quantity', 'Rate'];

/**
 * Validates a list of raw rows parsed from Excel, returning valid StockItems and a list of ValidationErrors.
 */
export function validateExcelData(rawRows: any[]): {
  items: StockItem[];
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];
  const items: StockItem[] = [];
  const itemCodesSet = new Set<string>();

  // If file has no records
  if (!rawRows || rawRows.length === 0) {
    errors.push({
      row: 1,
      column: 'File',
      value: '',
      message: 'The sheet has no rows or is corrupt.',
      severity: 'error',
    });
    return { items, errors };
  }

  // Row by row validation
  rawRows.forEach((row, idx) => {
    const excelRowNum = idx + 2; // 1-based index (accounting for header row in Excel)

    // Normalize keys (trim whitespace and match casing)
    const normalizedRow: any = {};
    Object.keys(row).forEach(k => {
      const trimmedKey = k.trim();
      normalizedRow[trimmedKey] = row[k];
    });

    // Parse with Zod
    const result = ExcelRowSchema.safeParse(normalizedRow);

    if (!result.success) {
      result.error.issues.forEach(issue => {
        const col = issue.path[0] ? String(issue.path[0]) : 'Row';
        errors.push({
          row: excelRowNum,
          column: col,
          value: String(normalizedRow[col] ?? ''),
          message: issue.message,
          severity: 'error',
        });
      });
    } else {
      const parsedData = result.data;
      const itemCode = parsedData['Item Code'].trim();

      // Check duplicates
      if (itemCodesSet.has(itemCode)) {
        errors.push({
          row: excelRowNum,
          column: 'Item Code',
          value: itemCode,
          message: `Duplicate Item Code: "${itemCode}" was found multiple times in the sheet.`,
          severity: 'warning', // Warning so we can import but flag it
        });
      } else {
        itemCodesSet.add(itemCode);
      }

      // Calculate value if not provided
      const bookValue = parsedData['Book Value'] !== null 
        ? parsedData['Book Value'] 
        : parsedData['Book Quantity'] * parsedData['Rate'];

      items.push({
        id: `row_${excelRowNum}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sNo: parsedData['S.No'] || String(items.length + 1),
        itemCode,
        itemName: parsedData['Item Name'],
        category: parsedData['Category'],
        uom: parsedData['UOM'],
        location: parsedData['Location'],
        binLocation: parsedData['Bin Location'],
        batchNo: parsedData['Batch No'],
        bookQuantity: parsedData['Book Quantity'],
        rate: parsedData['Rate'],
        bookValue,
        auditRequired: parsedData['Audit Required'],
        isSelected: false, // Default is not selected yet
        physicalQuantity: null,
        differenceQuantity: null,
        tags: [],
        remarks: '',
        countEntries: [],
      });
    }
  });

  return { items, errors };
}
