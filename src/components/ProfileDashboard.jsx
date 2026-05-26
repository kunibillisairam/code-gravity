import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import { 
  ChevronLeft, ChevronRight, Loader2, Award, Zap, Flame, Calendar, 
  Code2, User, Globe, BookOpen, 
  MapPin, Check, Plus, X, Edit3, Compass, History, Trophy
} from 'lucide-react';

const Github = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" rx="1" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// Help helper to get level title
const getLevelTitle = (level) => {
  if (level <= 1) return "Code Apprentice";
  if (level === 2) return "Syntax Scholar";
  if (level === 3) return "Algorithm Alchemist";
  if (level === 4) return "Byte Overlord";
  return "Legendary Wizard";
};

// Help helper to get rank title
const getRankTitle = (solvedCount) => {
  if (solvedCount === 0) return "Bronze";
  if (solvedCount <= 2) return "Silver";
  if (solvedCount <= 4) return "Gold";
  return "Platinum";
};

const ProfileDashboard = ({ onBack }) => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    display_name: '',
    college_name: '',
    bio: '',
    github_url: '',
    linkedin_url: '',
    profile_pic: '',
    interested_domains: '',
    skills: ''
  });

  const fetchProfile = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiService.getUserProfile();
      setProfileData(data);
      
      // Initialize edit form
      setEditForm({
        display_name: data.profile.display_name || data.username,
        college_name: data.profile.college_name || '',
        bio: data.profile.bio || '',
        github_url: data.profile.github_url || '',
        linkedin_url: data.profile.linkedin_url || '',
        profile_pic: data.profile.profile_pic || '',
        interested_domains: (data.profile.interested_domains || []).join(', '),
        skills: (data.profile.skills || []).join(', ')
      });
    } catch (err) {
      setError(err.message || 'Failed to retrieve profile data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const payload = {
        display_name: editForm.display_name.trim(),
        college_name: editForm.college_name.trim(),
        bio: editForm.bio.trim(),
        github_url: editForm.github_url.trim(),
        linkedin_url: editForm.linkedin_url.trim(),
        profile_pic: editForm.profile_pic.trim(),
        interested_domains: editForm.interested_domains.split(',').map(s => s.trim()).filter(Boolean),
        skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean)
      };
      
      await apiService.updateUserProfile(payload);
      setShowEditModal(false);
      await fetchProfile(); // refresh data
    } catch (err) {
      alert(err.message || 'Failed to update profile details.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // MONTHLY CALENDAR NAVIGATION STATE
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

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

  // Get count of days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Day index for first day of month (0 = Sun, 1 = Mon)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate standard 42-day calendar grid days
  const generateMonthlyDays = () => {
    const days = [];
    const daysCount = getDaysInMonth(selectedYear, selectedMonth);
    const firstDayIndex = getFirstDayOfMonth(selectedYear, selectedMonth);

    // Padding days from the previous month
    const prevMonthDaysCount = getDaysInMonth(
      selectedMonth === 0 ? selectedYear - 1 : selectedYear,
      selectedMonth === 0 ? 11 : selectedMonth - 1
    );

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
      const prevMon = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const dayNum = prevMonthDaysCount - i;
      const dateString = `${prevYear}-${String(prevMon + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        date: dateString,
        dayNum,
        isCurrentMonth: false,
        formattedDate: new Date(prevYear, prevMon, dayNum).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      });
    }

    // Active month days
    for (let dayNum = 1; dayNum <= daysCount; dayNum++) {
      const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        date: dateString,
        dayNum,
        isCurrentMonth: true,
        formattedDate: new Date(selectedYear, selectedMonth, dayNum).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      });
    }

    // Padding days from the next month to fill grid
    const remainingCells = 42 - days.length;
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
      const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
      const nextMon = selectedMonth === 11 ? 0 : selectedMonth + 1;
      const dateString = `${nextYear}-${String(nextMon + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        date: dateString,
        dayNum,
        isCurrentMonth: false,
        formattedDate: new Date(nextYear, nextMon, dayNum).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      });
    }

    return days;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-[#080a10] text-slate-400">
        <Loader2 className="w-8 h-8 text-cyber-cyan animate-spin" />
        <span className="text-sm font-light">Retrieving user achievements and statistics...</span>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-[#080a10] text-center p-6">
        <div className="p-4 bg-rose-500/10 text-rose-500 rounded-full">
          <X className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-rose-550">Failed to Load Profile</h3>
        <p className="text-sm text-slate-500 max-w-sm">{error || "An unexpected error occurred."}</p>
        <button 
          onClick={fetchProfile}
          className="px-6 py-2.5 bg-cyber-cyan text-space-900 text-xs font-bold rounded-lg uppercase tracking-wider cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const { profile, progress, username } = profileData;

  // Level & XP metrics
  const xp = progress.xp || 0;
  const level = progress.level || 1;
  const levelTitle = getLevelTitle(level);
  const rank = getRankTitle((progress.solved_problems || []).length);
  
  // XP Progress values (500 XP steps)
  const nextLevelXp = level * 500;
  const prevLevelXp = (level - 1) * 500;
  const currentLevelXp = xp - prevLevelXp;
  const xpInsideLevelRatio = Math.min(100, Math.max(0, (currentLevelXp / 500) * 100));

  // Streak metrics
  const dailyStreak = progress.daily_streak || 0;
  const longestStreak = progress.longest_streak || 0;

  // Problem counts
  const solvedCount = (progress.solved_problems || []).length;
  const attemptedCount = (progress.attempted_problems || []).length;
  const successRate = attemptedCount > 0 ? ((solvedCount / attemptedCount) * 100).toFixed(1) : 0;

  // Achievement Badges database
  const badgeDetails = {
    first_success: {
      id: "first_success",
      title: "First Success",
      desc: "Unlock your first Accepted code challenge.",
      icon: <Trophy className="w-6 h-6" />
    },
    speed_demon: {
      id: "speed_demon",
      title: "Speed Demon",
      desc: "Compile and execute code successfully in under 100ms.",
      icon: <Zap className="w-6 h-6" />
    },
    streak_master: {
      id: "streak_master",
      title: "Streak Master",
      desc: "Maintain a consecutive 3-day active coding streak.",
      icon: <Flame className="w-6 h-6" />
    },
    algorithm_alchemist: {
      id: "algorithm_alchemist",
      title: "Algorithm Alchemist",
      desc: "Complete 5 unique programming problems successfully.",
      icon: <Award className="w-6 h-6" />
    }
  };

  const unlockedBadges = progress.badges || [];
  const heatmapData = progress.contribution_heatmap || {};
  const activityLog = (progress.activity_log || []).slice(-5).reverse(); // last 5 actions

  // Generate monthly grid days
  const monthlyDays = generateMonthlyDays();

  // Helper to color heatmap cells premium styling
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
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-12 bg-slate-50 dark:bg-[#080a10] text-slate-800 dark:text-white font-sans transition-colors duration-300 relative">
      
      {/* Dynamic Radial Glow Overlays */}
      <div className="absolute top-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full radial-glow-cyan pointer-events-none z-0 opacity-10 dark:opacity-20"></div>
      <div className="absolute bottom-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full radial-glow-purple pointer-events-none z-0 opacity-10 dark:opacity-20"></div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        
        {/* Header Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e121e] hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white transition-all cursor-pointer shadow-sm"
            title="Return to Explorer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-850 dark:text-white">User Profile</h1>
            <p className="text-xs text-slate-500 font-light">View level scaling, unlocked badges, and daily streaks.</p>
          </div>
        </div>

        {/* Dashboard Grid Row 1 (Profile & Streak / Level Progress cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Card 1: Profile Card */}
          <div className="lg:col-span-1 p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col justify-between relative overflow-hidden">
            {/* Top branded border stripe */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple" />
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {/* Avatar Display */}
                {profile.profile_pic ? (
                  <img 
                    src={profile.profile_pic} 
                    alt={profile.display_name} 
                    className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-800 object-cover shadow-sm shrink-0"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyber-cyan to-cyber-purple flex items-center justify-center text-space-900 font-black text-2xl shadow-md shrink-0 select-none">
                    {(profile.display_name || username).charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="space-y-0.5">
                  <h2 className="text-lg font-black text-slate-850 dark:text-white">{profile.display_name || username}</h2>
                  <span className="text-[10px] font-mono text-cyber-cyan uppercase tracking-wider block">@{username}</span>
                  <div className="inline-block px-2.5 py-0.5 mt-1 bg-cyber-purple/10 border border-cyber-purple/35 text-cyber-purple font-sans font-bold text-[9px] uppercase tracking-wider rounded">
                    {levelTitle}
                  </div>
                </div>
              </div>

              {/* Bio Block */}
              {profile.bio && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                  "{profile.bio}"
                </p>
              )}

              {/* Attributes (College, location, etc.) */}
              <div className="space-y-2 text-xs text-slate-550 dark:text-slate-400">
                {profile.college_name && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{profile.college_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Level {level} Scholar ({rank} Tier)</span>
                </div>
              </div>

              {/* Social Channels */}
              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-850/60">
                {profile.github_url && (
                  <a 
                    href={profile.github_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-850 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {profile.linkedin_url && (
                  <a 
                    href={profile.linkedin_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-850 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {!profile.github_url && !profile.linkedin_url && (
                  <span className="text-[10px] text-slate-400 font-light">No social links configured.</span>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowEditModal(true)}
              className="w-full mt-6 py-2.5 border border-slate-200 dark:border-slate-800 hover:border-cyber-cyan/30 text-slate-655 dark:text-slate-400 hover:text-cyber-cyan text-xs font-bold uppercase rounded-xl transition-all cursor-pointer bg-transparent flex items-center justify-center gap-1.5"
            >
              <Edit3 className="w-4 h-4" />
              <span>Modify Profile</span>
            </button>
          </div>

          {/* Card 2: Level Scaling & Streak counters */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple" />
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
              
              {/* Level XP Progress segment */}
              <div className="md:col-span-3 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-black text-sm uppercase tracking-wider text-slate-850 dark:text-white">Level Progression</h3>
                  <span className="font-mono text-xs text-cyber-cyan font-bold">Lvl {level}</span>
                </div>
                
                {/* Visual Progress ring/bar */}
                <div className="space-y-2">
                  <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-full overflow-hidden relative shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${xpInsideLevelRatio}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-purple shadow-[0_0_8px_rgba(0,214,230,0.4)]"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{xp} XP Accumulation</span>
                    <span>{nextLevelXp - xp} XP to Level {level + 1}</span>
                  </div>
                </div>

                {/* Substats */}
                <div className="grid grid-cols-3 gap-2.5 text-center pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 shadow-inner">
                    <span className="text-[8px] font-sans font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Solved</span>
                    <span className="text-base font-black text-slate-850 dark:text-white mt-1 block">{solvedCount}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 shadow-inner">
                    <span className="text-[8px] font-sans font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Attempted</span>
                    <span className="text-base font-black text-slate-850 dark:text-white mt-1 block">{attemptedCount}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 shadow-inner">
                    <span className="text-[8px] font-sans font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Accuracy</span>
                    <span className="text-base font-black text-cyber-cyan mt-1 block">{successRate}%</span>
                  </div>
                </div>
              </div>

              {/* Streaks Counters segment */}
              <div className="md:col-span-2 space-y-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-850/60 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
                <h3 className="font-sans font-black text-sm uppercase tracking-wider text-slate-850 dark:text-white text-left">Streak Stats</h3>
                
                <div className="flex items-center gap-6 justify-start">
                  {/* Daily streak */}
                  <div className="space-y-1 text-center">
                    <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-500 relative shadow-sm group">
                      <Flame className="w-7 h-7 animate-pulse text-orange-500 fill-current" />
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-orange-500 text-white font-mono font-bold text-[8px] rounded-full">
                        {dailyStreak}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mt-1">Current</span>
                  </div>

                  {/* Longest streak */}
                  <div className="space-y-1 text-center">
                    <div className="w-14 h-14 rounded-full bg-cyber-purple/10 border border-cyber-purple/25 flex items-center justify-center text-cyber-purple relative shadow-sm">
                      <Trophy className="w-7 h-7 text-cyber-purple" />
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-cyber-purple text-white font-mono font-bold text-[8px] rounded-full">
                        {longestStreak}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block mt-1">Record</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Monthly Activity Calendar Section */}
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
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-cyber-cyan rounded-lg transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="w-24 text-center font-sans font-extrabold text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-200 select-none">
                  {MONTH_NAMES[selectedMonth]}
                </span>
                <button 
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-cyber-cyan rounded-lg transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Year navigation */}
              <div className="flex items-center bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-inner">
                <button 
                  onClick={handlePrevYear}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-cyber-cyan rounded-lg transition-colors cursor-pointer"
                  title="Previous Year"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="w-14 text-center font-mono font-bold text-[10px] text-slate-700 dark:text-slate-200 select-none">
                  {selectedYear}
                </span>
                <button 
                  onClick={handleNextYear}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-cyber-cyan rounded-lg transition-colors cursor-pointer"
                  title="Next Year"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Compact Calendar wrapper to limit cell sizes */}
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
                      <div className="text-slate-455 mt-0.5">{day.formattedDate}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend indicator bar */}
          <div className="flex items-center justify-between text-[9px] text-slate-550 dark:text-slate-500 font-mono mt-1 px-1">
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

        {/* Dash Grid Row 2 (Skills, Badges Showcase, & Recent Submissions Timeline) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Col 1: Skills & Recommended */}
          <div className="lg:col-span-1 p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple" />
            
            {/* Skills Segment */}
            <div className="space-y-3">
              <h3 className="font-sans font-black text-sm uppercase tracking-wider text-slate-850 dark:text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyber-cyan" />
                Technical Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-wider text-cyber-cyan bg-cyber-cyan/10 border border-cyber-cyan/20 rounded-lg hover:bg-cyber-cyan/15 hover:border-cyber-cyan/30 transition-all select-none"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-455 font-light italic">No skills registered. Click 'Modify Profile' to add skill badges!</span>
                )}
              </div>
            </div>

            {/* Domains Segment */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-850/60">
              <h3 className="font-sans font-black text-sm uppercase tracking-wider text-slate-850 dark:text-white flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-cyber-purple" />
                Target Domains
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.interested_domains && profile.interested_domains.length > 0 ? (
                  profile.interested_domains.map((dom, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-wider text-cyber-purple bg-cyber-purple/10 border border-cyber-purple/20 rounded-lg hover:bg-cyber-purple/15 hover:border-cyber-purple/30 transition-all select-none"
                    >
                      {dom}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-455 font-light italic">No domains registered.</span>
                )}
              </div>
            </div>

          </div>

          {/* Col 2: Badges Showcase grid */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple" />
            
            <div className="border-b border-slate-100 dark:border-slate-850/60 pb-3 flex items-center justify-between">
              <h3 className="font-sans font-black text-sm uppercase tracking-wider text-slate-850 dark:text-white flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-cyber-cyan" />
                Achievement Room ({unlockedBadges.length} Unlocked)
              </h3>
              <span className="text-[8px] font-sans font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                GAMIFICATION SYSTEM AWARDS
              </span>
            </div>

            {/* Badges Grid list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              {Object.values(badgeDetails).map((badge) => {
                const isUnlocked = unlockedBadges.includes(badge.id);

                return (
                  <div 
                    key={badge.id}
                    className={`p-4 rounded-xl border flex items-center gap-3.5 transition-all select-none ${
                      isUnlocked 
                        ? 'border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/5 shadow-inner' 
                        : 'border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/10 opacity-50 grayscale'
                    }`}
                  >
                    <div className={`p-3 rounded-xl border shrink-0 ${
                      isUnlocked
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-space-900 border-transparent shadow-md'
                        : 'bg-slate-100 dark:bg-slate-900 border-slate-250 dark:border-slate-800 text-slate-400'
                    }`}>
                      {badge.icon}
                    </div>

                    <div className="space-y-0.5">
                      <h4 className={`text-xs font-black font-sans uppercase ${isUnlocked ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                        {badge.title}
                      </h4>
                      <p className="text-[10px] text-slate-455 dark:text-slate-500 font-light leading-relaxed">
                        {badge.desc}
                      </p>
                      {isUnlocked && (
                        <div className="text-[8px] font-mono text-emerald-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Unlocked
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* Dashboard Row 3: Recent Activity Logs */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple" />
          
          <h3 className="font-sans font-black text-sm uppercase tracking-wider text-slate-850 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850/60 pb-3">
            <History className="w-4 h-4 text-cyber-cyan" />
            Recent Activity Log
          </h3>

          {/* Activity Timeline */}
          {activityLog.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-light">
              No recent progress recorded. Submit code to populate your feed!
            </div>
          ) : (
            <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 py-2 space-y-6">
              {activityLog.map((log, idx) => {
                const dateStr = new Date(log.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={idx} className="relative pl-6">
                    {/* Circle timeline bullet */}
                    <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border ${
                      log.type === 'level_up' 
                        ? 'bg-cyber-purple border-cyber-purple' 
                        : (log.type === 'badge' 
                            ? 'bg-cyber-cyan border-cyber-cyan' 
                            : 'bg-emerald-500 border-emerald-500')
                    }`} />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 select-none">
                      <div className="font-bold text-xs text-slate-750 dark:text-slate-250">
                        {log.description}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* EDIT PROFILE SLIDING MODAL OVERLAY */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 30, opacity: 0 }}
              className="w-full max-w-xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Decorative top stripe */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple" />
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4 shrink-0">
                <h3 className="font-sans font-black text-base text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-cyber-cyan" />
                  Modify Profile Details
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form viewport */}
              <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto py-5 px-1 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Display Name</label>
                    <input
                      type="text"
                      name="display_name"
                      required
                      value={editForm.display_name}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-cyber-cyan"
                      placeholder="e.g. sairam"
                    />
                  </div>

                  {/* College field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">College Name</label>
                    <input
                      type="text"
                      name="college_name"
                      value={editForm.college_name}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-cyber-cyan"
                      placeholder="e.g. Stanford University"
                    />
                  </div>
                </div>

                {/* Bio field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Bio Description</label>
                  <textarea
                    name="bio"
                    value={editForm.bio}
                    onChange={handleEditChange}
                    maxLength={180}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-cyber-cyan resize-none h-20"
                    placeholder="Describe your coding journey in 180 characters..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* GitHub link */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1"><Github className="w-3.5 h-3.5" /> GitHub Profile Link</label>
                    <input
                      type="url"
                      name="github_url"
                      value={editForm.github_url}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-cyber-cyan"
                      placeholder="e.g. https://github.com/uname"
                    />
                  </div>

                  {/* LinkedIn link */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1"><Linkedin className="w-3.5 h-3.5" /> LinkedIn Profile Link</label>
                    <input
                      type="url"
                      name="linkedin_url"
                      value={editForm.linkedin_url}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-cyber-cyan"
                      placeholder="e.g. https://linkedin.com/in/uname"
                    />
                  </div>
                </div>

                {/* Profile Pic URL field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Profile Avatar Image Link (URL)</label>
                  <input
                    type="url"
                    name="profile_pic"
                    value={editForm.profile_pic}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-cyber-cyan"
                    placeholder="e.g. https://images.com/myphoto.jpg"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Skills tags */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Skills (Comma Separated)</label>
                    <input
                      type="text"
                      name="skills"
                      value={editForm.skills}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-cyber-cyan"
                      placeholder="e.g. Python, C++, React"
                    />
                  </div>

                  {/* Domains tags */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Domains (Comma Separated)</label>
                    <input
                      type="text"
                      name="interested_domains"
                      value={editForm.interested_domains}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-cyber-cyan"
                      placeholder="e.g. Web Dev, Machine Learning"
                    />
                  </div>
                </div>

                {/* Footer submit */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-850/80 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-850 hover:bg-slate-250 dark:hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-5 py-2 bg-gradient-to-r from-cyber-cyan to-cyber-blue hover:from-[#00d6e6] hover:to-[#0055ff] text-space-900 font-extrabold text-xs tracking-wider uppercase rounded-lg transition-colors cursor-pointer disabled:opacity-75 flex items-center gap-1.5"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save Profile</>}
                  </button>
                </div>

              </form>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ProfileDashboard;
