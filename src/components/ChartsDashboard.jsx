import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import { PROBLEMS_DB } from '../data/problems';
import { 
  ChevronLeft, BarChart3, Award, Zap, Flame, 
  Terminal, ShieldAlert, Brain, TrendingUp, HelpCircle
} from 'lucide-react';

const ChartsDashboard = ({ onBack, user }) => {
  const [profileData, setProfileData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredCell, setHoveredCell] = useState(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchTelemetryData = async () => {
      try {
        const [profileRes, submissionsRes] = await Promise.all([
          apiService.getUserProfile(),
          apiService.getSubmissions()
        ]);
        setProfileData(profileRes);
        setSubmissions(submissionsRes || []);
      } catch (err) {
        console.error('Failed to load telemetry grid data:', err);
        setError(err.message || 'Cognitive telemetry link failed.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTelemetryData();
  }, [user]);

  const progress = profileData?.progress || {};
  const solvedIds = progress.solved_problems || [];
  const attemptedIds = progress.attempted_problems || [];
  const badges = progress.badges || [];
  const heatmap = progress.contribution_heatmap || {};

  // 1. Difficulty Breakdown Parsing
  const { easyCount, mediumCount, hardCount, totalSolved, easyPct, medPct, hardPct } = useMemo(() => {
    const getProblemDifficulty = (id) => {
      if (!id) return 'Easy';
      if (PROBLEMS_DB[id]) return PROBLEMS_DB[id].difficulty || 'Easy';
      if (id.includes('_')) {
        if (id.includes('medium') || id.includes('advanced')) return 'Medium';
        return 'Easy';
      }
      return 'Easy';
    };

    let easyCount = 0;
    let mediumCount = 0;
    let hardCount = 0;

    solvedIds.forEach(id => {
      const diff = getProblemDifficulty(id);
      if (diff === 'Easy') easyCount++;
      else if (diff === 'Medium') mediumCount++;
      else if (diff === 'Hard') hardCount++;
    });

    const totalSolved = solvedIds.length;
    const easyPct = totalSolved ? Math.round((easyCount / totalSolved) * 100) : 0;
    const medPct = totalSolved ? Math.round((mediumCount / totalSolved) * 100) : 0;
    const hardPct = totalSolved ? Math.round((hardCount / totalSolved) * 100) : 0;

    return { easyCount, mediumCount, hardCount, totalSolved, easyPct, medPct, hardPct };
  }, [solvedIds]);

  // 2. Language Breakdown Parsing
  const { langSplits, totalAcceptedSubmissions } = useMemo(() => {
    const langCounts = {};
    submissions.forEach(sub => {
      if (sub.verdict === 'Accepted' && sub.language) {
        const lang = sub.language.toLowerCase();
        langCounts[lang] = (langCounts[lang] || 0) + 1;
      }
    });

    const totalAcceptedSubmissions = Object.values(langCounts).reduce((a, b) => a + b, 0);
    const langSplits = Object.entries(langCounts).map(([lang, count]) => {
      const label = lang === 'python' ? 'Python' : lang === 'javascript' ? 'JavaScript' : lang === 'cpp' ? 'C++' : lang === 'java' ? 'Java' : lang;
      return {
        label,
        count,
        pct: totalAcceptedSubmissions ? Math.round((count / totalAcceptedSubmissions) * 100) : 0
      };
    }).sort((a, b) => b.count - a.count);
    
    return { langSplits, totalAcceptedSubmissions };
  }, [submissions]);

  // 3. Success Integrity Donut calculations
  const totalAttemptsCount = submissions.length;
  const successCount = submissions.filter(s => s.verdict === 'Accepted').length;
  const failCount = totalAttemptsCount - successCount;
  const passRate = totalAttemptsCount ? Math.round((successCount / totalAttemptsCount) * 100) : 0;

  // Donut SVG parameters
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (passRate / 100) * circumference;

  // 4. Heatmap Matrix Preprocessing (Last 20 Weeks for Premium Grid Map representation)
  const heatmapGrid = useMemo(() => {
    const grid = [];
    const today = new Date();
    // Start from Sunday of 20 weeks ago
    const startDate = new Date();
    startDate.setDate(today.getDate() - 140);
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek); // Align to Sunday

    let currDate = new Date(startDate);
    // Build 7 rows (Days of Week) x 21 columns (Weeks)
    for (let r = 0; r < 7; r++) {
      const row = [];
      for (let c = 0; c < 21; c++) {
        const targetDate = new Date(currDate);
        targetDate.setDate(currDate.getDate() + c * 7 + r);
        const dateStr = targetDate.toISOString().split('T')[0];
        const count = heatmap[dateStr] || 0;
        row.push({
          dateStr,
          dateObj: targetDate,
          count
        });
      }
      grid.push(row);
    }
    return grid;
  }, [heatmap]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#060810] text-slate-100 flex flex-col items-center justify-center p-6 pt-24 font-sans select-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#0c0f1a]/85 border border-rose-500/20 backdrop-blur-md rounded-3xl p-8 text-center space-y-6 relative overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.05)]"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-cyber-purple" />
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black uppercase tracking-widest text-white">Grid Link Restrained</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              Cognitive telemetry profiling requires a secured connection link. Please establish a developer login to bridge the data feed.
            </p>
          </div>
          <button
            onClick={onBack}
            className="w-full py-3 bg-rose-550 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md hover:scale-[1.01]"
          >
            Return to Core Grid
          </button>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060810] text-slate-100 flex flex-col items-center justify-center pt-24 font-sans select-none">
        <div className="space-y-4 text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-cyber-cyan/15 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-cyber-cyan border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
            <BarChart3 className="absolute inset-0 m-auto w-6 h-6 text-cyber-cyan animate-bounce" />
          </div>
          <p className="text-[10px] text-cyber-cyan font-mono tracking-widest uppercase animate-pulse">Syncing Telemetry Channels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#060810] text-slate-100 flex flex-col items-center justify-center p-6 pt-24 font-sans select-none">
        <div className="w-full max-w-md bg-[#0c0f1a]/85 border border-rose-500/20 backdrop-blur-md rounded-3xl p-8 text-center space-y-6 relative shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="font-sans font-black text-base uppercase tracking-widest text-white">Telemetry Sync Timeout</h3>
          <p className="text-xs text-rose-400 font-mono leading-relaxed">{error}</p>
          <button
            onClick={onBack}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Acknowledge & Return
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-[#060810] text-slate-100 py-24 px-6 md:px-12 font-sans select-none">
      
      {/* Top Telemetry Header bar */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-cyber-cyan hover:text-cyan-400 font-bold uppercase tracking-wider transition-colors cursor-pointer bg-transparent border-0 p-0 mb-3"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Telemetry Grid</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyber-purple/10 border border-cyber-purple/35 text-cyber-purple shadow-[0_0_15px_rgba(145,53,255,0.15)] shrink-0">
              <BarChart3 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black uppercase tracking-widest text-white leading-tight">
                GRAVITY DATA HUB // SYSTEM ANALYTICS
              </h1>
              <p className="text-[10px] md:text-xs text-slate-400 font-light max-w-xl">
                Real-time telemetry of cognitive compile cycles, algorithmic alignments, and dialect statistics.
              </p>
            </div>
          </div>
        </div>

        {/* Global Connection status token */}
        <div className="p-3 bg-[#0c0f1a]/80 border border-slate-800/80 rounded-2xl flex items-center gap-3 shadow-md shrink-0">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
          </div>
          <div className="font-mono text-[9px] text-left leading-tight">
            <div className="text-slate-400 uppercase font-black tracking-wider">SECURED LINK</div>
            <div className="text-emerald-500 font-bold">FEEDS COMPILING ON PORT 8000</div>
          </div>
        </div>
      </div>

      {/* Ribbon metrics strip (futuristic grid cards) */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        
        {/* Metric 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 bg-[#0c0f1a]/80 border border-slate-800/80 rounded-2xl text-left relative overflow-hidden group shadow-md"
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-cyber-purple group-hover:scale-x-110 transition-transform origin-left duration-300" />
          <span className="text-[8px] font-sans font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest block">System Level</span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xl font-black text-white leading-none font-mono">{progress.level || 1}</span>
            <span className="text-[10px] text-cyber-purple font-bold font-mono">Lvl</span>
          </div>
        </motion.div>

        {/* Metric 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-[#0c0f1a]/80 border border-slate-800/80 rounded-2xl text-left relative overflow-hidden group shadow-md"
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-cyber-cyan group-hover:scale-x-110 transition-transform origin-left duration-300" />
          <span className="text-[8px] font-sans font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest block">Neural Weight</span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xl font-black text-white leading-none font-mono">{progress.xp || 0}</span>
            <span className="text-[9px] text-cyber-cyan font-bold font-mono">XP</span>
          </div>
        </motion.div>

        {/* Metric 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 bg-[#0c0f1a]/80 border border-slate-800/80 rounded-2xl text-left relative overflow-hidden group shadow-md"
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500 group-hover:scale-x-110 transition-transform origin-left duration-300" />
          <span className="text-[8px] font-sans font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest block">Aligned Quadrants</span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xl font-black text-white leading-none font-mono">{totalSolved}</span>
            <span className="text-[9px] text-emerald-500 font-bold font-mono">SOLVED</span>
          </div>
        </motion.div>

        {/* Metric 4 */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-[#0c0f1a]/80 border border-slate-800/80 rounded-2xl text-left relative overflow-hidden group shadow-md"
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-amber-500 group-hover:scale-x-110 transition-transform origin-left duration-300" />
          <span className="text-[8px] font-sans font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest block">Attempted Orbits</span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xl font-black text-white leading-none font-mono">{attemptedIds.length}</span>
            <span className="text-[9px] text-amber-500 font-bold font-mono">TRIALS</span>
          </div>
        </motion.div>

        {/* Metric 5 */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-4 bg-[#0c0f1a]/80 border border-slate-800/80 rounded-2xl text-left relative overflow-hidden group col-span-2 sm:col-span-1 shadow-md"
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-cyber-magenta group-hover:scale-x-110 transition-transform origin-left duration-300" />
          <span className="text-[8px] font-sans font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest block">Unlocked Seals</span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xl font-black text-white leading-none font-mono">{badges.length}</span>
            <span className="text-[9px] text-cyber-magenta font-bold font-mono">BADGES</span>
          </div>
        </motion.div>
      </div>

      {/* Main Double Column Charts Structure */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-stretch">
        
        {/* Left Side: Completion Ring & Compile Matrix Heatmap (8 grid cols) */}
        <div className="lg:col-span-8 space-y-6 flex flex-col justify-start">
          
          {/* Card: Success Integrity (Success Rate Donut Chart) */}
          <div className="p-6 bg-[#0c0f1a]/80 border border-slate-800/80 rounded-3xl relative overflow-hidden shadow-md flex flex-col sm:flex-row items-center gap-6">
            
            {/* SVG Ring Donut */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle 
                  cx="72" cy="72" r={radius}
                  stroke="#1e293b" strokeWidth="10" fill="transparent"
                />
                {/* Neon Progress Ring */}
                <motion.circle 
                  cx="72" cy="72" r={radius}
                  stroke="url(#neonGradient)" strokeWidth="10" fill="transparent"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  strokeLinecap="round"
                />
                
                {/* Gradients */}
                <defs>
                  <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00f0ff" />
                    <stop offset="100%" stopColor="#9135ff" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Text inside circle */}
              <div className="absolute flex flex-col items-center justify-center leading-none text-center">
                <span className="text-xl font-black text-white font-mono tracking-tight">{passRate}%</span>
                <span className="text-[7.5px] font-sans font-black text-slate-450 uppercase tracking-widest block mt-0.5">VERDICT</span>
              </div>
            </div>

            {/* Content info detailing stats */}
            <div className="flex-1 text-left space-y-4">
              <div className="space-y-1">
                <h3 className="font-sans font-black text-xs uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-cyber-cyan" />
                  Signal Compilation Integrity
                </h3>
                <p className="text-[10px] text-slate-400 font-light leading-relaxed">
                  Success ratio of compilation iterations targeting isolated sandboxed test suites.
                </p>
              </div>

              {/* Counts listing details */}
              <div className="grid grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800/80 pt-4">
                <div>
                  <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider block">Total Attempts</span>
                  <span className="text-base font-black text-slate-850 dark:text-white font-mono mt-0.5 block">{totalAttemptsCount}</span>
                </div>
                <div>
                  <span className="text-[8px] text-emerald-500 font-mono uppercase tracking-wider block">Success Verdict</span>
                  <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">{successCount}</span>
                </div>
                <div>
                  <span className="text-[8px] text-rose-500 font-mono uppercase tracking-wider block">Failed Verdict</span>
                  <span className="text-base font-black text-rose-450 font-mono mt-0.5 block">{failCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Contributions Heatmap Calendar grid */}
          <div className="p-6 bg-[#0c0f1a]/80 border border-slate-800/80 rounded-3xl relative overflow-hidden shadow-md text-left space-y-4">
            
            <div className="space-y-1">
              <h3 className="font-sans font-black text-xs uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyber-purple" />
                Chronological Compile Matrix
              </h3>
              <p className="text-[10px] text-slate-400 font-light leading-relaxed">
                Distribution of daily accepted problem submissions inside the curriculum quadrants log.
              </p>
            </div>

            {/* Heatmap Grid map container */}
            <div className="pt-2 overflow-x-auto scrollbar-none relative">
              <div className="flex gap-2 min-w-[500px]">
                
                {/* Row Headers (Sun, Tue, Thu, Sat) */}
                <div className="grid grid-rows-7 gap-[3px] text-[7.5px] font-mono text-slate-500 dark:text-slate-600 h-[81px] w-5 uppercase font-bold pr-1 shrink-0 pt-0.5">
                  <span className="leading-none flex items-center">Sun</span>
                  <span className="leading-none flex items-center"></span>
                  <span className="leading-none flex items-center">Tue</span>
                  <span className="leading-none flex items-center"></span>
                  <span className="leading-none flex items-center">Thu</span>
                  <span className="leading-none flex items-center"></span>
                  <span className="leading-none flex items-center">Sat</span>
                </div>

                {/* Main matrix nodes */}
                <div className="grid grid-rows-7 grid-flow-col gap-[3px] h-[81px] relative">
                  {heatmapGrid.map((row, rIdx) => 
                    row.map((cell, cIdx) => {
                      // Determine cell intensity color
                      let cellColorClass = "bg-[#181d30] border-transparent";
                      if (cell.count > 0 && cell.count <= 2) {
                        cellColorClass = "bg-cyber-cyan/30 border-cyber-cyan/15 shadow-[0_0_3px_rgba(0,240,255,0.1)]";
                      } else if (cell.count > 2 && cell.count <= 4) {
                        cellColorClass = "bg-cyber-cyan/60 border-cyber-cyan/35 shadow-[0_0_6px_rgba(0,240,255,0.25)]";
                      } else if (cell.count > 4) {
                        cellColorClass = "bg-cyber-cyan border-cyber-cyan shadow-[0_0_10px_rgba(0,240,255,0.5)]";
                      }

                      return (
                        <div 
                          key={`${rIdx}-${cIdx}`}
                          onMouseEnter={() => setHoveredCell(cell)}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`w-[9px] h-[9px] rounded-[2px] border transition-all cursor-pointer hover:scale-[1.3] hover:z-10 ${cellColorClass}`}
                        />
                      );
                    })
                  )}
                </div>
              </div>

              {/* Legend indicator bar */}
              <div className="flex items-center justify-end gap-1.5 text-[8px] font-mono text-slate-550 uppercase tracking-wider mt-4">
                <span>Less</span>
                <div className="w-[9px] h-[9px] bg-[#181d30] border border-transparent rounded-[2px]" />
                <div className="w-[9px] h-[9px] bg-cyber-cyan/30 border border-cyber-cyan/15 rounded-[2px]" />
                <div className="w-[9px] h-[9px] bg-cyber-cyan/60 border border-cyber-cyan/35 rounded-[2px]" />
                <div className="w-[9px] h-[9px] bg-cyber-cyan border border-cyber-cyan rounded-[2px]" />
                <span>More</span>
              </div>

              {/* Floating Hover Telemetry tooltip overlay */}
              {hoveredCell && (
                <div className="absolute bottom-12 left-4 px-3 py-1.5 bg-[#0e121e] border border-cyber-cyan/30 text-white font-mono text-[9px] rounded-lg shadow-xl z-20 flex items-center gap-2 select-none animate-fadeIn leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan shrink-0 animate-pulse shadow-[0_0_4px_#00f0ff]" />
                  <span>
                    {hoveredCell.count} submissions on {hoveredCell.dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Syllabus Difficulty Breakdown & Dialects (4 grid cols) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-start">
          
          {/* Card: Syllabus Partition (Easy/Med/Hard Bar stats) */}
          <div className="p-6 bg-[#0c0f1a]/80 border border-slate-800/80 rounded-3xl relative overflow-hidden shadow-md text-left flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-sans font-black text-xs uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-cyber-purple animate-pulse" />
                  Syllabus Partition
                </h3>
                <p className="text-[10px] text-slate-400 font-light leading-relaxed">
                  Distribution of solved unique challenges mapped across difficulty grids.
                </p>
              </div>

              {/* Difficulty indicators bars listing */}
              <div className="space-y-4 pt-2">
                
                {/* Easy progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-emerald-405 font-bold uppercase tracking-wider">EASY PROBLEMS</span>
                    <span className="text-slate-800 dark:text-white font-bold">{easyCount} / {easyPct}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#181d30] border border-transparent rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${easyPct}%` }}
                      transition={{ duration: 1, delay: 0.1 }}
                    />
                  </div>
                </div>

                {/* Medium progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-amber-500 font-bold uppercase tracking-wider">MEDIUM PROBLEMS</span>
                    <span className="text-slate-800 dark:text-white font-bold">{mediumCount} / {medPct}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#181d30] border border-transparent rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${medPct}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>

                {/* Hard progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-cyber-magenta font-bold uppercase tracking-wider">HARD PROBLEMS</span>
                    <span className="text-slate-800 dark:text-white font-bold">{hardCount} / {hardPct}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#181d30] border border-transparent rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-cyber-magenta shadow-[0_0_8px_rgba(219,39,119,0.5)] rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${hardPct}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Glowing motivational badge */}
            <div className="mt-6 p-3 rounded-2xl bg-cyber-purple/5 border border-cyber-purple/15 text-left font-mono text-[9px] leading-relaxed text-cyber-purple/90 relative flex items-center gap-2 select-none">
              <Zap className="w-4.5 h-4.5 text-cyber-purple animate-bounce shrink-0" />
              <span>Syllabus compilation alignment index is optimal. Keep ascending orbits!</span>
            </div>
          </div>

          {/* Card: Neural Language dialects split */}
          <div className="p-6 bg-[#0c0f1a]/80 border border-slate-800/80 rounded-3xl relative overflow-hidden shadow-md text-left flex-1 flex flex-col justify-start space-y-4">
            <div className="space-y-1">
              <h3 className="font-sans font-black text-xs uppercase tracking-widest text-slate-805 dark:text-white flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-cyber-cyan" />
                Language Dialects Split
              </h3>
              <p className="text-[10px] text-slate-400 font-light leading-relaxed">
                Primary coding language engines representing accepted submissions compilation profile.
              </p>
            </div>

            {/* Language splits progress indicators list */}
            <div className="space-y-3.5 pt-2 flex-1 flex flex-col justify-center">
              {langSplits.length > 0 ? (
                langSplits.map((lang, idx) => {
                  let accentColorClass = "bg-cyber-cyan shadow-[0_0_6px_#00f0ff]";
                  let textColorClass = "text-cyber-cyan";
                  if (idx === 1) {
                    accentColorClass = "bg-cyber-purple shadow-[0_0_6px_#9135ff]";
                    textColorClass = "text-cyber-purple";
                  } else if (idx === 2) {
                    accentColorClass = "bg-amber-500 shadow-[0_0_6px_#f59e0b]";
                    textColorClass = "text-amber-500";
                  } else if (idx > 2) {
                    accentColorClass = "bg-[#64748b]";
                    textColorClass = "text-slate-400";
                  }

                  return (
                    <div key={lang.label} className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-mono font-bold leading-tight">
                        <span className="uppercase tracking-wider text-slate-600 dark:text-slate-400">{lang.label}</span>
                        <span className={textColorClass}>{lang.count} Accepted / {lang.pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#181d30] border border-transparent rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full rounded-full ${accentColorClass}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${lang.pct}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.1 }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 font-light italic leading-normal flex flex-col items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-slate-650 animate-pulse" />
                  <span>No compile data feeds loaded. Build solutions to record dialect.</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ChartsDashboard;
