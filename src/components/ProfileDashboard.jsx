import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import { 
  ChevronLeft, Loader2, Award, Zap, Flame, 
  Code2, User, Globe, BookOpen, MessageSquare,
  MapPin, Check, Plus, X, Edit3, Compass, History, Trophy,
  Calendar
} from 'lucide-react';
import { getLevelTitle, getRankTitle, GithubIcon, LinkedinIcon } from '../utils/profileHelpers';
import ContributionHeatmap from './ContributionHeatmap';
import BadgeShowcase from './BadgeShowcase';

const ProfileDashboard = ({ onBack, setView, onUserClick }) => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const targetList = followModalType === 'followers' 
    ? (profileData?.followers || []) 
    : (profileData?.following || []);

  const filteredList = targetList.filter(u => 
    u.username.toLowerCase().includes(followSearchQuery.toLowerCase()) ||
    u.display_name.toLowerCase().includes(followSearchQuery.toLowerCase())
  );

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

  const unlockedBadges = progress.badges || [];
  const heatmapData = progress.contribution_heatmap || {};
  const activityLog = (progress.activity_log || []).slice(-5).reverse(); // last 5 actions

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

              {/* Followers & Following Counts */}
              <div className="flex items-center gap-6 py-2 border-y border-slate-100 dark:border-slate-850/60 text-xs">
                <button 
                  onClick={() => handleOpenFollowModal('followers')}
                  className="flex items-center gap-1.5 hover:text-cyber-cyan transition-colors font-sans cursor-pointer bg-transparent border-0 p-0 text-slate-600 dark:text-slate-400"
                >
                  <span className="font-extrabold text-slate-850 dark:text-white">{(profileData?.followers || []).length}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Followers</span>
                </button>
                <button 
                  onClick={() => handleOpenFollowModal('following')}
                  className="flex items-center gap-1.5 hover:text-cyber-cyan transition-colors font-sans cursor-pointer bg-transparent border-0 p-0 text-slate-600 dark:text-slate-400"
                >
                  <span className="font-extrabold text-slate-850 dark:text-white">{(profileData?.following || []).length}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-505 uppercase tracking-wider">Following</span>
                </button>
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
                    <GithubIcon className="w-4 h-4" />
                  </a>
                )}
                {profile.linkedin_url && (
                  <a 
                    href={profile.linkedin_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-850 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <LinkedinIcon className="w-4 h-4" />
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
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block mt-1">Current</span>
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

        {/* Reusable Contribution Heatmap */}
        <ContributionHeatmap heatmapData={heatmapData} />

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

          {/* Col 2: Reusable Badges Showcase */}
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

            <BadgeShowcase unlockedBadges={unlockedBadges} />
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
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Display Name</label>
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
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">College Name</label>
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
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Bio Description</label>
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
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider flex items-center gap-1"><GithubIcon className="w-3.5 h-3.5" /> GitHub Profile Link</label>
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
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider flex items-center gap-1"><LinkedinIcon className="w-3.5 h-3.5" /> LinkedIn Profile Link</label>
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
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Profile Avatar Image Link (URL)</label>
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
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Skills (Comma Separated)</label>
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
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Domains (Comma Separated)</label>
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

      {/* FOLLOWERS / FOLLOWING INTERACTIVE MODAL */}
      <AnimatePresence>
        {showFollowModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Glassmorphic Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFollowModal(false)}
              className="absolute inset-0 bg-[#04060a]/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-sm bg-white dark:bg-[#0c0f1a] border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] z-10"
            >
              {/* Branded futuristic line top */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple" />
              
              {/* Header */}
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

              {/* Search Bar */}
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

              {/* List items */}
              <div className="p-4 pt-1 overflow-y-auto max-h-[320px] space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800">
                {filteredList.length > 0 ? (
                  filteredList.map((u) => (
                    <div 
                      key={u.username}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 dark:bg-slate-900/10 hover:bg-slate-50 dark:hover:bg-slate-900/40 border border-transparent hover:border-slate-100 dark:hover:border-slate-850/50 transition-all group"
                    >
                      {/* Left side: Avatar + Username info */}
                      <button 
                        onClick={() => handleUserClick(u.username)}
                        className="flex items-center gap-3 text-left focus:outline-none bg-transparent border-0 cursor-pointer p-0 shrink-0"
                      >
                        {u.profile_pic ? (
                          <img 
                            src={u.profile_pic} 
                            alt={u.display_name} 
                            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 object-cover shadow-sm shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-cyber-cyan to-cyber-purple flex items-center justify-center text-space-900 font-black text-sm shadow shrink-0 select-none">
                            {u.display_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-800 dark:text-white truncate group-hover:text-cyber-cyan transition-colors leading-tight">
                            {u.display_name}
                          </h4>
                          <span className="text-[9px] font-mono text-slate-400 dark:text-slate-555 uppercase tracking-wider block">
                            @{u.username}
                          </span>
                        </div>
                      </button>

                      {/* Right side: Action - message */}
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

              {/* Secure orbital footer */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-900/25 border-t border-slate-100 dark:border-slate-850/60 text-center font-mono text-[8px] tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan shrink-0 animate-pulse shadow-[0_0_4px_rgba(0,214,230,0.5)]" />
                <span>Secure live neural signal connection active</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ProfileDashboard;
