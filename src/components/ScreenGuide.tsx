import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

interface ScreenGuideProps {
  title: string;
  steps: string[];
  guideKey: string; // unique key to save collapse state in localStorage
}

export const ScreenGuide: React.FC<ScreenGuideProps> = ({ title, steps, guideKey }) => {
  const storageKey = `guide_collapsed_${guideKey}`;
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(storageKey) === 'true';
  });

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem(storageKey, String(nextState));
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm transition-all duration-200 shrink-0">
      {/* Header Bar */}
      <div 
        onClick={toggleCollapse}
        className="px-5 py-3.5 flex items-center justify-between cursor-pointer select-none bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4.5 h-4.5 text-primary" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Step Guide: {title}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
          <span>{isCollapsed ? 'Show Steps' : 'Hide Steps'}</span>
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded Instruction List */}
      {!isCollapsed && (
        <div className="px-5 py-4 bg-slate-900/50 border-t border-slate-800/70 animate-fade-in">
          <ul className="space-y-2.5">
            {steps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-350 leading-relaxed font-medium">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
