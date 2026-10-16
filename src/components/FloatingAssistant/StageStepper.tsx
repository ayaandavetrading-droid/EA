import React from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { WorkflowStage } from '../../types/deskpilot';

interface StageStepperProps {
  stages: WorkflowStage[];
  currentStageIndex: number;
}

export const StageStepper: React.FC<StageStepperProps> = ({
  stages,
  currentStageIndex,
}) => {
  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
        <span className="font-medium text-slate-300">
          9-Stage Guided Execution
        </span>
        <span className="font-mono text-sky-400">
          {Math.min(currentStageIndex + 1, stages.length)} / {stages.length || 9}
        </span>
      </div>

      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-sky-400 h-full transition-all duration-300"
          style={{
            width: `${((currentStageIndex + 1) / (stages.length || 9)) * 100}%`,
          }}
        />
      </div>

      <div className="max-h-36 overflow-y-auto space-y-1 pr-1 pt-1">
        {stages.map((stage, idx) => {
          const isDone = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          const isPending = idx > currentStageIndex;

          return (
            <div
              key={stage.stageNumber || idx}
              className={`flex items-start gap-2.5 p-1.5 rounded-md text-xs transition-colors ${
                isCurrent
                  ? 'bg-sky-950/60 border border-sky-800/80 text-sky-200'
                  : isDone
                  ? 'text-slate-400'
                  : 'text-slate-600'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-medium truncate ${
                      isCurrent ? 'text-white' : isDone ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {idx + 1}. {stage.name}
                  </span>
                  {stage.requiresApproval && isCurrent && (
                    <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-900/60 font-sans">
                      Requires Approval
                    </span>
                  )}
                </div>
                {isCurrent && stage.description && (
                  <p className="text-[11px] text-sky-300/90 mt-0.5 leading-relaxed">
                    {stage.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
