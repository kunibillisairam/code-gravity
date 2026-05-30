import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Orbit, Sun, Moon, Sparkles, Award, Zap, CheckCircle } from 'lucide-react';
import ProblemPanel from './ProblemPanel';
import EditorPanel from './EditorPanel';
import ConsolePanel from './ConsolePanel';
import { apiService } from '../services/api';
import DiscussionPanel from './DiscussionPanel';

const getLanguageFromProblemId = (probId) => {
  if (!probId) return 'javascript';
  if (probId.startsWith('python_')) return 'python';
  if (probId.startsWith('javascript_') || probId.startsWith('js_')) return 'javascript';
  if (probId.startsWith('cpp_')) return 'cpp';
  if (probId.startsWith('java_')) return 'java';
  return 'javascript';
};

const Workspace = ({ problem, onBack, theme, toggleTheme }) => {
  const [activeLanguage, setActiveLanguage] = useState(() => getLanguageFromProblemId(problem?.id));
  const [code, setCode] = useState('');

  // Sync activeLanguage when problem changes
  useEffect(() => {
    if (problem) {
      setActiveLanguage(getLanguageFromProblemId(problem.id));
    }
  }, [problem]);
  
  // Console Drawer states
  const [consoleIsOpen, setConsoleIsOpen] = useState(false);
  const [consoleActiveTab, setConsoleActiveTab] = useState('input');
  const [customInput, setCustomInput] = useState('');
  
  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  
  // Submit modal overlay
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Community Discussion left tab state
  const [leftTab, setLeftTab] = useState('description');

  // Panel split-resizing and responsive states
  const [leftWidth, setLeftWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Height resizer split states
  const [consoleHeight, setConsoleHeight] = useState(288);
  const [isResizingHeight, setIsResizingHeight] = useState(false);

  const handleHeightMouseDown = (e) => {
    e.preventDefault();
    setIsResizingHeight(true);
  };

  const handleHeightDoubleClick = () => {
    setConsoleHeight(288);
  };

  useEffect(() => {
    if (!isResizingHeight) return;

    const handleMouseMove = (e) => {
      const height = window.innerHeight - e.clientY;
      const constrained = Math.max(120, Math.min(window.innerHeight - 200, height));
      setConsoleHeight(constrained);
    };

    const handleMouseUp = () => {
      setIsResizingHeight(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingHeight]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleDoubleClick = () => {
    setLeftWidth(50);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const percentage = (e.clientX / window.innerWidth) * 100;
      const constrained = Math.max(25, Math.min(75, percentage));
      setLeftWidth(constrained);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Sync editor code when active problem or language changes
  useEffect(() => {
    if (problem && problem.templates[activeLanguage]) {
      setCode(problem.templates[activeLanguage]);
    }
    setRunResult(null);
    setConsoleIsOpen(false);
  }, [problem, activeLanguage]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + Enter to Run Code
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
      // Ctrl + Shift + S to Submit
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        handleSubmit();
      }
      // Ctrl + Alt + R to Reset template
      if (e.ctrlKey && e.altKey && e.key === 'r') {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, activeLanguage]);

  const handleRun = async () => {
    setIsRunning(true);
    setConsoleIsOpen(true);
    setConsoleActiveTab('output');
    setRunResult(null);

    const inputToUse = customInput.trim() || (problem.testcases && problem.testcases[0] ? problem.testcases[0].input : '');

    try {
      const result = await apiService.runCode(code, activeLanguage, inputToUse, problem.id);
      setIsRunning(false);
      
      if (!result.error) {
        setRunResult({
          ...result,
          isSubmission: false,
          metrics: `Time: ${result.time} | Memory: ${result.memory}`
        });
      } else {
        setRunResult(result);
      }
    } catch (err) {
      setIsRunning(false);
      setRunResult({
        error: true,
        message: `Compilation failed to initiate: ${err.message}`,
        time: '0.0ms',
        memory: '0 KB'
      });
    }
  };

  const handleSubmit = async () => {
    setIsRunning(true);
    setConsoleIsOpen(true);
    setConsoleActiveTab('output');
    setRunResult(null);

    try {
      const result = await apiService.submitCode(code, activeLanguage, problem.id, problem.testcases);
      setIsRunning(false);
      
      const allPassed = !result.error && result.verdict === "Accepted";
      
      setRunResult({
        ...result,
        isSubmission: true,
        message: result.message || (allPassed 
          ? `All ${problem.testcases.length} test cases passed successfully!` 
          : `Verdict: ${result.verdict}. Please debug your solution.`),
        metrics: `Time: ${result.time} | Memory: ${result.memory}`
      });

      // Save submission history silently to MongoDB if user is authenticated
      const token = localStorage.getItem('codegravity_token');
      const activeUser = localStorage.getItem('codegravity_user');
      if (token && activeUser) {
        apiService.saveSubmission({
          problem_id: problem.id,
          problem_title: problem.title,
          language: activeLanguage,
          verdict: result.verdict,
          runtime: result.time,
          memory: result.memory,
          source_code: code
        }).catch(err => console.error("Silent background submission save failed:", err));
      }

      if (allPassed) {
        const userScope = activeUser || 'anonymous';
        localStorage.setItem(`solved_${userScope}_${problem.id}`, 'true');
        setShowSubmitModal(true);
      }
    } catch(e) {
      setIsRunning(false);
      setRunResult({
        error: true,
        verdict: "Frontend Error",
        message: `Submission Failed: ${e.message}`,
        time: '0.0ms',
        memory: '0 KB'
      });
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset your code to the starter template? All current changes will be overwritten.')) {
      if (problem && problem.templates[activeLanguage]) {
        setCode(problem.templates[activeLanguage]);
      }
      setRunResult(null);
    }
  };

  if (!problem) return null;

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-[#080a10] text-slate-800 dark:text-white overflow-hidden transition-colors duration-300 font-sans">
      
      {/* Immersive Workspace Navigation Header */}
      <nav className="h-14 bg-white/95 dark:bg-[#080a10]/95 border-b border-slate-200 dark:border-slate-900 transition-colors duration-300 px-6 flex items-center justify-between shrink-0">
        
        {/* Left Side: Back & Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#121626] text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
            title="Return to Topic Explorer"
          >
            <ChevronLeft className="w-5 h-5 shrink-0" />
          </button>
          
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800"></div>

          <span className="font-sans text-xs tracking-wider uppercase text-slate-400 dark:text-slate-500 font-bold hidden sm:inline">
            Workspace: <strong className="text-slate-800 dark:text-cyber-cyan font-bold">{problem.title}</strong>
          </span>
        </div>

        {/* Mid: Logo */}
        <div className="flex items-center gap-2 select-none">
          <Orbit className="w-5 h-5 text-cyber-cyan animate-spin-slow" />
          <span className="font-sans text-sm font-black tracking-widest text-slate-800 dark:text-white">
            CODE<span className="text-cyber-purple">GRAVITY</span>
          </span>
        </div>

        {/* Right Side: Theme Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#121626] text-slate-550 hover:text-slate-900 dark:text-cyber-cyan transition-all duration-200 bg-transparent cursor-pointer"
            aria-label="Toggle Theme Mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-cyber-cyan" />
            ) : (
              <Moon className="w-4 h-4 text-cyber-purple" />
            )}
          </button>
        </div>

      </nav>

      {/* Main Splits Workspace Body (Left Description pane, Right Monaco Panel + Console Pane) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative z-10">
        
        {/* Left Half Pane (Description vs Discussion tabs) */}
        <div 
          className="w-full md:h-full min-h-0 shrink-0 flex flex-col bg-white dark:bg-[#0e121e] border-r border-slate-200 dark:border-slate-800"
          style={!isMobile ? { width: `calc(${leftWidth}% - 4px)` } : {}}
        >
          {/* Tab selector bar */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0b0e17] px-4 py-1 shrink-0 gap-2 select-none">
            <button
              onClick={() => setLeftTab('description')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors relative cursor-pointer ${
                leftTab === 'description'
                  ? 'text-cyber-cyan font-black'
                  : 'text-slate-400 hover:text-slate-850 dark:hover:text-white'
              }`}
            >
              <span>Description</span>
              {leftTab === 'description' && (
                <motion.div 
                  layoutId="activeLeftTabGlow"
                  className="absolute bottom-0 left-0 w-full h-[2px] bg-cyber-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                />
              )}
            </button>
            <button
              onClick={() => setLeftTab('discussion')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors relative cursor-pointer ${
                leftTab === 'discussion'
                  ? 'text-cyber-purple font-black'
                  : 'text-slate-400 hover:text-slate-850 dark:hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                Community Discussion
                <span className="h-1.5 w-1.5 rounded-full bg-cyber-purple animate-pulse" />
              </span>
              {leftTab === 'discussion' && (
                <motion.div 
                  layoutId="activeLeftTabGlow"
                  className="absolute bottom-0 left-0 w-full h-[2px] bg-cyber-purple shadow-[0_0_8px_rgba(180,90,255,0.8)]"
                />
              )}
            </button>
          </div>

          {/* View panel viewport */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {leftTab === 'description' ? (
              <ProblemPanel problem={problem} />
            ) : (
              <DiscussionPanel problem={problem} />
            )}
          </div>
        </div>

        {/* Resizable Divider Line */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          className={`hidden md:flex w-2 h-full cursor-col-resize select-none items-center justify-center relative z-40 bg-slate-200 dark:bg-[#0b0e17] border-l border-r border-slate-300 dark:border-slate-850 hover:bg-cyber-cyan/50 dark:hover:bg-cyber-cyan/50 hover:border-cyber-cyan/40 transition-colors duration-150 ${
            isResizing ? 'bg-cyber-cyan border-cyber-cyan/40 dark:bg-cyber-cyan' : ''
          }`}
          title="Drag left/right to resize panels (Double click to reset to 50/50)"
        >
          <div className="w-[1.5px] h-6 bg-slate-400 dark:bg-slate-700 rounded-sm"></div>
        </div>

        {/* Right Half: Editor + Bottom retractable drawer */}
        <div 
          className="w-full md:h-full flex flex-col min-h-0 relative bg-[#0e121e]"
          style={!isMobile ? { width: `calc(${100 - leftWidth}% - 4px)` } : {}}
        >
          
          {/* Editor section */}
          <div className="flex-1 min-h-0">
            <EditorPanel
              problem={problem}
              activeLanguage={activeLanguage}
              setActiveLanguage={setActiveLanguage}
              code={code}
              setCode={setCode}
              onRun={handleRun}
              onSubmit={handleSubmit}
              onReset={handleReset}
              theme={theme}
              runResult={runResult}
            />
          </div>

          {/* Bottom Console Drawer */}
          <ConsolePanel
            isOpen={consoleIsOpen}
            setIsOpen={setConsoleIsOpen}
            activeTab={consoleActiveTab}
            setActiveTab={setConsoleActiveTab}
            customInput={customInput}
            setCustomInput={setCustomInput}
            isRunning={isRunning}
            runResult={runResult}
            problem={problem}
            consoleHeight={consoleHeight}
            handleHeightMouseDown={handleHeightMouseDown}
            handleHeightDoubleClick={handleHeightDoubleClick}
            isResizingHeight={isResizingHeight}
            onRun={handleRun}
            onSubmit={handleSubmit}
          />
        </div>

      </div>

      {/* SUBMISSION CELEBRATION MODAL OVERLAY (Particles & Badges) */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.2 }}
              className="w-full max-w-md bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 rounded-xl p-8 space-y-6 text-center shadow-2xl relative overflow-hidden"
            >
              {/* Confetti Particle overlays */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyber-cyan via-emerald-450 to-cyber-purple" />

              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/10">
                  <CheckCircle className="w-9 h-9 animate-bounce" />
                </div>
                <h3 className="font-sans font-black text-2xl text-slate-850 dark:text-white leading-tight pt-1">
                  Challenge Conquered!
                </h3>
                <span className="text-xs text-slate-455 dark:text-slate-500 font-mono">PROBLEM SOLVED SUCCESSFULLY</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 grid grid-cols-2 gap-4 text-left">
                <div className="space-y-1">
                  <span className="text-[8px] font-sans font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Award Points</span>
                  <div className="font-sans font-extrabold text-sm text-cyber-cyan flex items-center gap-1">
                    <Zap className="w-4 h-4 text-cyber-cyan fill-current animate-pulse" />
                    +{problem.xp} XP
                  </div>
                </div>
                <div className="space-y-1 border-l border-slate-200 dark:border-slate-800 pl-4">
                  <span className="text-[8px] font-sans font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Badge Acquired</span>
                  <div className="font-sans font-bold text-xs text-cyber-purple flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-cyber-purple" />
                    Speed Demon
                  </div>
                </div>
              </div>

              <div className="text-xs font-light text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                Excellent efficiency! Your solution compiled under the strict constraint parameters in <strong>3.5ms</strong>. Ranks updated in the Hall of Legends dashboard.
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
                >
                  Stay in Workspace
                </button>
                <button
                  onClick={() => {
                    setShowSubmitModal(false);
                    onBack();
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-cyber-cyan to-cyber-blue text-space-900 font-sans font-extrabold text-xs tracking-wider uppercase rounded-lg transition-colors cursor-pointer"
                >
                  Return to Explorer
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resizing full-screen drag overlay blocker */}
      {(isResizing || isResizingHeight) && (
        <div 
          className="fixed inset-0 z-50 select-none bg-transparent" 
          style={{ cursor: isResizingHeight ? 'row-resize' : 'col-resize' }}
        />
      )}

    </div>
  );
};

export default Workspace;
