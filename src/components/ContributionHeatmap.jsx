import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES, generateMonthlyDays } from '../utils/calendarHelpers';

const ContributionHeatmap = ({ heatmapData = {} }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handlePrevYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  const monthlyDays = generateMonthlyDays(selectedYear, selectedMonth);

  const getCellStyles = (day) => {
    const count = heatmapData[day.date] || 0;
    
    if (!day.isCurrentMonth) {
      if (count === 0) return 'bg-slate-100/30 dark:bg-slate-900/10 border border-slate-200/10 dark:border-slate-850/10 text-slate-400/20 dark:text-slate-655/25 opacity-25 cursor-default pointer-events-none';
      return 'bg-cyan-500/5 border border-cyan-550/10 text-cyan-500/20 dark:text-cyan-400/20 opacity-30';
    }

    if (count === 0) {
      return 'bg-slate-50 dark:bg-[#121626]/40 border border-slate-200/50 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-cyber-cyan/35 dark:hover:border-cyber-cyan/30 hover:bg-slate-100 dark:hover:bg-[#121626]/90';
    }
    if (count === 1) {
      return 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:border-cyan-400/60 shadow-[0_0_6px_rgba(0,180,255,0.05)]';
    }
    if (count === 2) {
      return 'bg-cyan-500/30 border border-cyan-500/50 text-cyan-700 dark:text-cyan-300 hover:border-cyan-300/70 shadow-[0_0_8px_rgba(0,180,255,0.1)]';
    }
    if (count === 3) {
      return 'bg-cyan-500/65 border border-cyan-550/75 text-white dark:text-space-900 dark:font-extrabold hover:border-cyan-200 shadow-[0_0_12px_rgba(0,214,230,0.18)]';
    }
    return 'bg-cyber-cyan border border-cyber-cyan/90 text-space-900 font-extrabold shadow-[0_0_15px_rgba(0,240,255,0.28)] hover:scale-[1.04]';
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm space-y-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-850/60 pb-4">
        <h3 className="font-sans font-black text-sm uppercase tracking-wider text-slate-850 dark:text-white flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-cyber-cyan" />
          Activity Calendar
        </h3>
        
        {/* Navigation Controls */}
        <div className="flex items-center gap-3">
          {/* Month navigation */}
          <div className="flex items-center bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-inner">
            <button 
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-cyber-cyan rounded-lg transition-colors cursor-pointer bg-transparent border-0"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-24 text-center font-sans font-extrabold text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-205 select-none">
              {MONTH_NAMES[selectedMonth]}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-cyber-cyan rounded-lg transition-colors cursor-pointer bg-transparent border-0"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Year navigation */}
          <div className="flex items-center bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-inner">
            <button 
              onClick={handlePrevYear}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-cyber-cyan rounded-lg transition-colors cursor-pointer bg-transparent border-0"
              title="Previous Year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-14 text-center font-mono font-bold text-[10px] text-slate-700 dark:text-slate-205 select-none">
              {selectedYear}
            </span>
            <button 
              onClick={handleNextYear}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-cyber-cyan rounded-lg transition-colors cursor-pointer bg-transparent border-0"
              title="Next Year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Compact Calendar grid */}
      <div className="max-w-[340px] mx-auto w-full space-y-3">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] font-sans font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest select-none">
          <div>Su</div>
          <div>Mo</div>
          <div>Tu</div>
          <div>We</div>
          <div>Th</div>
          <div>Fr</div>
          <div>Sa</div>
        </div>

        {/* Calendar Grid cells */}
        <div className="grid grid-cols-7 gap-1.5 p-2 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-900 rounded-2xl">
          {monthlyDays.map((day) => {
            const count = heatmapData[day.date] || 0;
            const cellStyles = getCellStyles(day);

            return (
              <div
                key={day.date}
                className={`aspect-square rounded-xl flex items-center justify-center font-sans text-[10px] font-black transition-all duration-300 relative group cursor-pointer ${cellStyles}`}
              >
                <span>{day.dayNum}</span>

                {/* Hover Tooltip */}
                <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 w-40 bg-slate-900 border border-slate-800 text-white font-mono text-[9px] p-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 text-center leading-normal shadow-2xl">
                  <strong>{count} {count === 1 ? 'commit' : 'commits'}</strong>
                  <div className="text-slate-400 mt-0.5">{day.formattedDate}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend indicator bar */}
      <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-500 font-mono mt-1 px-1">
        <span className="italic">Hover over days to view detailed submission counts.</span>
        <div className="flex items-center gap-1.5 select-none">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded bg-slate-500/10 dark:bg-[#121626]/40 border border-slate-200/50 dark:border-slate-850"></div>
          <div className="w-2.5 h-2.5 rounded bg-cyan-500/15 border border-cyan-500/30"></div>
          <div className="w-2.5 h-2.5 rounded bg-cyan-500/30 border border-cyan-500/50"></div>
          <div className="w-2.5 h-2.5 rounded bg-cyan-500/65 border border-cyan-555/75"></div>
          <div className="w-2.5 h-2.5 rounded bg-cyber-cyan border border-cyber-cyan/90"></div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

export default ContributionHeatmap;
