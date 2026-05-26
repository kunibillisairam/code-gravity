import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Search, Award, Zap, ShieldAlert } from 'lucide-react';

const LEADERBOARD_DATA = [
  { rank: 1, name: 'Alex Kepler', avatar: 'AK', faction: 'Singularity', xp: 12450, solved: 142, badge: 'Grandmaster' },
  { rank: 2, name: 'Sora Tanaka', avatar: 'ST', faction: 'Orbital', xp: 11920, solved: 135, badge: 'Speed Demon' },
  { rank: 3, name: 'Elena Rostova', avatar: 'ER', faction: 'Quark', xp: 11200, solved: 128, badge: 'Algorithmic' },
  { rank: 4, name: 'Marcus Vance', avatar: 'MV', faction: 'Singularity', xp: 9840, solved: 110, badge: 'Shaman' },
  { rank: 5, name: 'Anya Chen', avatar: 'AC', faction: 'Orbital', xp: 9550, solved: 104, badge: 'Hunter' },
  { rank: 6, name: 'Zayn Malik', avatar: 'ZM', faction: 'Quark', xp: 8900, solved: 95, badge: 'Lord' }
];

const Leaderboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('global');

  // Filter leaders by search query
  const filteredLeaders = useMemo(() => {
    return LEADERBOARD_DATA.filter((leader) => {
      const matchesSearch = leader.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            leader.faction.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeTab === 'global') return matchesSearch;
      return matchesSearch && leader.faction.toLowerCase() === activeTab.toLowerCase();
    });
  }, [searchTerm, activeTab]);

  return (
    <section id="leaderboard" className="relative py-24 px-6 md:px-12 bg-slate-50 dark:bg-[#080a10] border-t border-slate-200 dark:border-slate-900 transition-colors duration-300 overflow-hidden">
      
      {/* Background blurs */}
      <div className="absolute top-[20%] left-[-10%] w-[350px] h-[350px] bg-cyber-cyan/5 rounded-full blur-3xl pointer-events-none opacity-30"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[350px] h-[350px] bg-cyber-purple/5 rounded-full blur-3xl pointer-events-none opacity-30"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-cyber-magenta font-sans text-xs tracking-wider uppercase font-bold"
          >
            <Trophy className="w-3.5 h-3.5 text-cyber-magenta animate-pulse" />
            Hall of Legends
          </motion.div>

          <h2 className="font-sans text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Leaderboard Orbit
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-light max-w-md mx-auto">
            Rankings calculated dynamically in real-time based on challenge difficulty, submission speeds, and streak multipliers.
          </p>
        </div>

        {/* Toolbar: Tabs & Search */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 w-full">
          {/* Faction tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg">
            {['global', 'singularity', 'orbital', 'quark'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-sans text-[10px] tracking-wider uppercase rounded font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-white border border-slate-300 text-cyber-cyan dark:bg-[#121626] dark:border-slate-850' 
                    : 'text-slate-500 hover:text-slate-850 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-550" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search active legends..."
              className="w-full bg-white dark:bg-[#0e121e] border border-slate-300 dark:border-slate-800 rounded-lg pl-11 pr-4 py-2.5 text-xs outline-none text-slate-800 dark:text-white placeholder-slate-550 focus:border-cyber-cyan/40 transition-colors"
            />
          </div>
        </div>

        {/* Dynamic Leaderboard Table */}
        <div className="bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-md dark:shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              
              {/* Table Header */}
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 font-sans text-[10px] tracking-widest text-slate-500 bg-slate-50 dark:bg-[#0b0e17] uppercase font-bold">
                  <th className="py-4 px-6 text-center w-24">Rank</th>
                  <th className="py-4 px-6">Developer</th>
                  <th className="py-4 px-6">Faction</th>
                  <th className="py-4 px-6 text-center">Solved</th>
                  <th className="py-4 px-6 text-center">Achievements</th>
                  <th className="py-4 px-6 text-right w-36">Quantum XP</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredLeaders.length > 0 ? (
                    filteredLeaders.map((leader) => (
                      <motion.tr
                        key={leader.rank}
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="border-b border-slate-150 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-[#111626] transition-colors"
                      >
                        {/* Rank Badge */}
                        <td className="py-4.5 px-6 text-center">
                          <div className="flex items-center justify-center">
                            {leader.rank === 1 ? (
                              <span className="w-6 h-6 rounded bg-amber-100/50 border border-amber-250/20 text-amber-600 dark:bg-amber-400/10 dark:border-amber-400/30 dark:text-amber-400 font-sans font-bold text-xs flex items-center justify-center">
                                1
                              </span>
                            ) : leader.rank === 2 ? (
                              <span className="w-6 h-6 rounded bg-slate-100/50 border border-slate-250/20 text-slate-500 dark:bg-slate-300/10 dark:border-slate-300/30 dark:text-slate-350 font-sans font-bold text-xs flex items-center justify-center">
                                2
                              </span>
                            ) : leader.rank === 3 ? (
                              <span className="w-6 h-6 rounded bg-amber-700/10 border border-amber-700/30 text-amber-650 dark:bg-amber-700/10 dark:border-amber-700/30 dark:text-amber-600 font-sans font-bold text-xs flex items-center justify-center">
                                3
                              </span>
                            ) : (
                              <span className="font-mono text-slate-400 dark:text-slate-600 text-xs font-semibold">{leader.rank}</span>
                            )}
                          </div>
                        </td>

                        {/* Developer Name & Avatar */}
                        <td className="py-4.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded flex items-center justify-center font-sans font-extrabold border ${
                              leader.rank === 1 
                                ? 'bg-amber-400/10 border-amber-450/20 text-amber-500 dark:text-amber-400' 
                                : 'bg-slate-100 dark:bg-[#080a10] border-slate-200 dark:border-slate-800 text-cyber-cyan shadow-sm'
                            }`}>
                              {leader.avatar}
                            </div>
                            <span className="font-sans font-bold text-xs text-slate-850 dark:text-white">
                              {leader.name}
                            </span>
                          </div>
                        </td>

                        {/* Faction */}
                        <td className="py-4.5 px-6">
                          <span className={`text-[9px] font-sans font-bold uppercase px-2.5 py-0.5 rounded ${
                            leader.faction === 'Singularity'
                              ? 'text-cyber-purple bg-cyber-purple/10 border border-cyber-purple/20'
                              : leader.faction === 'Orbital'
                              ? 'text-cyber-cyan bg-cyber-cyan/10 border border-cyber-cyan/20'
                              : 'text-cyber-magenta bg-cyber-magenta/10 border border-cyber-magenta/20'
                          }`}>
                            {leader.faction}
                          </span>
                        </td>

                        {/* Solved Count */}
                        <td className="py-4.5 px-6 text-center font-mono text-xs text-slate-605 dark:text-slate-300">
                          {leader.solved}
                        </td>

                        {/* Active Badge */}
                        <td className="py-4.5 px-6 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-450 dark:text-slate-400">
                            <Award className="w-3.5 h-3.5 text-cyber-cyan shrink-0" />
                            <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                              {leader.badge}
                            </span>
                          </div>
                        </td>

                        {/* XP */}
                        <td className="py-4.5 px-6 text-right">
                          <span className="font-sans font-extrabold text-xs text-cyber-cyan flex items-center justify-end gap-1">
                            <Zap className="w-3.5 h-3.5 text-cyber-cyan fill-current animate-pulse shrink-0" />
                            {leader.xp.toLocaleString()}
                          </span>
                        </td>

                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center bg-slate-50 dark:bg-[#0e121e]">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <ShieldAlert className="w-8 h-8 text-slate-400 dark:text-slate-650" />
                          <h4 className="font-sans font-bold text-xs text-slate-805 dark:text-white">No active legends found</h4>
                          <span className="text-slate-400 dark:text-slate-500 text-xs font-light">Try adjusting your search criteria</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>

            </table>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Leaderboard;
