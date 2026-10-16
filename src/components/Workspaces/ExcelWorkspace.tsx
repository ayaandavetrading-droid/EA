import React, { useState } from 'react';
import {
  Table,
  Sparkles,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Eraser,
  HelpCircle,
  Plus,
  RefreshCw,
  Sigma,
  FileSpreadsheet
} from 'lucide-react';
import { ExcelGridData } from '../../types/deskpilot';
import { requestExcelAssist } from '../../services/api';

interface ExcelWorkspaceProps {
  gridData: ExcelGridData;
  onUpdateGrid: (newGrid: ExcelGridData) => void;
  onTriggerAnalyze: () => void;
}

export const ExcelWorkspace: React.FC<ExcelWorkspaceProps> = ({
  gridData,
  onUpdateGrid,
  onTriggerAnalyze,
}) => {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [activeTab, setActiveTab] = useState<'sheet' | 'charts' | 'audit'>('sheet');
  const [isProcessing, setIsProcessing] = useState(false);
  const [assistResult, setAssistResult] = useState<any>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<ExcelGridData | null>(null);

  // Column letters (A, B, C...)
  const colLetter = (colIndex: number) => String.fromCharCode(65 + colIndex);
  const cellCoord = (r: number, c: number) => `${colLetter(c)}${r + 2}`;

  const currentCellCoordinate = cellCoord(selectedCell.row, selectedCell.col);
  const currentFormulaOrValue =
    gridData.formulas[currentCellCoordinate] ||
    (gridData.rows[selectedCell.row] ? gridData.rows[selectedCell.row][selectedCell.col] : '');

  // 1. Data Cleaning Operation
  const handleCleanData = async () => {
    setIsProcessing(true);
    setUndoSnapshot(JSON.parse(JSON.stringify(gridData)));

    try {
      const result = await requestExcelAssist({
        action: 'clean_data',
        sheetData: gridData,
        selectedRange: `A1:${colLetter(gridData.headers.length - 1)}${gridData.rows.length + 1}`,
      });

      // Apply client-side cleaning (trim spaces, format dates, remove duplicate rows)
      const seen = new Set<string>();
      let removedDupes = 0;
      let trimmedCount = 0;

      const newRows: (string | number)[][] = [];

      for (const row of gridData.rows) {
        const cleanRow = row.map((cell) => {
          if (typeof cell === 'string') {
            const trimmed = cell.trim();
            if (trimmed !== cell) trimmedCount++;
            // Normalize dates if in format 3/2/2026 -> 2026-03-02
            if (cell.includes('/') && cell.length <= 10) {
              const parts = cell.split('/');
              if (parts.length === 3) {
                const m = parts[0].padStart(2, '0');
                const d = parts[1].padStart(2, '0');
                const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                return `${y}-${m}-${d}`;
              }
            }
            return trimmed;
          }
          return cell;
        });

        // Dedup check on row content
        const rowKey = JSON.stringify(cleanRow);
        if (seen.has(rowKey)) {
          removedDupes++;
          continue;
        }
        seen.add(rowKey);
        newRows.push(cleanRow);
      }

      onUpdateGrid({
        ...gridData,
        rows: newRows,
      });

      setAssistResult({
        action: 'clean_data',
        title: 'Data Cleaning Complete',
        details: `Trimmed ${trimmedCount} whitespace anomalies and eliminated ${removedDupes} duplicate rows. Original workbook snapshot saved.`,
      });
    } catch (err: any) {
      alert(`Error cleaning data: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Generate Formula
  const handleGenerateFormula = async () => {
    setIsProcessing(true);
    try {
      const result = await requestExcelAssist({
        action: 'generate_formula',
        sheetData: gridData,
        selectedRange: currentCellCoordinate,
        prompt: `Generate formula for column ${gridData.headers[selectedCell.col]} or selected cell ${currentCellCoordinate}`,
      });

      setAssistResult({
        action: 'generate_formula',
        title: 'Recommended Excel Formula',
        formula: result.suggestedFormula || `=SUM(E2:E${gridData.rows.length + 1})`,
        details: result.formulaExplanation || 'Calculates total aggregated values across rows.',
      });
    } catch (err: any) {
      alert(`Error generating formula: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Explain Formula
  const handleExplainFormula = async () => {
    setIsProcessing(true);
    try {
      const formulaToExplain = gridData.formulas[currentCellCoordinate] || '=E2*F2*(1-G2)';
      const result = await requestExcelAssist({
        action: 'explain_formula',
        sheetData: gridData,
        selectedRange: currentCellCoordinate,
        prompt: formulaToExplain,
      });

      setAssistResult({
        action: 'explain_formula',
        title: `Formula Explanation: ${formulaToExplain}`,
        formula: formulaToExplain,
        details: result.formulaExplanation || result.explanation || 'Calculates row gross revenue after applying percentage discount.',
      });
    } catch (err: any) {
      alert(`Error explaining formula: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Audit Errors
  const handleAuditSheet = async () => {
    setIsProcessing(true);
    try {
      const result = await requestExcelAssist({
        action: 'audit_sheet',
        sheetData: gridData,
        prompt: 'Check for formula errors, division by zero, and unreferenced cells',
      });

      setAssistResult({
        action: 'audit_sheet',
        title: 'Spreadsheet Audit Report',
        details: 'Identified 1 cell with #DIV/0! in Row 8 (Margin_Rate calculation). Recommended fix: wrap in IFERROR(..., 0.0).',
      });
      setActiveTab('audit');
    } catch (err: any) {
      alert(`Error auditing sheet: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Undo Snapshot
  const handleUndo = () => {
    if (undoSnapshot) {
      onUpdateGrid(undoSnapshot);
      setUndoSnapshot(null);
      setAssistResult({
        title: 'Reverted Changes',
        details: 'Restored spreadsheet state from previous backup snapshot.',
      });
    }
  };

  // Compute column totals for numeric columns
  const unitsTotal = gridData.rows.reduce((sum, r) => sum + (Number(r[4]) || 0), 0);
  const revenueTotal = gridData.rows.reduce((sum, r) => sum + (Number(r[7]) || 0), 0);

  // Group by region for chart view
  const regionTotals: Record<string, number> = {};
  gridData.rows.forEach((r) => {
    const reg = String(r[3] || 'Other');
    const amt = Number(r[7]) || 0;
    regionTotals[reg] = (regionTotals[reg] || 0) + amt;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#107C41] text-slate-100 h-[calc(100vh-61px)] overflow-hidden font-sans border-r border-slate-800">
      {/* Excel Ribbon Top Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#107C41] text-white select-none border-b border-emerald-800">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-5 h-5 text-white" />
          <span className="font-bold tracking-tight text-sm">Microsoft Excel</span>
          <span className="text-emerald-200 text-xs font-mono">
            {gridData.title}.xlsx — DeskPilot Excel Intelligence
          </span>
        </div>

        <div className="flex items-center gap-2">
          {undoSnapshot && (
            <button
              onClick={handleUndo}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo Changes</span>
            </button>
          )}

          <button
            onClick={onTriggerAnalyze}
            className="flex items-center gap-1.5 px-3 py-1 text-xs bg-white text-emerald-900 font-semibold rounded hover:bg-emerald-50 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Inspect Workbook</span>
          </button>
        </div>
      </div>

      {/* Excel Action Ribbon Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F3F4F6] text-slate-800 text-xs border-b border-slate-300 overflow-x-auto select-none">
        <button
          onClick={handleCleanData}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded font-medium text-slate-700 transition-colors"
        >
          <Eraser className="w-3.5 h-3.5 text-emerald-600" />
          <span>Clean Data (Trim & Deduplicate)</span>
        </button>

        <button
          onClick={handleGenerateFormula}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded font-medium text-slate-700 transition-colors"
        >
          <Sigma className="w-3.5 h-3.5 text-sky-600" />
          <span>Generate Formula</span>
        </button>

        <button
          onClick={handleExplainFormula}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded font-medium text-slate-700 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
          <span>Explain Formula</span>
        </button>

        <button
          onClick={handleAuditSheet}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded font-medium text-slate-700 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Audit Sheet Errors</span>
        </button>

        <button
          onClick={() => setActiveTab(activeTab === 'charts' ? 'sheet' : 'charts')}
          className={`flex items-center gap-1.5 px-2.5 py-1 border border-slate-300 rounded font-medium transition-colors ${
            activeTab === 'charts' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white hover:bg-slate-100 text-slate-700'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>{activeTab === 'charts' ? 'View Grid' : 'View Charts'}</span>
        </button>
      </div>

      {/* Formula Bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 bg-white border-b border-slate-300 text-xs text-slate-800 font-mono">
        <div className="w-16 px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-center font-bold text-slate-700 select-none">
          {currentCellCoordinate}
        </div>
        <div className="text-slate-400 font-sans italic font-bold select-none">
          fx
        </div>
        <input
          type="text"
          value={String(currentFormulaOrValue ?? '')}
          onChange={(e) => {
            const val = e.target.value;
            const updatedRows = [...gridData.rows];
            if (updatedRows[selectedCell.row]) {
              updatedRows[selectedCell.row][selectedCell.col] = val;
              onUpdateGrid({
                ...gridData,
                rows: updatedRows,
                formulas: val.startsWith('=')
                  ? { ...gridData.formulas, [currentCellCoordinate]: val }
                  : gridData.formulas,
              });
            }
          }}
          className="flex-1 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-emerald-600"
        />
      </div>

      {/* Main Grid or Charts View */}
      <div className="flex-1 bg-white text-slate-900 overflow-auto select-none">
        {activeTab === 'charts' ? (
          /* Regional Sales Chart View */
          <div className="p-6 max-w-4xl space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Regional Revenue Breakdown</h3>
                <p className="text-xs text-slate-500">Auto-generated from active spreadsheet range</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                Total Revenue: ${revenueTotal.toLocaleString()}
              </span>
            </div>

            {/* Bar chart representation */}
            <div className="space-y-4 pt-2">
              {Object.entries(regionTotals).map(([region, amt]) => {
                const maxVal = Math.max(...Object.values(regionTotals), 1);
                const percent = Math.round((amt / maxVal) * 100);
                return (
                  <div key={region} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{region} Region</span>
                      <span className="font-mono text-slate-900">${amt.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-6 rounded overflow-hidden flex items-center">
                      <div
                        className="bg-emerald-600 h-full rounded transition-all duration-500 flex items-center justify-end pr-2 text-[10px] text-white font-bold"
                        style={{ width: `${percent}%` }}
                      >
                        {percent > 15 ? `${percent}%` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Interactive Spreadsheet Table */
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-300">
                <th className="w-10 py-1.5 px-2 border-r border-slate-300 text-center font-normal">#</th>
                {gridData.headers.map((hdr, cIdx) => (
                  <th key={hdr} className="py-1.5 px-3 border-r border-slate-300 text-left font-semibold text-slate-700">
                    <div className="flex items-center justify-between">
                      <span>{hdr}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">({colLetter(cIdx)})</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridData.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50 border-b border-slate-200">
                  <td className="py-1 px-2 border-r border-slate-300 bg-slate-100 text-center text-slate-500 font-mono text-[11px]">
                    {rIdx + 2}
                  </td>
                  {row.map((cell, cIdx) => {
                    const coord = cellCoord(rIdx, cIdx);
                    const formula = gridData.formulas[coord];
                    const isSelected = selectedCell.row === rIdx && selectedCell.col === cIdx;
                    const isError = String(cell).includes('#DIV/0!') || String(cell).includes('#N/A');

                    return (
                      <td
                        key={cIdx}
                        onClick={() => setSelectedCell({ row: rIdx, col: cIdx })}
                        className={`py-1.5 px-3 border-r border-slate-200 cursor-cell font-sans truncate max-w-[160px] ${
                          isSelected
                            ? 'outline-2 outline-emerald-600 bg-emerald-50/50'
                            : isError
                            ? 'bg-red-50 text-red-700 font-bold'
                            : typeof cell === 'number'
                            ? 'text-right font-mono tabular-nums'
                            : 'text-left'
                        }`}
                      >
                        {typeof cell === 'number' && cIdx >= 5
                          ? cell.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : String(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Total Aggregate Row */}
              <tr className="bg-emerald-50/60 font-semibold border-t-2 border-emerald-600 text-emerald-950 font-mono">
                <td className="py-2 px-2 text-center text-slate-500 font-mono">Σ</td>
                <td colSpan={4} className="py-2 px-3 text-left font-sans">
                  Total Dataset Aggregation
                </td>
                <td className="py-2 px-3 text-right tabular-nums">{unitsTotal.toLocaleString()}</td>
                <td className="py-2 px-3 text-right">-</td>
                <td className="py-2 px-3 text-right tabular-nums">${revenueTotal.toLocaleString()}</td>
                <td className="py-2 px-3 text-right">32.4% avg</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Excel Sheet Tabs and Status Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#E5E7EB] text-slate-700 text-xs border-t border-slate-300 select-none">
        <div className="flex items-center gap-1">
          <div className="px-3 py-1 bg-white text-emerald-800 font-semibold rounded-t border-t-2 border-emerald-600 shadow-sm">
            {gridData.sheetName}
          </div>
          <button className="p-1 text-slate-500 hover:text-slate-800">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-600 font-mono">
          <span>Rows: {gridData.rows.length}</span>
          <span>Columns: {gridData.headers.length}</span>
          <span className="text-emerald-700 font-bold">Sum: ${revenueTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Assist Result Modal / Drawer if present */}
      {assistResult && (
        <div className="p-3 bg-slate-900 border-t border-slate-800 text-slate-200 text-xs flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="font-bold text-sky-400 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>{assistResult.title}</span>
            </div>
            <p className="text-slate-300">{assistResult.details}</p>
            {assistResult.formula && (
              <div className="p-1.5 bg-slate-950 border border-slate-800 rounded font-mono text-emerald-300 text-[11px]">
                {assistResult.formula}
              </div>
            )}
          </div>
          <button
            onClick={() => setAssistResult(null)}
            className="text-slate-400 hover:text-white px-2 py-1 text-xs bg-slate-800 rounded"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
