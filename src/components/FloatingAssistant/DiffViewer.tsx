import React from 'react';
import { StepDiff } from '../../types/deskpilot';

interface DiffViewerProps {
  diff: StepDiff | null;
  isLoading?: boolean;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diff, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-400 flex items-center justify-center gap-2">
        <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        <span>Generating minimal verifiable step diff...</span>
      </div>
    );
  }

  if (!diff) {
    return (
      <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-md text-xs text-slate-400 text-center">
        No pending diff. Select a task or advance stage to preview edits.
      </div>
    );
  }

  // Parse lines to display colorized diff
  const origLines = diff.originalContent ? diff.originalContent.split('\n') : [];
  const newLines = diff.newContent ? diff.newContent.split('\n') : [];

  return (
    <div className="space-y-2">
      {diff.explanation && (
        <div className="p-2.5 bg-sky-950/40 border border-sky-900/50 rounded-md text-xs text-sky-200">
          <span className="font-semibold text-sky-300">Plan: </span>
          {diff.explanation}
        </div>
      )}

      <div className="bg-slate-950 border border-slate-800 rounded-md overflow-hidden text-xs font-mono">
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400">
          <span className="text-slate-300 font-sans font-medium">Proposed Changes ({diff.diffSummary})</span>
          <span className="text-slate-500">Stage {diff.stageNumber}</span>
        </div>

        <div className="max-h-52 overflow-y-auto p-2 space-y-0.5 select-text text-[11px]">
          {newLines.slice(0, 30).map((line, idx) => {
            const isAdded = !origLines.includes(line);
            return (
              <div
                key={idx}
                className={`flex gap-3 px-1.5 py-0.5 rounded ${
                  isAdded
                    ? 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500'
                    : 'text-slate-400'
                }`}
              >
                <span className="text-slate-600 w-6 text-right shrink-0 select-none">
                  {idx + 1}
                </span>
                <span className="shrink-0 select-none text-slate-500 w-3">
                  {isAdded ? '+' : ' '}
                </span>
                <span className="break-all whitespace-pre-wrap">{line || ' '}</span>
              </div>
            );
          })}
          {newLines.length > 30 && (
            <div className="text-center text-slate-500 text-[10px] py-1">
              ... +{newLines.length - 30} more lines ...
            </div>
          )}
        </div>
      </div>

      {diff.suggestedTest && (
        <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-md text-[11px] font-mono text-slate-300">
          <div className="text-[10px] uppercase font-sans text-slate-500 font-semibold mb-1">
            Verification Test Check
          </div>
          <pre className="text-slate-400 whitespace-pre-wrap">{diff.suggestedTest}</pre>
        </div>
      )}
    </div>
  );
};
