import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ShieldCheck, ShieldAlert, Cpu, ChevronUp, ChevronDown, Check, XCircle, Maximize2, Minimize2 } from 'lucide-react';

const ConsolePanel = ({ 
  isOpen, 
  setIsOpen, 
  activeTab, 
  setActiveTab, 
  customInput, 
  setCustomInput, 
  isRunning, 
  runResult, 
  problem,
  consoleHeight,
  handleHeightMouseDown,
  handleHeightDoubleClick,
  isResizingHeight,
  onRun,
  onSubmit
}) => {
  const [isMaximized, setIsMaximized] = React.useState(false);

  return (
    <div 
      style={isOpen && !isMaximized ? { height: `${consoleHeight}px` } : {}}
      className={`border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e121e] flex flex-col transition-all duration-300 relative ${
        isOpen 
          ? (isMaximized 
              ? 'absolute bottom-0 left-0 right-0 h-[460px] md:h-[520px] z-30 shadow-2xl' 
              : '') 
          : 'h-11'
      }`}
    >
      
      {/* Draggable Horizontal Resizer Bar (Top edge of ConsolePanel) */}
      {isOpen && !isMaximized && (
        <div
          onMouseDown={handleHeightMouseDown}
          onDoubleClick={handleHeightDoubleClick}
          className={`absolute -top-0.5 left-0 right-0 h-1.5 cursor-row-resize z-50 bg-transparent hover:bg-cyber-cyan/50 dark:hover:bg-cyber-cyan/40 transition-colors duration-150 ${
            isResizingHeight ? 'bg-cyber-cyan' : ''
          }`}
          title="Drag up/down to resize panel (Double click to reset to 288px)"
        />
      )}
      
      {/* Console Header/Toolbar */}
      <div 
        onDoubleClick={() => setIsMaximized(!isMaximized)}
        className="px-6 py-2.5 bg-slate-50 dark:bg-[#0b0e17] border-b border-slate-200 dark:border-slate-850 flex items-center justify-between text-xs text-slate-550 dark:text-slate-400 select-none cursor-pointer hover:bg-slate-100/50 dark:hover:bg-[#121626]/30 transition-colors"
        title="Double click to maximize/minimize panel"
      >
        
        {/* Console Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsOpen(true);
              setActiveTab('input');
            }}
            className={`px-3 py-1 rounded font-sans font-bold uppercase transition-all duration-200 cursor-pointer ${
              isOpen && activeTab === 'input'
                ? 'bg-white dark:bg-[#121626] text-cyber-cyan border border-slate-200 dark:border-slate-800'
                : 'text-slate-405 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Custom Input
          </button>
          
          <button
            onClick={() => {
              setIsOpen(true);
              setActiveTab('output');
            }}
            className={`px-3 py-1 rounded font-sans font-bold uppercase transition-all duration-200 relative cursor-pointer ${
              isOpen && activeTab === 'output'
                ? 'bg-white dark:bg-[#121626] text-cyber-cyan border border-slate-200 dark:border-slate-800'
                : 'text-slate-405 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Output
            {runResult && !runResult.error && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            )}
            {runResult && runResult.error && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-rose-400 rounded-full animate-ping" />
            )}
          </button>

          {runResult && runResult.error && (
            <button
              onClick={() => {
                setIsOpen(true);
                setActiveTab('error');
              }}
              className={`px-3 py-1 rounded font-sans font-bold uppercase transition-all duration-200 text-rose-500 cursor-pointer ${
                isOpen && activeTab === 'error'
                  ? 'bg-white dark:bg-[#121626] border border-slate-200 dark:border-slate-800'
                  : 'hover:text-rose-600'
              }`}
            >
              Errors
            </button>
          )}
        </div>

        {/* Toolbar Right Side controls */}
        <div className="flex items-center gap-4">
          
          {/* Execution status metrics */}
          <AnimatePresence>
            {isRunning && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-mono text-[10px] text-cyber-cyan flex items-center gap-1.5"
              >
                <span className="w-2.5 h-2.5 rounded-full border border-cyber-cyan border-t-transparent animate-spin inline-block"></span>
                Sandbox Running...
              </motion.span>
            )}
            {!isRunning && runResult && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`font-sans font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded ${
                  runResult.error 
                    ? 'text-rose-600 bg-rose-100/50 dark:text-rose-400 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30' 
                    : 'text-emerald-700 bg-emerald-100/50 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/30'
                }`}
              >
                {runResult.verdict ? runResult.verdict : (runResult.error 
                  ? 'Execution Failed' 
                  : 'Execution Completed')}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Action buttons when console is open */}
          {isOpen && onRun && onSubmit && (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onRun(); }}
                disabled={isRunning}
                className="px-3 py-1 bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:bg-slate-350 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300 font-sans font-bold text-[10px] tracking-wider uppercase rounded transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                Run Code
              </button>
              
              <button
                onClick={(e) => { e.stopPropagation(); onSubmit(); }}
                disabled={isRunning}
                className="px-3.5 py-1 bg-cyber-cyan hover:bg-[#00d6e6] text-space-900 font-sans font-bold text-[10px] tracking-wider uppercase rounded transition-colors cursor-pointer disabled:opacity-50 shrink-0 font-sans"
              >
                Submit
              </button>
            </div>
          )}

          {isOpen && (
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#121626] text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              title={isMaximized ? 'Minimize Panel' : 'Maximize Panel'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={() => {
              setIsOpen(!isOpen);
              if (isOpen) setIsMaximized(false);
            }}
            className="p-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#121626] text-slate-550 dark:text-slate-400 transition-colors cursor-pointer"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Console Content drawer body */}
      {isOpen && (
        <div className="flex-1 p-6 bg-slate-50/50 dark:bg-[#090c15]/20 overflow-y-auto text-left font-mono text-xs">
          
          {/* TAB: INPUT */}
          {activeTab === 'input' && (
            <div className="h-full flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                  Provide custom input parameters for target solver execution:
                </span>
                <span className="text-[8px] font-sans text-slate-400 dark:text-slate-500 italic hidden sm:inline select-none">
                  (Tip: Double click textarea or header to maximize panel)
                </span>
              </div>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onDoubleClick={() => setIsMaximized(!isMaximized)}
                placeholder="e.g. nums = [2,7,11,15], target = 9"
                className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 outline-none text-slate-800 dark:text-white placeholder-slate-500 focus:border-cyber-cyan/40 resize-none font-mono text-xs cursor-text"
                title="Double click to maximize/minimize panel size"
              />
            </div>
          )}

          {/* TAB: OUTPUT */}
          {activeTab === 'output' && (
            <div className="h-full space-y-4">
              {isRunning ? (
                <div className="h-full flex flex-col items-center justify-center space-y-3 py-6">
                  <div className="w-8 h-8 rounded-full border-2 border-cyber-cyan border-t-transparent animate-spin"></div>
                  <span className="text-slate-500 text-xs font-light">Spawning micro-isolated compiler environment...</span>
                </div>
              ) : runResult ? (
                runResult.error && !runResult.testcaseResults ? (
                  <div className="p-4 rounded-lg bg-rose-100/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 flex gap-3 text-rose-700 dark:text-rose-450">
                    <ShieldAlert className="w-5 h-5 shrink-0 animate-bounce" />
                    <div className="space-y-1">
                      <span className="font-bold text-[10px] font-sans uppercase">Compiler Error output:</span>
                      <pre className="whitespace-pre-wrap">{runResult.message}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Solver Metrics bar */}
                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-sans font-bold text-slate-600 dark:text-slate-300">
                        <Terminal className="w-4 h-4 text-cyber-cyan" />
                        {runResult.isSubmission ? 'SUBMISSION SYSTEM COMPLETED' : (customInput ? 'CUSTOM RUN COMPLETED' : 'TEST RUN COMPLETED')}
                      </div>
                      <div className="flex items-center gap-4 text-[10px]">
                        <span className="flex items-center gap-1 text-slate-500"><Cpu className="w-3.5 h-3.5 text-cyber-purple" /> {runResult.metrics}</span>
                      </div>
                    </div>

                    {/* Standard Output (stdout) Console */}
                    {(!runResult.isSubmission || runResult.stdout) && (
                      <div className="space-y-1.5 text-slate-600 dark:text-slate-350">
                        <span className="text-[8px] font-sans uppercase font-bold text-slate-400 dark:text-slate-550 block">Standard Output (stdout)</span>
                        <pre className="p-4 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 text-slate-800 dark:text-cyber-cyan font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                          {runResult.stdout || runResult.message || 'Execution completed with no stdout.'}
                        </pre>
                      </div>
                    )}

                    {/* Test cases validation list (Only show for standard testcases, i.e. no custom input used) */}
                    {!customInput && runResult.testcaseResults && (
                      <div className="space-y-3 pt-2">
                        <span className="text-[8px] font-sans uppercase font-bold text-slate-400 dark:text-slate-550 block">
                          Grading Test Cases Assertions
                        </span>
                        {runResult.testcaseResults.map((tc, index) => {
                          const passed = tc.passed;
                          const gotOutput = tc.got;

                          return (
                            <div key={tc.id || index} className={`p-4 bg-white dark:bg-slate-905 border rounded-lg flex items-start gap-3 transition-colors ${
                              passed 
                                ? 'border-emerald-500/20 dark:border-emerald-950/40 bg-emerald-50/5 dark:bg-emerald-950/5' 
                                : 'border-rose-500/20 dark:border-rose-950/40 bg-rose-50/5 dark:bg-rose-950/5'
                            }`}>
                              <div className={`p-1 rounded border shrink-0 ${
                                passed
                                  ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-250/20 dark:border-emerald-900/30'
                                  : 'bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border-rose-250/20 dark:border-rose-900/30'
                              }`}>
                                {passed ? (
                                  <Check className="w-3.5 h-3.5 font-extrabold" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 font-extrabold" />
                                )}
                              </div>

                              <div className="flex-1 space-y-2 text-slate-600 dark:text-slate-355">
                                <div className="flex items-center justify-between">
                                  <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-slate-455 dark:text-slate-550">
                                    Test Case {index + 1}
                                  </span>
                                  <span className={`text-[10px] font-sans font-bold uppercase ${
                                    passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-450'
                                  }`}>
                                    {passed ? 'Passed' : 'Failed'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                                  <div className="space-y-1">
                                    <span className="text-[8px] font-sans uppercase font-bold text-slate-400 dark:text-slate-550 block">Input Arguments</span>
                                    <pre className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-900 break-all whitespace-pre-wrap">{tc.input}</pre>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[8px] font-sans uppercase font-bold text-slate-400 dark:text-slate-550 block">
                                      {passed ? 'Expected Output' : 'Assertion Comparison'}
                                    </span>
                                    <pre className={`p-2 rounded border break-all whitespace-pre-wrap ${
                                      passed 
                                        ? 'bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-900 text-cyber-cyan' 
                                        : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-950/40 text-rose-500 font-bold font-mono'
                                    }`}>
                                      {passed ? tc.expected : `Expected:\n${tc.expected}\n\nActual:\n${gotOutput}`}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center space-y-2 py-6 text-slate-400 dark:text-slate-500">
                  <Terminal className="w-8 h-8 text-slate-350 dark:text-slate-700 animate-pulse" />
                  <span className="text-xs font-light font-sans">No execution data. Write code and tap "Run Code" inside the workspace.</span>
                </div>
              )}
            </div>
          )}

          {/* TAB: ERROR */}
          {activeTab === 'error' && runResult && runResult.error && (
            <div className="h-full flex flex-col space-y-2">
              <span className="text-[10px] font-sans font-bold text-rose-500 uppercase tracking-wider">
                System Compiler Error Trace:
              </span>
              <pre className="flex-1 w-full bg-[#0e121e] border border-rose-900/30 text-rose-400 rounded-lg p-5 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {runResult.message}
              </pre>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default ConsolePanel;
