import React, { useState } from 'react';
import { HelpCircle, ChevronRight, Hash, ShieldCheck, HelpCircle as QuestionIcon } from 'lucide-react';

const ProblemPanel = ({ problem }) => {
  const [activeCaseTab, setActiveCaseTab] = useState(0);

  if (!problem) return null;

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-white dark:bg-[#0e121e] border-r border-slate-200 dark:border-slate-800 text-left p-6 space-y-6 scrollbar-thin">
      
      {/* Title & Stats */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-450 dark:text-slate-500 font-sans tracking-wider uppercase font-semibold">
          <span>Prepare</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Algorithms</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-cyber-cyan">{problem.subdomain}</span>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white font-sans">
            {problem.title}
          </h2>
          <span className={`text-[10px] font-sans font-bold uppercase px-2.5 py-0.5 rounded ${
            problem.difficulty === 'Easy' 
              ? 'text-emerald-700 bg-emerald-100/50 border border-emerald-250/20 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/30' 
              : 'text-amber-700 bg-amber-100/50 border border-amber-250/20 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/30'
          }`}>
            {problem.difficulty}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2.5 border-b border-slate-100 dark:border-slate-850 pb-5">
        <span className="font-sans font-extrabold text-[10px] text-slate-450 dark:text-slate-500 tracking-wider uppercase block">
          Description
        </span>
        <div className="text-slate-700 dark:text-slate-300 text-sm font-light leading-relaxed whitespace-pre-wrap">
          {problem.description}
        </div>
      </div>

      {/* Examples */}
      <div className="space-y-4 border-b border-slate-100 dark:border-slate-850 pb-5">
        <span className="font-sans font-extrabold text-[10px] text-slate-450 dark:text-slate-500 tracking-wider uppercase block">
          Examples
        </span>
        
        <div className="space-y-3.5">
          {problem.examples.map((example, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 space-y-2 text-xs font-mono">
              <span className="text-[10px] font-sans font-bold text-cyber-purple dark:text-cyber-cyan uppercase block">
                Example {idx + 1}
              </span>
              
              <div className="space-y-1 bg-white/50 dark:bg-slate-950/50 p-2.5 rounded border border-slate-150 dark:border-slate-900 leading-relaxed text-slate-700 dark:text-slate-300">
                <div><strong className="text-slate-500 font-sans uppercase text-[9px] block">Input:</strong> {example.input}</div>
                <div><strong className="text-slate-500 font-sans uppercase text-[9px] block">Output:</strong> {example.output}</div>
                {example.explanation && (
                  <div className="text-slate-500 dark:text-slate-400 mt-1 font-sans italic text-[11px]">
                    <strong className="font-sans not-italic text-[9px] block">Explanation:</strong> {example.explanation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Constraints */}
      <div className="space-y-3 border-b border-slate-100 dark:border-slate-850 pb-5">
        <span className="font-sans font-extrabold text-[10px] text-slate-450 dark:text-slate-500 tracking-wider uppercase block">
          Constraints
        </span>
        <ul className="list-disc pl-5 text-slate-650 dark:text-slate-400 text-xs space-y-1.5 font-mono">
          {problem.constraints.map((constraint, idx) => (
            <li key={idx} className="leading-relaxed">{constraint}</li>
          ))}
        </ul>
      </div>

      {/* Tags */}
      <div className="space-y-2.5 border-b border-slate-100 dark:border-slate-850 pb-5">
        <span className="font-sans font-extrabold text-[10px] text-slate-450 dark:text-slate-500 tracking-wider uppercase block">
          Related Tags
        </span>
        <div className="flex flex-wrap gap-2 pt-1">
          {problem.tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 text-xs font-semibold font-sans">
              <Hash className="w-3 h-3 text-cyber-cyan shrink-0" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Test Cases Tabs */}
      <div className="space-y-3 pb-4">
        <span className="font-sans font-extrabold text-[10px] text-slate-450 dark:text-slate-500 tracking-wider uppercase block">
          Sample Test Cases
        </span>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-850 pb-2">
          {problem.testcases.map((tc, index) => (
            <button
              key={tc.id}
              onClick={() => setActiveCaseTab(index)}
              className={`px-3 py-1.5 rounded font-sans text-xs font-bold uppercase transition-all duration-200 cursor-pointer ${
                activeCaseTab === index
                  ? 'bg-slate-100 dark:bg-slate-900 text-cyber-cyan border border-slate-250 dark:border-slate-800'
                  : 'text-slate-405 dark:text-slate-550 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Case {index}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 space-y-3 font-mono text-xs text-slate-700 dark:text-slate-350">
          <div className="space-y-1">
            <span className="text-[9px] font-sans font-bold text-slate-450 dark:text-slate-500 uppercase block">Sample Input</span>
            <pre className="p-2.5 rounded bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-900 overflow-x-auto">{problem.testcases[activeCaseTab].input}</pre>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-sans font-bold text-slate-450 dark:text-slate-500 uppercase block">Expected Output</span>
            <pre className="p-2.5 rounded bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-900 overflow-x-auto">{problem.testcases[activeCaseTab].expected}</pre>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProblemPanel;
