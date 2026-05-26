import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Send, RotateCcw, HelpCircle, Eye, EyeOff, Sparkles, Terminal } from 'lucide-react';

const EditorPanel = ({ 
  problem, 
  activeLanguage, 
  setActiveLanguage, 
  code, 
  setCode, 
  onRun, 
  onSubmit, 
  onReset,
  theme,
  runResult 
}) => {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const editorRef = React.useRef(null);
  const monacoRef = React.useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  React.useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    if (runResult && runResult.error && runResult.message) {
      const markers = [];
      const lines = runResult.message.split('\n');

      lines.forEach(line => {
        let match;
        let lineNum = null;

        if (activeLanguage === 'python') {
          match = line.match(/line (\d+)/i);
          if (match) lineNum = parseInt(match[1]);
        } else if (activeLanguage === 'javascript') {
          match = line.match(/:(\d+):\d+/);
          if (match) lineNum = parseInt(match[1]);
        } else if (activeLanguage === 'cpp' || activeLanguage === 'java') {
          match = line.match(/:(\d+):\d+:/) || line.match(/:(\d+): error:/);
          if (match) lineNum = parseInt(match[1]);
        }

        if (lineNum) {
          markers.push({
            startLineNumber: lineNum,
            startColumn: 1,
            endLineNumber: lineNum,
            endColumn: 1000,
            message: runResult.message, // Provide full traceback on hover
            severity: monacoRef.current.MarkerSeverity.Error
          });
        }
      });

      monacoRef.current.editor.setModelMarkers(model, 'owner', markers);
    } else {
      // Clear markers if no error
      monacoRef.current.editor.setModelMarkers(model, 'owner', []);
    }
  }, [runResult, activeLanguage]);

  const languages = [
    { id: 'javascript', label: 'JavaScript' },
    { id: 'python', label: 'Python 3' },
    { id: 'cpp', label: 'C++ 17' },
    { id: 'java', label: 'Java 13' }
  ];

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  // Convert language id to Monaco Editor syntax names
  const getMonacoLanguage = (langId) => {
    if (langId === 'python') return 'python';
    if (langId === 'cpp') return 'cpp';
    if (langId === 'java') return 'java';
    return 'javascript';
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0e121e] relative overflow-hidden">
      
      {/* Editor Toolbar Header */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-[#0b0e17] flex items-center justify-between flex-wrap gap-3">
        
        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider block">Language:</span>
          <select
            value={activeLanguage}
            onChange={(e) => setActiveLanguage(e.target.value)}
            className="bg-white dark:bg-[#121626] border border-slate-200 dark:border-slate-850 rounded px-2 py-1 text-xs text-slate-800 dark:text-cyber-cyan font-bold outline-none cursor-pointer focus:border-cyber-cyan/50"
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Shortcuts Overlay Toggle */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className={`p-2 rounded border transition-colors cursor-pointer ${
              showShortcuts
                ? 'border-cyber-cyan text-cyber-cyan bg-slate-100 dark:bg-[#121626]'
                : 'border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#121626]'
            }`}
            title="Keyboard Shortcuts"
          >
            {showShortcuts ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

          {/* Reset Template */}
          <button
            onClick={onReset}
            className="p-2 rounded border border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#121626] transition-colors cursor-pointer"
            title="Reset to Starter Template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Monaco Editor Wrapper Frame */}
      <div className="flex-1 min-h-[250px] relative text-left">
        <Editor
          height="100%"
          language={getMonacoLanguage(activeLanguage)}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'JetBrains Mono',
            lineNumbers: 'on',
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            cursorBlinking: 'smooth',
            smoothCaretAnimation: 'on',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8
            }
          }}
        />

        {/* Keyboard Shortcuts Hint Overlay */}
        <AnimatePresence>
          {showShortcuts && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-6 z-20 pointer-events-none"
            >
              <div className="w-full max-w-sm bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-2xl pointer-events-auto">
                <span className="font-sans font-bold text-xs tracking-wider text-slate-800 dark:text-white uppercase flex items-center gap-1.5 border-b border-slate-150 dark:border-slate-850 pb-2">
                  <Terminal className="w-4 h-4 text-cyber-cyan" />
                  Terminal Shortcuts
                </span>
                
                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Compile & Run Code</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-cyber-cyan font-bold">Ctrl + Enter</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Submit Solution</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-cyber-cyan font-bold">Ctrl + Shift + S</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Reset Templates</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-cyber-cyan font-bold">Ctrl + Alt + R</kbd>
                  </div>
                </div>

                <div className="p-3 bg-cyber-purple/5 border border-cyber-purple/20 rounded-lg text-[10px] text-slate-500 dark:text-slate-400 font-light leading-relaxed flex gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyber-purple shrink-0 animate-pulse" />
                  <span>Tip: Custom shortcut combinations can be mapped in your profile settings dashboard terminal.</span>
                </div>

                <button
                  onClick={() => setShowShortcuts(false)}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
                >
                  Close panel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Editor Action Buttons footer */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-[#0b0e17] flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-500 tracking-wider">
          MONACO_STABLE V0.38.0
        </span>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onRun}
            className="px-5 py-2.5 bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-850 hover:bg-slate-300 dark:hover:bg-[#121626] text-slate-800 dark:text-slate-300 font-sans font-bold text-xs tracking-wider uppercase rounded transition-colors cursor-pointer"
          >
            Run Code
          </button>
          
          <button
            onClick={onSubmit}
            className="px-6 py-2.5 bg-cyber-cyan hover:bg-[#00d6e6] text-space-900 font-sans font-bold text-xs tracking-wider uppercase rounded flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 fill-current" />
            Submit
          </button>
        </div>
      </div>

    </div>
  );
};

export default EditorPanel;
