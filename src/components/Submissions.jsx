import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import { 
  ChevronLeft, Loader2, Calendar, ShieldCheck, 
  Clock, HardDrive, Code2, AlertTriangle, CheckCircle, 
  X, Copy, Check, Filter, Search, RefreshCw
} from 'lucide-react';

const Submissions = ({ onBack }) => {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSub, setSelectedSub] = useState(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('ALL');
  const [langFilter, setLangFilter] = useState('ALL');
  const [copied, setCopied] = useState(false);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiService.getSubmissions();
      setSubmissions(data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve submission history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleCopyCode = (codeText) => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = sub.problem_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sub.problem_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVerdict = verdictFilter === 'ALL' || sub.verdict.toUpperCase() === verdictFilter;
    const matchesLang = langFilter === 'ALL' || sub.language.toLowerCase() === langFilter.toLowerCase();
    return matchesSearch && matchesVerdict && matchesLang;
  });

  const getVerdictStyle = (verdict) => {
    const v = verdict.toLowerCase();
    if (v === 'accepted') {
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/5',
        border: 'border-emerald-500/20 dark:border-emerald-500/15',
        text: 'text-emerald-600 dark:text-emerald-400',
        icon: <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
      };
    } else if (v.includes('wrong') || v.includes('failed')) {
      return {
        bg: 'bg-rose-500/10 dark:bg-rose-500/5',
        border: 'border-rose-500/20 dark:border-rose-500/15',
        text: 'text-rose-600 dark:text-rose-400',
        icon: <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
      };
    } else {
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/5',
        border: 'border-amber-500/20 dark:border-amber-500/15',
        text: 'text-amber-600 dark:text-amber-400',
        icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
      };
    }
  };

  const getLangBadgeStyle = (lang) => {
    const l = lang.toLowerCase();
    if (l === 'python') return 'text-sky-400 bg-sky-400/10 border-sky-400/25';
    if (l === 'javascript') return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/25';
    if (l === 'cpp' || l === 'c++') return 'text-purple-400 bg-purple-400/10 border-purple-400/25';
    return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25';
  };

  // Calculate statistics
  const totalSubmissions = submissions.length;
  const acceptedSubmissions = submissions.filter(s => s.verdict.toLowerCase() === 'accepted').length;
  const successRate = totalSubmissions > 0 ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-12 bg-slate-50 dark:bg-[#080a10] text-slate-800 dark:text-white font-sans transition-colors duration-300 relative">
      
      {/* Background Glow Overlay */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full radial-glow-cyan pointer-events-none z-0 opacity-10 dark:opacity-20"></div>
      
      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e121e] hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white transition-all cursor-pointer shadow-sm"
              title="Return to Explorer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-850 dark:text-white">Submission History</h1>
              <p className="text-xs text-slate-500 font-light">Monitor compiled metrics, verdicts, and code snippets.</p>
            </div>
          </div>
          
          <button 
            onClick={fetchSubmissions}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cyber-cyan border border-cyber-cyan/30 rounded-lg hover:bg-cyber-cyan/10 transition-all cursor-pointer bg-transparent self-start sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Logs</span>
          </button>
        </div>

        {/* Stats Section */}
        {!isLoading && !error && submissions.length > 0 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center text-cyber-cyan">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Commits</span>
                <h3 className="text-2xl font-black text-slate-850 dark:text-white mt-0.5">{totalSubmissions}</h3>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Accepted Submissions</span>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{acceptedSubmissions}</h3>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyber-purple/10 border border-cyber-purple/35 flex items-center justify-center text-cyber-purple">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Success Ratio</span>
                <h3 className="text-2xl font-black text-cyber-purple mt-0.5">{successRate}%</h3>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filter controls */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by problem name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyber-cyan"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={verdictFilter}
                onChange={(e) => setVerdictFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider outline-none cursor-pointer"
              >
                <option value="ALL">All Verdicts</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="WRONG ANSWER">Wrong Answer</option>
                <option value="COMPILE ERROR">Compile Error</option>
                <option value="RUNTIME ERROR">Runtime Error</option>
              </select>
            </div>

            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider outline-none cursor-pointer"
            >
              <option value="ALL">All Languages</option>
              <option value="PYTHON">Python</option>
              <option value="JAVASCRIPT">JavaScript</option>
              <option value="CPP">C++</option>
              <option value="JAVA">Java</option>
            </select>
          </div>
        </div>

        {/* Content Board */}
        <div className="bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-cyber-cyan animate-spin" />
              <span className="text-sm font-light">Loading historical records...</span>
            </div>
          ) : error ? (
            <div className="p-16 text-center space-y-4">
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-full inline-block">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-sm text-rose-500 font-bold">{error}</p>
              <button 
                onClick={fetchSubmissions}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-bold"
              >
                Retry Request
              </button>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-2">
              <Code2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h4 className="text-base font-bold text-slate-750 dark:text-slate-350">No Submissions Found</h4>
              <p className="text-xs text-slate-500 font-light">
                {submissions.length === 0 
                  ? "You haven't submitted any code yet! Open the Workspace and code solutions to track your history." 
                  : "No submissions match your active search filter settings."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-[#121626]/20">
                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Problem</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Language</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Verdict</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Runtime</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Memory</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                  {filteredSubmissions.map((sub, idx) => {
                    const statusStyle = getVerdictStyle(sub.verdict);
                    const formattedDate = new Date(sub.submitted_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <motion.tr 
                        key={sub.id || idx}
                        whileHover={{ backgroundColor: 'rgba(0, 214, 230, 0.02)' }}
                        onClick={() => setSelectedSub(sub)}
                        className="cursor-pointer transition-all border-b border-slate-200 dark:border-slate-850/60"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-xs text-slate-800 dark:text-white">{sub.problem_title}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sub.problem_id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 border border-transparent rounded text-[9px] font-bold uppercase tracking-wider ${getLangBadgeStyle(sub.language)}`}>
                            {sub.language}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-lg text-[10px] font-bold uppercase tracking-wide ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}>
                            {statusStyle.icon}
                            <span>{sub.verdict}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{sub.runtime}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{sub.memory}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formattedDate}</span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* CODE ARCHIVE VIEWER MODAL */}
      <AnimatePresence>
        {selectedSub && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/85 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 30, opacity: 0 }}
              className="w-full max-w-3xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple" />
              
              <div className="p-6 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between shrink-0">
                <div className="space-y-1">
                  <h3 className="font-sans font-black text-base text-slate-850 dark:text-white">
                    Archived Run: {selectedSub.problem_title}
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                    <span className="uppercase font-bold text-cyber-cyan">{selectedSub.language}</span>
                    <span>•</span>
                    <span>Verdict: <strong className={selectedSub.verdict.toLowerCase() === 'accepted' ? 'text-emerald-400' : 'text-rose-400'}>{selectedSub.verdict}</strong></span>
                    <span>•</span>
                    <span>Time: {selectedSub.runtime}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedSub(null)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Code Sandbox Viewport */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-950 font-mono text-xs text-slate-250 leading-relaxed border-b border-slate-200 dark:border-slate-850 selection:bg-cyber-cyan/30">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Source Code Payload</span>
                  <button
                    onClick={() => handleCopyCode(selectedSub.source_code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white text-[10px] font-bold uppercase transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 rounded-xl bg-black border border-slate-900 overflow-x-auto select-text text-left max-h-[50vh] scrollbar-thin scrollbar-thumb-slate-800">
                  <code>{selectedSub.source_code}</code>
                </pre>
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 dark:bg-[#0c0e17] flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedSub(null)}
                  className="px-5 py-2.5 bg-slate-200 dark:bg-slate-900 hover:bg-slate-300 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800/80 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer transition-colors"
                >
                  Close Archive
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Submissions;
