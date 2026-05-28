import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import { 
  ChevronLeft, Loader2, Award, Zap, Flame, Calendar, 
  Code2, User, Globe, BookOpen, 
  MapPin, Check, Plus, X, MessageSquare, UserPlus, UserMinus,
  Compass, History, Trophy
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

// Level title helper
const getLevelTitle = (level) => {
  if (level <= 1) return "Code Apprentice";
  if (level === 2) return "Syntax Scholar";
  if (level === 3) return "Algorithm Alchemist";
  if (level === 4) return "Byte Overlord";
  return "Legendary Wizard";
};

// Rank title helper
const getRankTitle = (solvedCount) => {
  if (solvedCount === 0) return "Bronze";
  if (solvedCount <= 2) return "Silver";
  if (solvedCount <= 4) return "Gold";
  return "Platinum";
};

const PublicProfile = ({ username, onBack, user, onLoginClick }) => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageSendState, setMessageSendState] = useState('idle'); // 'idle' | 'sending' | 'success'
  const [toastMessage, setToastMessage] = useState('');

  // Calendar State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const fetchPublicProfile = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiService.getPublicProfile(username);
      setProfileData(data);
      setIsFollowing(data.is_following);
      setFollowersCount(data.followers_count);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to scan the gravity grid for this user profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      fetchPublicProfile();
    }
  }, [username]);

  // Reset message states on modal state toggle
  useEffect(() => {
    if (showMessageModal) {
      setMessageText('');
      setMessageSendState('idle');
    }
  }, [showMessageModal]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setMessageSendState('sending');
    setTimeout(() => {
      setMessageSendState('success');
    }, 1200);
  };

  const handleFollowToggle = async () => {
    if (!user) {
      if (onLoginClick) onLoginClick();
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await apiService.toggleFollowUser(username);
      setIsFollowing(res.status === 'followed');
      setFollowersCount(res.followers_count);
    } catch (err) {
      alert(err.message || 'Gravitational alignment failed. Could not alter follow status.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Calendar calculations
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

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const generateMonthlyDays = () => {
    const days = [];
    const daysCount = getDaysInMonth(selectedYear, selectedMonth);
    const firstDayIndex = getFirstDayOfMonth(selectedYear, selectedMonth);

    // Prev Month padding
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

    // Current Month days
    for (let dayNum = 1; dayNum <= daysCount; dayNum++) {
      const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        date: dateString,
        dayNum,
        isCurrentMonth: true,
        formattedDate: new Date(selectedYear, selectedMonth, dayNum).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      });
    }

    // Next Month padding
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
        <span className="text-sm font-light">Decrypting public telemetry matrices...</span>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-[#080a10] text-center p-6">
        <div className="p-4 bg-rose-500/10 text-rose-500 rounded-full">
          <X className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-rose-550">Target User Offline</h3>
        <p className="text-sm text-slate-500 max-w-sm">{error || "Signal could not establish link to target orbital core."}</p>
        <div className="flex gap-4">
          <button 
            onClick={onBack}
            className="px-6 py-2.5 bg-slate-200 dark:bg-slate-900 border border-slate-350 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg uppercase tracking-wider cursor-pointer"
          >
            Go Back
          </button>
          <button 
            onClick={fetchPublicProfile}
            className="px-6 py-2.5 bg-cyber-cyan text-space-900 text-xs font-bold rounded-lg uppercase tracking-wider cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { profile, progress, faction, strongest_topics, following_count } = profileData;

  // Level XP progress calculation
  const xp = progress.xp || 0;
  const level = progress.level || 1;
  const levelTitle = getLevelTitle(level);
  const rank = getRankTitle((progress.solved_problems || []).length);
  const nextLevelXp = level * 500;
  const prevLevelXp = (level - 1) * 500;
  const currentLevelXp = xp - prevLevelXp;
  const xpInsideLevelRatio = Math.min(100, Math.max(0, (currentLevelXp / 500) * 100));

  // Streaks
  const dailyStreak = progress.daily_streak || 0;
  const longestStreak = progress.longest_streak || 0;
  const solvedCount = (progress.solved_problems || []).length;
  const attemptedCount = (progress.attempted_problems || []).length;
  const successRate = attemptedCount > 0 ? ((solvedCount / attemptedCount) * 100).toFixed(1) : 0;

  // Badges database
  const badgeDetails = {
    first_success: {
      id: "first_success",
      title: "First Success",
      desc: "Unlock your first Accepted code challenge.",
      icon: <Trophy className="w-5 h-5" />
    },
    speed_demon: {
      id: "speed_demon",
      title: "Speed Demon",
      desc: "Compile and execute code successfully in under 100ms.",
      icon: <Zap className="w-5 h-5" />
    },
    streak_master: {
      id: "streak_master",
      title: "Streak Master",
      desc: "Maintain a consecutive 3-day active coding streak.",
      icon: <Flame className="w-5 h-5" />
    },
    algorithm_alchemist: {
      id: "algorithm_alchemist",
      title: "Algorithm Alchemist",
      desc: "Complete 5 unique programming problems successfully.",
      icon: <Award className="w-5 h-5" />
    }
  };

  const unlockedBadges = progress.badges || [];
  const heatmapData = progress.contribution_heatmap || {};
  const activityLog = (progress.activity_log || []).slice(-5).reverse();
  const monthlyDays = generateMonthlyDays();

  // Legend cell rendering colors
  const getCellStyles = (day) => {
    const count = heatmapData[day.date] || 0;
    
    if (!day.isCurrentMonth) {
      if (count === 0) return 'bg-slate-105/20 dark:bg-slate-900/10 border border-slate-200/5 dark:border-slate-850/5 text-slate-400/10 opacity-20 cursor-default pointer-events-none';
      return 'bg-cyan-500/5 border border-cyan-500/10 text-cyan-500/10 opacity-25';
    }

    if (count === 0) {
      return 'bg-slate-50 dark:bg-[#121626]/30 border border-slate-200/40 dark:border-slate-850 text-slate-405 dark:text-slate-400 hover:border-cyber-cyan/30 hover:bg-slate-100 dark:hover:bg-[#121626]/80';
    }
    if (count === 1) {
      return 'bg-cyan-500/15 border border-cyan-500/25 text-cyan-600 dark:text-cyan-400 hover:border-cyan-400/50 shadow-[0_0_4px_rgba(0,180,255,0.03)]';
    }
    if (count === 2) {
      return 'bg-cyan-500/25 border border-cyan-500/45 text-cyan-650 dark:text-cyan-300 hover:border-cyan-300/60 shadow-[0_0_6px_rgba(0,180,255,0.08)]';
    }
    if (count === 3) {
      return 'bg-cyan-500/55 border border-cyan-500/65 text-white dark:text-space-900 dark:font-bold hover:border-cyan-200 shadow-[0_0_10px_rgba(0,214,230,0.15)]';
    }
    return 'bg-cyber-cyan border border-cyber-cyan/80 text-space-900 font-extrabold shadow-[0_0_12px_rgba(0,240,255,0.22)] hover:scale-[1.03]';
  };

  // Faction design colors
  const getFactionColors = () => {
    if (faction === 'Orbital') {
      return {
        text: 'text-cyber-cyan',
        border: 'border-cyber-cyan/30',
        bg: 'bg-cyber-cyan/10',
        glow: 'shadow-[0_0_15px_rgba(0,240,255,0.15)]',
        solid: 'bg-cyber-cyan'
      };
    } else if (faction === 'Quark') {
      return {
        text: 'text-cyber-magenta',
        border: 'border-cyber-magenta/30',
        bg: 'bg-cyber-magenta/10',
        glow: 'shadow-[0_0_15px_rgba(255,0,128,0.15)]',
        solid: 'bg-cyber-magenta'
      };
    } else {
      return {
        text: 'text-cyber-purple',
        border: 'border-cyber-purple/30',
        bg: 'bg-cyber-purple/10',
        glow: 'shadow-[0_0_15px_rgba(157,78,221,0.15)]',
        solid: 'bg-cyber-purple'
      };
    }
  };

  const fColors = getFactionColors();
  const isOwnProfile = user && user.toLowerCase() === username.toLowerCase();

  return (
    <section className="min-h-screen pt-24 pb-16 px-4 md:px-12 bg-slate-50 dark:bg-[#080a10] text-slate-800 dark:text-white font-sans transition-colors duration-300 relative select-none">
      
      {/* Background blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full radial-glow-cyan pointer-events-none z-0 opacity-15 dark:opacity-25"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full radial-glow-purple pointer-events-none z-0 opacity-15 dark:opacity-25"></div>
      <div className="absolute inset-0 tech-grid opacity-5 dark:opacity-10 pointer-events-none z-0"></div>

      <div className="max-w-5xl mx-auto relative z-10 space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e121e] hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-405 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-sm shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Developer Node</span>
              <span className={`text-[10px] font-sans font-bold uppercase tracking-widest px-2.5 py-0.5 rounded ${fColors.bg} ${fColors.text} border ${fColors.border}`}>
                {faction} Faction
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-light">Orbit standings, completed milestones, and tech grid statistics.</p>
          </div>
        </div>

        {/* PROFILE HEADER CARD */}
        <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar Section */}
            {profile.profile_pic ? (
              <img 
                src={profile.profile_pic} 
                alt={profile.display_name} 
                className={`w-20 h-20 rounded-2xl object-cover border border-slate-250 dark:border-slate-800 shadow-md ${fColors.glow}`}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r from-cyber-cyan to-cyber-purple flex items-center justify-center text-space-900 font-black text-3xl shadow-lg shrink-0 ${fColors.glow}`}>
                {(profile.display_name || username).charAt(0).toUpperCase()}
              </div>
            )}

            {/* Profile Info */}
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {profile.display_name || username}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="font-mono text-cyber-cyan font-bold">@{username}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 font-light flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {profile.college_name || "Independent Orbit"}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-sans font-bold text-[9px] uppercase tracking-wider border border-slate-200 dark:border-slate-800">
                  Level {level}
                </span>
                <span className="px-2 py-0.5 rounded bg-cyber-purple/10 text-cyber-purple border border-cyber-purple/20 font-sans font-bold text-[9px] uppercase tracking-wider">
                  {levelTitle}
                </span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS (FOLLOW / MESSAGE) */}
          {!isOwnProfile && (
            <div className="flex items-center gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-850">
              <button
                onClick={handleFollowToggle}
                disabled={isActionLoading}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border ${
                  isFollowing
                    ? 'bg-transparent border-rose-500/40 hover:border-rose-500/80 text-rose-505 dark:text-rose-400 hover:bg-rose-500/5'
                    : 'bg-cyber-cyan hover:bg-cyan-400 text-space-900 border-transparent shadow-md hover:scale-[1.02]'
                }`}
              >
                {isActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    <span>Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Follow</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowMessageModal(true)}
                className="p-3 bg-white dark:bg-[#121626] border border-slate-200 dark:border-slate-800 hover:border-cyber-cyan/45 text-slate-500 dark:text-cyber-cyan rounded-xl transition-all cursor-pointer hover:scale-[1.02] shadow-sm"
                title="Establish Neural Transmission"
              >
                <MessageSquare className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>

        {/* GRID STRUCTURE: COLUMN ONE (METADATA) & COLUMN TWO (PROGRESS DETAIL) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* LEFT METADATA COLUMN */}
          <div className="lg:col-span-1 space-y-6 flex flex-col justify-start">
            
            {/* Bio & Social Box */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm space-y-4 relative overflow-hidden flex-1">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan to-cyber-blue" />
              <h3 className="font-sans font-black text-xs uppercase tracking-widest text-slate-905 dark:text-white">Developer Bio</h3>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 font-light leading-relaxed italic">
                {profile.bio ? `"${profile.bio}"` : '"This developer operates silently, traversing gravity tracks without transmitting a core logs broadcast."'}
              </p>

              {/* Social Channels */}
              <div className="flex items-center gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-850/60">
                {profile.github_url && (
                  <a 
                    href={profile.github_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-550 hover:text-cyber-cyan hover:border-cyber-cyan/30 transition-colors cursor-pointer"
                  >
                    <Github className="w-4.5 h-4.5" />
                  </a>
                )}
                {profile.linkedin_url && (
                  <a 
                    href={profile.linkedin_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-550 hover:text-cyber-cyan hover:border-cyber-cyan/30 transition-colors cursor-pointer"
                  >
                    <Linkedin className="w-4.5 h-4.5" />
                  </a>
                )}
                {!profile.github_url && !profile.linkedin_url && (
                  <span className="text-[10px] text-slate-400 font-light italic">No social links linked.</span>
                )}
              </div>
            </div>

            {/* Faction Pills, Target Domains & Skills Box */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm space-y-5 relative overflow-hidden flex-1">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-blue to-cyber-purple" />
              
              {/* Domains */}
              <div className="space-y-2">
                <h3 className="font-sans font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-cyber-cyan" />
                  Target Domains
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interested_domains && profile.interested_domains.length > 0 ? (
                    profile.interested_domains.map((dom, idx) => (
                      <span 
                        key={idx}
                        className="px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-wider text-cyber-purple bg-cyber-purple/10 border border-cyber-purple/20 rounded-lg"
                      >
                        {dom}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 font-light italic">No domains declared.</span>
                  )}
                </div>
              </div>

              {/* Technical Skills */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-850/60">
                <h3 className="font-sans font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-cyber-cyan" />
                  Technical Stack
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill, idx) => (
                      <span 
                        key={idx}
                        className="px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-wider text-cyber-cyan bg-cyber-cyan/10 border border-cyber-cyan/20 rounded-lg"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-405 font-light italic">No tags listed.</span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* MAIN GRID BLOCK: DETAILED PERFORMANCE STATISTICS */}
          <div className="lg:col-span-2 space-y-6 flex flex-col justify-start">
            
            {/* Quick Metrics Dashboard Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col items-center text-center">
                <span className="text-[8px] font-sans font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">XP Points</span>
                <span className="text-xl font-black text-cyber-cyan mt-1 select-all">{xp.toLocaleString()}</span>
              </div>
              
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col items-center text-center">
                <span className="text-[8px] font-sans font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Rank Tier</span>
                <span className="text-xl font-black text-cyber-purple mt-1 uppercase">{rank}</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col items-center text-center">
                <span className="text-[8px] font-sans font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Followers</span>
                <span className="text-xl font-black text-slate-805 dark:text-white mt-1">{followersCount}</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col items-center text-center">
                <span className="text-[8px] font-sans font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Following</span>
                <span className="text-xl font-black text-slate-805 dark:text-white mt-1">{following_count}</span>
              </div>
            </div>

            {/* Level progression cards */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-black text-xs uppercase tracking-wider text-slate-805 dark:text-white">Level Progression</h3>
                  <span className="font-mono text-xs text-cyber-cyan font-extrabold">Lvl {level}</span>
                </div>
                
                {/* Visual Progress ring/bar */}
                <div className="space-y-2">
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full overflow-hidden relative shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${xpInsideLevelRatio}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-purple shadow-[0_0_8px_rgba(0,214,230,0.3)]"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-455">
                    <span>{xp} Total XP</span>
                    <span>{nextLevelXp - xp} XP to Level {level + 1}</span>
                  </div>
                </div>

                {/* Substats */}
                <div className="grid grid-cols-3 gap-2.5 text-center pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-855 shadow-inner">
                    <span className="text-[7.5px] font-sans font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block">Solved</span>
                    <span className="text-sm font-black text-slate-850 dark:text-white mt-1 block">{solvedCount}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-855 shadow-inner">
                    <span className="text-[7.5px] font-sans font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block">Attempted</span>
                    <span className="text-sm font-black text-slate-850 dark:text-white mt-1 block">{attemptedCount}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-855 shadow-inner">
                    <span className="text-[7.5px] font-sans font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block">Accuracy</span>
                    <span className="text-sm font-black text-cyber-cyan mt-1 block">{successRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strongest Topics & Streaks grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Strongest Topics */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="font-sans font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white">Strongest Topics</h3>
                  <p className="text-[10px] text-slate-500 font-light">Dynamically measured based on execution successes inside curriculum sectors.</p>
                  
                  <div className="flex flex-col gap-2 pt-1.5">
                    {strongest_topics && strongest_topics.length > 0 ? (
                      strongest_topics.map((top, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-805">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="text-xs font-bold font-sans text-slate-700 dark:text-slate-300">{top}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 font-light italic py-2">No topic evaluations recorded yet.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Streaks Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm space-y-4 flex flex-col justify-between">
                <h3 className="font-sans font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white">Streak telemetry</h3>
                
                <div className="flex items-center gap-6 justify-center flex-1">
                  <div className="space-y-1 text-center">
                    <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-500 relative shadow-sm">
                      <Flame className="w-7 h-7 animate-pulse text-orange-505 fill-current" />
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-orange-500 text-white font-mono font-bold text-[8px] rounded-full">
                        {dailyStreak}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mt-1">Current Streak</span>
                  </div>

                  <div className="space-y-1 text-center">
                    <div className="w-14 h-14 rounded-full bg-cyber-purple/10 border border-cyber-purple/25 flex items-center justify-center text-cyber-purple relative shadow-sm">
                      <Trophy className="w-7 h-7 text-cyber-purple" />
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-cyber-purple text-white font-mono font-bold text-[8px] rounded-full">
                        {longestStreak}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mt-1">Orbit Record</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* MONTHLY ACTIVITY Heatmap GRID */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-850/60 pb-4">
            <h3 className="font-sans font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-cyber-cyan" />
              Developer Activity Grid
            </h3>
            
            {/* Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-inner">
                <button 
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-cyber-cyan rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="w-24 text-center font-sans font-extrabold text-[9px] uppercase tracking-wider text-slate-700 dark:text-slate-205 select-none">
                  {MONTH_NAMES[selectedMonth]}
                </span>
                <button 
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-cyber-cyan rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
                </button>
              </div>

              <div className="flex items-center bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-inner">
                <button 
                  onClick={handlePrevYear}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-cyber-cyan rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="w-12 text-center font-mono font-bold text-[9px] text-slate-700 dark:text-slate-205 select-none">
                  {selectedYear}
                </span>
                <button 
                  onClick={handleNextYear}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-cyber-cyan rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid Layout scaled very small */}
          <div className="max-w-[300px] mx-auto w-full space-y-2">
            <div className="grid grid-cols-7 gap-1 text-center text-[8px] font-sans font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest select-none">
              <div>Su</div>
              <div>Mo</div>
              <div>Tu</div>
              <div>We</div>
              <div>Th</div>
              <div>Fr</div>
              <div>Sa</div>
            </div>

            <div className="grid grid-cols-7 gap-1 p-1.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-900 rounded-xl">
              {monthlyDays.map((day) => {
                const count = heatmapData[day.date] || 0;
                const cellStyles = getCellStyles(day);

                return (
                  <div
                    key={day.date}
                    className={`aspect-square rounded-lg flex items-center justify-center font-sans text-[9px] font-bold transition-all duration-300 relative group cursor-pointer ${cellStyles}`}
                  >
                    <span>{day.dayNum}</span>

                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-32 bg-slate-900 border border-slate-800 text-white font-mono text-[8px] p-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 text-center leading-normal shadow-xl">
                      <strong>{count} {count === 1 ? 'solution' : 'solutions'}</strong>
                      <div className="text-slate-455 mt-0.5">{day.formattedDate}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ACHIEVEMENTS GRID */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple" />
          
          <div className="border-b border-slate-100 dark:border-slate-850/60 pb-3 flex items-center justify-between">
            <h3 className="font-sans font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-cyber-cyan" />
              Achievements Room ({unlockedBadges.length} unlocked)
            </h3>
            <span className="text-[7px] font-mono font-extrabold text-slate-400 uppercase tracking-widest">System Awards</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.values(badgeDetails).map((badge) => {
              const isUnlocked = unlockedBadges.includes(badge.id);

              return (
                <div 
                  key={badge.id}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                    isUnlocked 
                      ? 'border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/5 shadow-inner' 
                      : 'border-slate-200 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-950/5 opacity-40 grayscale'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border shrink-0 ${
                    isUnlocked
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-space-900 border-transparent shadow-md'
                      : 'bg-slate-105 dark:bg-slate-900 border-slate-250 dark:border-slate-800 text-slate-400'
                  }`}>
                    {badge.icon}
                  </div>

                  <div className="space-y-0.5">
                    <h4 className={`text-[10px] font-black font-sans uppercase ${isUnlocked ? 'text-slate-850 dark:text-white' : 'text-slate-500 dark:text-slate-455'}`}>
                      {badge.title}
                    </h4>
                    <p className="text-[9px] text-slate-500 dark:text-slate-500 font-light leading-normal">
                      {badge.desc}
                    </p>
                    {isUnlocked && (
                      <div className="text-[7.5px] font-mono text-emerald-500 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Unlocked
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TIMELINE ACTIVITIES */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple" />
          
          <h3 className="font-sans font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850/60 pb-3">
            <History className="w-4 h-4 text-cyber-cyan" />
            Orbit Activity Feed
          </h3>

          {activityLog.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs font-light">
              No transmission logs recorded in this quadrant.
            </div>
          ) : (
            <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 py-1 space-y-5">
              {activityLog.map((log, idx) => {
                const dateStr = new Date(log.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={idx} className="relative pl-6">
                    <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border ${
                      log.type === 'level_up' 
                        ? 'bg-cyber-purple border-cyber-purple shadow-[0_0_6px_rgba(157,78,221,0.5)]' 
                        : (log.type === 'badge' 
                            ? 'bg-cyber-cyan border-cyber-cyan shadow-[0_0_6px_rgba(0,240,255,0.5)]' 
                            : 'bg-emerald-500 border-emerald-500')
                    }`} />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-250">
                        {log.description}
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
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

      {/* DYNAMIC TELEMETRY MESSAGE MODAL */}
      <AnimatePresence>
        {showMessageModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-full max-w-md bg-white dark:bg-[#0e121e] border border-slate-250 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyber-cyan to-cyber-purple" />
              
              <button 
                onClick={() => setShowMessageModal(false)}
                className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-xl hover:border-rose-500/40 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {messageSendState === 'idle' && (
                <form onSubmit={handleSendMessage} className="space-y-4 pt-4 text-center">
                  <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-cyber-cyan ${fColors.bg} border ${fColors.border} ${fColors.glow}`}>
                    <MessageSquare className="w-6 h-6 text-cyber-cyan animate-pulse" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-sans font-black text-base uppercase tracking-widest text-slate-905 dark:text-white">
                      Direct Transmission
                    </h3>
                    <p className="text-xs text-slate-505 dark:text-slate-400 font-light leading-relaxed">
                      Compose encrypted telepathic payload for: <span className="font-mono font-bold text-cyber-cyan">@{username}</span>
                    </p>
                  </div>

                  <div className="text-left space-y-1.5">
                    <label className="text-[9px] font-sans font-black uppercase text-slate-405 tracking-wider">Secure Signal Message</label>
                    <textarea
                      required
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Compose neural packet transmission details..."
                      className="w-full bg-slate-50 dark:bg-slate-900/65 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-800 dark:text-white outline-none focus:border-cyber-cyan/40 h-28 resize-none leading-relaxed font-sans"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-955/40 border border-slate-150 dark:border-slate-850 text-left font-mono text-[9px] leading-relaxed text-slate-500 dark:text-slate-450 relative flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-pulse" />
                    <span>Neural P2P signal aligned. Bandwidth secured.</span>
                  </div>

                  <button 
                    type="submit"
                    disabled={!messageText.trim()}
                    className="w-full py-3 bg-cyber-cyan hover:bg-cyan-400 text-space-900 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
                  >
                    Transmit Signal
                  </button>
                </form>
              )}

              {messageSendState === 'sending' && (
                <div className="space-y-6 text-center pt-8 pb-4">
                  <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-cyber-cyan/15 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-cyber-cyan border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                    <MessageSquare className="w-6 h-6 text-cyber-cyan animate-bounce" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <h4 className="font-sans font-black text-sm uppercase tracking-wider text-slate-800 dark:text-white">Broadcasting Signal...</h4>
                    <p className="text-[10px] text-slate-450 font-mono">Modulating quantum frequency to target receiver terminal</p>
                  </div>
                </div>
              )}

              {messageSendState === 'success' && (
                <div className="space-y-5 text-center pt-6">
                  <div className="mx-auto w-14 h-14 rounded-full bg-emerald-555/10 border border-emerald-500/25 flex items-center justify-center text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <Check className="w-8 h-8 text-emerald-500 stroke-[3px]" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-sans font-black text-base uppercase tracking-widest text-emerald-505 dark:text-emerald-450">
                      Message Sent!
                    </h3>
                    <p className="text-xs text-slate-505 dark:text-slate-400 font-light leading-relaxed px-2">
                      Your direct telepathic transmission has successfully bridged orbits and logged in <span className="font-mono font-bold text-cyber-cyan">@{username}</span>'s incoming neural inbox!
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-left font-mono text-[9px] leading-relaxed text-emerald-600 dark:text-emerald-450">
                    <div className="font-bold uppercase tracking-wider mb-0.5">&gt; Quantum Receipt:</div>
                    Signal delivered successfully over Gravity Hub channel.
                  </div>

                  <button 
                    onClick={() => {
                      setShowMessageModal(false);
                      setToastMessage(`Transmission successfully broadcasted to @${username}!`);
                      setTimeout(() => setToastMessage(''), 4000);
                    }}
                    className="w-full mt-2 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-655 dark:text-slate-355 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-850"
                  >
                    Acknowledge Signal
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING TELEMETRY TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 p-4 bg-white/95 dark:bg-[#0e121e]/95 border border-emerald-500/30 dark:border-emerald-500/20 text-slate-800 dark:text-white rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-md flex items-center gap-3 max-w-sm"
          >
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <Check className="w-4 h-4 text-emerald-500 stroke-[3.5px]" />
            </div>
            <div className="space-y-0.5">
              <div className="text-[10px] font-sans font-black uppercase text-emerald-505 dark:text-emerald-400 tracking-widest text-left">TRANSMISSION SENT</div>
              <p className="text-xs text-slate-655 dark:text-slate-300 font-light leading-normal text-left">{toastMessage}</p>
            </div>
            <button 
              onClick={() => setToastMessage('')}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-800 rounded-lg transition-colors cursor-pointer ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
};

export default PublicProfile;
