import * as XLSX from 'xlsx';
import type { StockItem } from '../types';
import { MANDATORY_COLUMNS } from '../validators/validators';

export const excelService = {
  /**
   * Reads an Excel file and returns JSON rows.
   */
  async parseExcelFile(file: File): Promise<{
    rows: any[];
    headers: string[];
    error?: string;
  }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          
          if (!firstSheetName) {
            resolve({ rows: [], headers: [], error: 'Workbook is empty (no sheets found).' });
            return;
          }

          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          
          // Get headers to validate columns
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
          const headers: string[] = [];
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
            if (cell && cell.v !== undefined) {
              headers.push(String(cell.v).trim());
            }
          }

          // Validate headers contain mandatory columns
          const missingCols = MANDATORY_COLUMNS.filter(col => !headers.includes(col));
          if (missingCols.length > 0) {
            resolve({
              rows: [],
              headers,
              error: `Missing mandatory columns: ${missingCols.join(', ')}. Please verify that your sheet headers match exactly.`
            });
            return;
          }

          resolve({ rows: rawRows, headers });
        } catch (err) {
          resolve({ rows: [], headers: [], error: 'Failed to read file. The file might be corrupt or in an unsupported format.' });
        }
      };

      reader.onerror = () => {
        resolve({ rows: [], headers: [], error: 'FileReader encountered an error reading the file.' });
      };

      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Exports audited stock items to a new Excel spreadsheet.
   */
  exportAuditExcel(items: StockItem[], clientName: string, auditName: string) {
    // 1. Construct Detailed Logs (Sheet 1)
    const detailedRows: any[] = [];
    items.forEach(item => {
      const counts = item.countEntries || [];
      if (counts.length === 0) {
        // Output a single row for items without specific count logs
        detailedRows.push({
          'S.No': item.sNo,
          'Item Code': item.itemCode,
          'Item Name': item.itemName,
          'Category': item.category,
          'UOM': item.uom,
          'Location': item.location,
          'Bin Location': item.binLocation,
          'Batch No': item.batchNo,
          'Book Quantity': item.bookQuantity,
          'Rate': item.rate,
          'Book Value': item.bookValue,
          'Audit Required': item.auditRequired ? 'Y' : 'N',
          'Audit Selection': item.isSelected ? 'Selected' : 'Not Selected',
          'Count Entry Qty': '',
          'Entry Timestamp': 'No counts recorded',
          'Entry Observations': '',
          'Entry Remarks': '',
        });
      } else {
        // Output a separate row for each recorded sub-count entry
        counts.forEach((entry, idx) => {
          detailedRows.push({
            'S.No': `${item.sNo}.${idx + 1}`,
            'Item Code': item.itemCode,
            'Item Name': item.itemName,
            'Category': item.category,
            'UOM': item.uom,
            'Location': item.location,
            'Bin Location': item.binLocation,
            'Batch No': item.batchNo,
            'Book Quantity': item.bookQuantity,
            'Rate': item.rate,
            'Book Value': item.bookValue,
            'Audit Required': item.auditRequired ? 'Y' : 'N',
            'Audit Selection': item.isSelected ? 'Selected' : 'Not Selected',
            'Count Entry Qty': entry.quantity,
            'Entry Timestamp': new Date(entry.timestamp).toLocaleString(),
            'Entry Observations': entry.tags.join(', '),
            'Entry Remarks': entry.remarks,
          });
        });
      }
    });

    // 2. Construct Consolidated Summary (Sheet 2)
    const consolidatedRows = items.map(item => ({
      'S.No': item.sNo,
      'Item Code': item.itemCode,
      'Item Name': item.itemName,
      'Category': item.category,
      'UOM': item.uom,
      'Location': item.location,
      'Bin Location': item.binLocation,
      'Batch No': item.batchNo,
      'Book Quantity': item.bookQuantity,
      'Rate': item.rate,
      'Book Value': item.bookValue,
      'Audit Required': item.auditRequired ? 'Y' : 'N',
      'Audit Selection': item.isSelected ? 'Selected' : 'Not Selected',
      'Consolidated Physical Qty': item.physicalQuantity !== null ? item.physicalQuantity : '',
      'Variance Quantity': item.differenceQuantity !== null ? item.differenceQuantity : '',
      'Variance Value': item.differenceQuantity !== null ? item.differenceQuantity * item.rate : '',
      'Consolidated Observations': item.tags.join(', '),
      'Combined Remarks': item.remarks,
    }));

    const workbook = XLSX.utils.book_new();

    // Append Sheet 1
    const detailedWorksheet = XLSX.utils.json_to_sheet(detailedRows);
    XLSX.utils.book_append_sheet(workbook, detailedWorksheet, 'Detailed Count Logs');

    // Append Sheet 2
    const consolidatedWorksheet = XLSX.utils.json_to_sheet(consolidatedRows);
    XLSX.utils.book_append_sheet(workbook, consolidatedWorksheet, 'Consolidated Summary');

    // Generate filename e.g. ClientName_StockAudit_20260612.xlsx
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cleanClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanAuditName = auditName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${cleanClientName}_${cleanAuditName}_StockAudit_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  },

  /**
   * Generates and downloads a sample spreadsheet template for user input.
   */
  downloadTemplateExcel() {
    const templateData = [
      {
        'S.No': '1',
        'Item Code': 'ITM001',
        'Item Name': 'Premium Wheat Flour',
        'Category': 'Raw Materials',
        'UOM': 'KG',
        'Location': 'Main Warehouse',
        'Bin Location': 'A-12',
        'Batch No': 'BATCH-99',
        'Book Quantity': 500,
        'Rate': 45.00,
        'Book Value': 22500,
        'Audit Required': 'Y'
      },
      {
        'S.No': '2',
        'Item Code': 'ITM002',
        'Item Name': 'Frozen Green Peas',
        'Category': 'Frozen Foods',
        'UOM': 'BAG',
        'Location': 'Freezer Room 1',
        'Bin Location': 'FZ-04',
        'Batch No': 'BATCH-102',
        'Book Quantity': 120,
        'Rate': 180.00,
        'Book Value': 21600,
        'Audit Required': 'Y'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock_Inventory_Template');
    XLSX.writeFile(workbook, 'StockAudit_Import_Template.xlsx');
  }
};
