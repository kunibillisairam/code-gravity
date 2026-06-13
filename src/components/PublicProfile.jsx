import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import { chatService } from '../services/chatService';
import { 
  ChevronLeft, Loader2, Award, Zap, Flame, 
  Code2, User, Globe, BookOpen, 
  MapPin, Check, Plus, X, MessageSquare, UserPlus, UserMinus,
  Compass, History, Trophy
} from 'lucide-react';
import { getLevelTitle, getRankTitle, GithubIcon, LinkedinIcon } from '../utils/profileHelpers';
import ContributionHeatmap from './ContributionHeatmap';
import BadgeShowcase from './BadgeShowcase';

const PublicProfile = ({ username, onBack, user, onLoginClick, setView, onUserClick }) => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageSendState, setMessageSendState] = useState('idle'); // 'idle' | 'sending' | 'success'
  const [messageStatus, setMessageStatus] = useState(null); // null | 'unseen' | 'seen'

  // Followers & Following Modal States
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState('followers'); // 'followers' | 'following'
  const [followSearchQuery, setFollowSearchQuery] = useState('');

  const handleOpenFollowModal = (type) => {
    setFollowModalType(type);
    setFollowSearchQuery('');
    setShowFollowModal(true);
  };

  const handleMessageUser = (targetUsername) => {
    localStorage.setItem('active_chat_recipient', targetUsername);
    setShowFollowModal(false);
    if (setView) {
      setView('chat');
    }
  };

  const handleUserClick = (targetUsername) => {
    setShowFollowModal(false);
    if (onUserClick) {
      onUserClick(targetUsername);
    }
  };

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setMessageSendState('sending');
    try {
      // 1. Create or retrieve direct conversation with this user using unique database username
      const conv = await chatService.createConversation(profileData.username);
      // 2. Deliver message securely via REST endpoint
      await chatService.sendDirectMessage(conv.id, messageText);
      
      setMessageSendState('success');
      setMessageStatus('unseen');
      
      // Transition to seen status indicator after 8 seconds as configured
      setTimeout(() => {
        setMessageStatus('seen');
      }, 8000);
    } catch (err) {
      console.error("Failed to transmit direct message:", err);
      alert(err.response?.data?.detail || "Neural signal transmission failed. Please ensure you are logged in.");
      setMessageSendState('idle');
    }
  };

  const handleFollowToggle = async () => {
    if (!user) {
      if (onLoginClick) onLoginClick();
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await apiService.toggleFollowUser(profileData.username);
      setIsFollowing(res.status === 'followed');
      setFollowersCount(res.followers_count);
    } catch (err) {
      alert(err.message || 'Gravitational alignment failed. Could not alter follow status.');
    } finally {
      setIsActionLoading(false);
    }
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
        <div className="p-4 bg-rose-500/10 text-rose-555 rounded-full">
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

  const { profile, progress, faction, strongest_topics, following_count, global_rank = 1, faction_rank = 1 } = profileData;

  const targetList = followModalType === 'followers' 
    ? (profileData?.followers || []) 
    : (profileData?.following || []);

  const filteredList = targetList.filter(u => 
    u.username.toLowerCase().includes(followSearchQuery.toLowerCase()) ||
    u.display_name.toLowerCase().includes(followSearchQuery.toLowerCase())
  );

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

  const unlockedBadges = progress.badges || [];
  const heatmapData = progress.contribution_heatmap || {};
  const activityLog = (progress.activity_log || []).slice(-5).reverse();

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
            <h1 className="text-lg md:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
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
              <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight">
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
                    ? 'bg-transparent border-rose-500/40 hover:border-rose-500/80 text-rose-505 dark:text-rose-405 hover:bg-rose-500/5'
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

              <div className="flex flex-col items-center gap-1 shrink-0">
                <button
                  onClick={() => setShowMessageModal(true)}
                  className="p-3 bg-white dark:bg-[#121626] border border-slate-200 dark:border-slate-800 hover:border-cyber-cyan/45 text-slate-500 dark:text-cyber-cyan rounded-xl transition-all cursor-pointer hover:scale-[1.02] shadow-sm"
                  title="Establish Neural Transmission"
                >
                  <MessageSquare className="w-4.5 h-4.5" />
                </button>
                {messageStatus && (
                  <span className={`text-[8.5px] font-sans font-black uppercase tracking-widest ${
                    messageStatus === 'seen' 
                      ? 'text-emerald-500 dark:text-emerald-450' 
                      : 'text-amber-500 dark:text-amber-405 animate-pulse'
                  }`}>
                    {messageStatus}
                  </span>
                )}
              </div>
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
              
              <p className="text-xs text-slate-500 dark:text-slate-404 font-light leading-relaxed italic">
                {profile.bio ? `"${profile.bio}"` : '"This developer operates silently, traversing gravity tracks without transmitting a core logs broadcast."'}
              </p>

              {/* Rankings Block */}
              <div className="py-3 border-t border-slate-100 dark:border-slate-850/60 space-y-2">
                <span className="text-[9px] font-sans font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider block text-left">Leaderboard Standings</span>
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="flex flex-col p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850">
                    <span className="text-[8px] font-sans font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Global Rank</span>
                    <span className="text-base font-extrabold text-cyber-cyan font-mono pt-0.5">#{global_rank}</span>
                  </div>
                  <div className="flex flex-col p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850">
                    <span className="text-[8px] font-sans font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block">{faction} Rank</span>
                    <span className="text-base font-extrabold text-cyber-purple font-mono pt-0.5">#{faction_rank}</span>
                  </div>
                </div>
              </div>

              {/* Social Channels */}
              <div className="flex items-center gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-850/60">
                {profile.github_url && (
                  <a 
                    href={profile.github_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-550 hover:text-cyber-cyan hover:border-cyber-cyan/30 transition-colors cursor-pointer"
                  >
                    <GithubIcon className="w-4.5 h-4.5" />
                  </a>
                )}
                {profile.linkedin_url && (
                  <a 
                    href={profile.linkedin_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-550 hover:text-cyber-cyan hover:border-cyber-cyan/30 transition-colors cursor-pointer"
                  >
                    <LinkedinIcon className="w-4.5 h-4.5" />
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
                <span className="text-[8px] font-sans font-extrabold text-slate-400 dark:text-slate-555 uppercase tracking-widest">XP Points</span>
                <span className="text-lg font-black text-cyber-cyan mt-1 select-all">{xp.toLocaleString()}</span>
              </div>
              
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col items-center text-center">
                <span className="text-[8px] font-sans font-extrabold text-slate-400 dark:text-slate-555 uppercase tracking-widest">Rank Tier</span>
                <span className="text-lg font-black text-cyber-purple mt-1 uppercase">{rank}</span>
              </div>

              <button 
                onClick={() => handleOpenFollowModal('followers')}
                className="p-4 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col items-center text-center hover:border-cyber-cyan/30 cursor-pointer group transition-all"
              >
                <span className="text-[8px] font-sans font-extrabold text-slate-400 dark:text-slate-555 uppercase tracking-widest group-hover:text-cyber-cyan transition-colors">Followers</span>
                <span className="text-lg font-black text-slate-805 dark:text-white mt-1 group-hover:scale-[1.03] transition-transform">{followersCount}</span>
              </button>

              <button 
                onClick={() => handleOpenFollowModal('following')}
                className="p-4 rounded-2xl bg-[#ffffff] dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col items-center text-center hover:border-cyber-cyan/30 cursor-pointer group transition-all"
              >
                <span className="text-[8px] font-sans font-extrabold text-slate-400 dark:text-slate-555 uppercase tracking-widest group-hover:text-cyber-cyan transition-colors">Following</span>
                <span className="text-lg font-black text-slate-805 dark:text-white mt-1 group-hover:scale-[1.03] transition-transform">{following_count}</span>
              </button>
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

        {/* Contribution Heatmap component */}
        <ContributionHeatmap heatmapData={heatmapData} />

        {/* Gamified Achievements showcase */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple" />
          
          <div className="border-b border-slate-100 dark:border-slate-850/60 pb-3 flex items-center justify-between">
            <h3 className="font-sans font-black text-sm uppercase tracking-wider text-slate-850 dark:text-white flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-cyber-cyan" />
              Achievement Room ({unlockedBadges.length} Unlocked)
            </h3>
            <span className="text-[8px] font-sans font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
              GAMIFICATION SYSTEM AWARDS
            </span>
          </div>

          <BadgeShowcase unlockedBadges={unlockedBadges} />
        </div>

        {/* Timeline Log */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple" />
          
          <h3 className="font-sans font-black text-sm uppercase tracking-wider text-slate-850 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850/60 pb-3">
            <History className="w-4 h-4 text-cyber-cyan" />
            Quadrant Activity Log
          </h3>

          {activityLog.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-light">
              No recent logs emitted from this node.
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
                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border bg-cyber-cyan border-cyber-cyan" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 select-none">
                      <div className="font-bold text-xs text-slate-750 dark:text-slate-250">
                        {log.description}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
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

      {/* NEURAL MESSAGE MODAL */}
      <AnimatePresence>
        {showMessageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-[#0c0f1a] border border-slate-200 dark:border-slate-850 rounded-2xl p-6 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan to-cyber-purple" />
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850/60 pb-3.5">
                <h3 className="font-sans font-black text-sm uppercase tracking-wider text-slate-805 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyber-cyan" />
                  <span>Transmit Neural Signal</span>
                </h3>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="p-1.5 rounded-lg border border-slate-250 dark:border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {messageSendState === 'success' ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-805 dark:text-white uppercase tracking-wider">Transmission Delivered</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Your signal has successfully targeted @{profileData.username}'s orbital core.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowMessageModal(false)}
                    className="px-5 py-2 border border-slate-200 dark:border-slate-800 text-slate-655 dark:text-slate-400 text-xs font-bold uppercase rounded-lg cursor-pointer hover:border-cyber-cyan/30 hover:text-cyber-cyan"
                  >
                    Close Channel
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest">Payload Message</label>
                    <textarea
                      required
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      maxLength={350}
                      rows={4}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:border-cyber-cyan/40 resize-none font-sans leading-relaxed"
                      placeholder={`Write a direct message payload to @${profileData.username}...`}
                    />
                    <div className="text-[8.5px] font-mono text-slate-455 text-right">
                      {messageText.length}/350 chars
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-850/60">
                    <button
                      type="button"
                      onClick={() => setShowMessageModal(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-850 text-xs font-bold text-slate-700 dark:text-slate-350 rounded-lg cursor-pointer"
                    >
                      Abort
                    </button>
                    <button
                      type="submit"
                      disabled={messageSendState === 'sending'}
                      className="px-5 py-2 bg-cyber-cyan text-space-900 font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {messageSendState === 'sending' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Transmitting...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Transmit</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOLLOWERS / FOLLOWING INTERACTIVE MODAL */}
      <AnimatePresence>
        {showFollowModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFollowModal(false)}
              className="absolute inset-0 bg-[#04060a]/80 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-sm bg-white dark:bg-[#0c0f1a] border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] z-10"
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple" />
              
              <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-850/60">
                <h3 className="font-sans font-black text-sm uppercase tracking-wider text-slate-850 dark:text-white flex items-center gap-2">
                  <span>{followModalType === 'followers' ? 'Orbital Followers' : 'Orbital Following'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-cyber-cyan">
                    {targetList.length}
                  </span>
                </h3>
                <button 
                  onClick={() => setShowFollowModal(false)}
                  className="p-1.5 bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-xl hover:border-rose-500/40 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 pb-2">
                <div className="relative flex items-center">
                  <Compass className="absolute left-3 w-4 h-4 text-slate-400 dark:text-slate-555" />
                  <input 
                    type="text" 
                    value={followSearchQuery} 
                    onChange={(e) => setFollowSearchQuery(e.target.value)} 
                    placeholder="Search developers in grid..."
                    className="w-full bg-slate-50 dark:bg-slate-900/65 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 dark:text-white outline-none focus:border-cyber-cyan/40 leading-relaxed font-sans placeholder-slate-400"
                  />
                  {followSearchQuery && (
                    <button 
                      onClick={() => setFollowSearchQuery('')}
                      className="absolute right-3 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 pt-1 overflow-y-auto max-h-[320px] space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800">
                {filteredList.length > 0 ? (
                  filteredList.map((u) => (
                    <div 
                      key={u.username}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 dark:bg-slate-900/10 hover:bg-slate-50 dark:hover:bg-slate-900/40 border border-transparent hover:border-slate-100 dark:hover:border-slate-850/50 transition-all group"
                    >
                      <button 
                        onClick={() => handleUserClick(u.username)}
                        className="flex items-center gap-3 text-left focus:outline-none bg-transparent border-0 cursor-pointer p-0 shrink-0"
                      >
                        {u.profile_pic ? (
                          <img 
                            src={u.profile_pic} 
                            alt={u.display_name} 
                            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-805 object-cover shadow-sm shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-cyber-cyan to-cyber-purple flex items-center justify-center text-space-900 font-black text-sm shadow shrink-0 select-none">
                            {u.display_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-805 dark:text-white truncate group-hover:text-cyber-cyan transition-colors leading-tight">
                            {u.display_name}
                          </h4>
                          <span className="text-[9px] font-mono text-slate-400 dark:text-slate-555 uppercase tracking-wider block">
                            @{u.username}
                          </span>
                        </div>
                      </button>

                      <button 
                        onClick={() => handleMessageUser(u.username)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyber-cyan/10 hover:bg-cyber-cyan text-cyber-cyan hover:text-space-900 border border-cyber-cyan/35 rounded-lg text-[10px] font-sans font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:scale-[1.03]"
                      >
                        <MessageSquare className="w-3 h-3 shrink-0 stroke-[2.5px]" />
                        <span>Message</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-405 dark:text-slate-505 font-light italic leading-normal">
                    No developers found in quadrant grid.
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50/50 dark:bg-slate-900/25 border-t border-slate-100 dark:border-slate-850/60 text-center font-mono text-[8px] tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan shrink-0 animate-pulse shadow-[0_0_4px_rgba(0,214,230,0.5)]" />
                <span>Secure live neural signal connection active</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
};

export default PublicProfile;
