# StockVerify - Offline Stock Audit Tool

StockVerify is a professional, fully offline web application designed for Chartered Accountants, Internal Auditors, Bank Stock Auditors, and Audit Firms to perform physical stock verification against ERP inventory data (such as Tally, SAP, Busy, Marg, Zoho Books, etc.).

It runs **100% locally in the browser**, ensuring maximum confidentiality of client data. No server, no backend, no telemetry, and no internet dependencies.

## Key Features

* **📥 Spreadsheets & Mapping**: Upload any ERP inventory workbook. Standard columns are parsed and mapped dynamically with real-time error/warning checkers.
* **📋 Spreadsheet Templates**: Download a pre-structured Excel import template directly from the upload screen to align data layouts instantly.
* **🎲 Advanced Audit Sampling**: Configure audit selections based on three methods:
  1. **Total Number of Items**: Seed-based deterministic random selection.
  2. **Total Stock Value**: Cumulative coverage scoping (selects high-value items first until a target percentage of the total stock valuation is reached).
  3. **Total Quantity**: Cumulative quantity coverage (selects items descending by quantity).
* **🏢 Multi-Location & Duplicate Code Support**: Items with identical codes at different locations (e.g., freezer, kitchen, bin location, batch) are treated as distinct logs. Toggles and verification forms target unique records safely.
* **✏️ Interactive Multi-Count Ledger**: Record multiple physical count entries for the same item. Each log is tagged with the exact entry timestamp, tags (e.g. *Damaged*, *Obsolete*, *Slow-moving*), and custom notes.
* **➕ Unrecorded Stock Logs**: Easily add unrecorded items found physically on-site that are missing in the ERP system. Automatically computes excess variances.
* **💾 Dual-Sheet Reports Export**: Generates a unified report workbook in `.xlsx` format containing two sheets:
  1. **Detailed Count Logs**: Individual entries with separate timestamps and notes (e.g., 3 separate lines for 3 counts).
  2. **Consolidated Summary**: A single row per item with aggregated quantities, variance quantities, rates, variance values, and merged observations.
* **🎨 Premium Aesthetics**: Tailored user experience featuring a warm parchment cream palette (`#F6F1E3`), charcoal typography (`#1F2933`), and gold-bronze details (`#8B5E34`) mapped dynamically using Tailwind CSS.
* **🔄 Reusable Step Guides & Stepper**: Features collapsible step guides on each screen and a workspace progress stepper to anchor auditing workflows.

---

## Technical Stack

* **Core**: React 18+ with TypeScript
* **State Management**: Zustand
* **Local Storage**: IndexedDB (using lightweight asynchronous helper transactions for large datasets)
* **Spreadsheets**: SheetJS (XLSX parsing and writing)
* **Styling**: Tailwind CSS
* **Icons**: Lucide Icons
* **Virtualization**: TanStack Virtual (for scrolling thousands of items with 60FPS fluid rendering)

---

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone or download the repository to your local machine:
   ```bash
   cd "stockaudit tool"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server locally:
   ```bash
   npm run dev
   ```

4. Build for production distribution:
   ```bash
   npm run build
   ```

---

## Workflow Steps

1. **Initialize Session**: Click **New Audit** on the dashboard and enter client details (client name, auditor, unit/branch, date).
2. **Import Excel**: Download the empty template sheet, copy/paste your ERP inventory rows, and upload. Correct mapping columns if necessary.
3. **Review Population**: Browse the raw book values and list items.
4. **Sample Selection**: Configure your target sample (by item count, valuation threshold, or quantity) or select specific rows manually.
5. **Physical Count**: Count stock physically. Open verification cards to log multiple count quantities, select observation tags (e.g., *Damaged*), and click save.
6. **Variance Summary**: Review discrepancy metrics, shortages, and excesses.
7. **Export Report**: Generate the audit report with detailed logs and consolidated summaries and download.

---

## Privacy & Security

All inventory data, audit counts, observations, and sessions are saved locally on your device in the browser's sandbox environment using **IndexedDB**. Absolutely no data is uploaded to external clouds or servers.
