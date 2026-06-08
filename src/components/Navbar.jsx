import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Orbit, Sun, Moon, User, LogOut, List, ChevronDown, MessageSquare, Bell, UserPlus, Award, Trash, Sparkles } from 'lucide-react';

const Navbar = ({ 
  activeSection, 
  setActiveSection, 
  theme, 
  toggleTheme, 
  user, 
  userXp = 0,
  onLoginClick, 
  onLogoutClick, 
  onSubmissionsClick, 
  onProfileClick, 
  onNavClick, 
  onChatClick,
  notifications = [],
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
  onNotificationClick,
  onMarkAllRead,
  onClearNotifications
}) => {
  const navItems = [
    { id: 'hero', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'problems', label: 'Problems Explorer' },
    { id: 'ai-assistant', label: 'AI Assistant' },
    { id: 'leaderboard', label: 'Leaderboard' }
  ];

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleScroll = (id) => {
    if (onNavClick) {
      onNavClick(id);
      return;
    }
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#080a10]/95 border-b border-slate-200 dark:border-slate-900 transition-all duration-300 px-6 py-4 md:px-12 flex items-center justify-between"
    >
      {/* Logo Section */}
      <div 
        onClick={() => handleScroll('hero')}
        className="flex items-center gap-2.5 cursor-pointer group"
      >
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="text-cyber-cyan p-1"
        >
          <Orbit className="w-5.5 h-5.5 text-cyber-cyan" />
        </motion.div>
        
        <span className="font-sans text-base md:text-lg font-black tracking-widest text-slate-800 dark:text-white">
          CODE<span className="text-cyber-purple">GRAVITY</span>
        </span>
      </div>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-8">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleScroll(item.id)}
            className={`relative font-sans font-bold text-xs tracking-wider uppercase transition-all duration-200 ${
              activeSection === item.id 
                ? 'text-cyber-cyan' 
                : 'text-slate-400 hover:text-slate-905 dark:text-slate-450 dark:hover:text-white'
            }`}
          >
            {item.label}
            {activeSection === item.id && (
              <motion.div 
                layoutId="nav-underline"
                className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-cyber-cyan"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Theme & Auth Buttons */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-2">
            {/* Bell — Follows, Badges, System Alerts ONLY */}
            <div className="relative group">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setDropdownOpen(false);
                }}
                className="relative flex flex-col items-center gap-0.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#121626] bg-transparent cursor-pointer transition-all duration-200"
                title="Activity Notifications (Follows, Badges)"
              >
                <Bell className="w-4 h-4 text-slate-500 dark:text-cyber-cyan" />
                <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none hidden sm:block">Activity</span>
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyber-cyan text-[8px] font-extrabold text-slate-900 animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setNotifOpen(false)} />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2.5 w-72 bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 rounded-xl py-3 shadow-2xl z-50 overflow-hidden text-left flex flex-col max-h-[380px]"
                    >
                      {/* Header */}
                      <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Bell className="w-3 h-3 text-cyber-cyan" />
                          <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Activity</span>
                          <span className="text-[8px] text-slate-400 dark:text-slate-500 font-medium">(follows &amp; badges)</span>
                        </div>
                        <div className="flex gap-2">
                          {Array.isArray(notifications) && notifications.length > 0 && (
                            <button
                              onClick={() => { onMarkAllRead && onMarkAllRead(); }}
                              className="text-[8px] font-bold text-cyber-cyan hover:text-cyber-purple transition-all uppercase tracking-wider cursor-pointer"
                            >
                              Read All
                            </button>
                          )}
                          {Array.isArray(notifications) && notifications.length > 0 && (
                            <button
                              onClick={() => { onClearNotifications && onClearNotifications(); }}
                              className="text-[8px] font-bold text-rose-450 hover:text-rose-500 transition-all uppercase tracking-wider cursor-pointer flex items-center gap-0.5"
                            >
                              <Trash className="w-2.5 h-2.5" />
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Notifications List — message-type filtered out upstream */}
                      <div className="flex-1 overflow-y-auto py-1 divide-y divide-slate-50 dark:divide-slate-850/30">
                        {Array.isArray(notifications) && notifications.map((notif) => {
                          const isUnread = !notif.is_read;
                          
                          // Icon per type — no 'message' type appears here
                          let IconComponent = Bell;
                          let iconColorClass = "text-cyber-cyan";
                          let dotColor = "bg-cyber-cyan shadow-[0_0_6px_#00f0ff]";
                          if (notif.type === 'follower') {
                            IconComponent = UserPlus;
                            iconColorClass = "text-cyber-cyan";
                            dotColor = "bg-cyber-cyan shadow-[0_0_6px_#00f0ff]";
                          } else if (notif.type === 'badge') {
                            IconComponent = Award;
                            iconColorClass = "text-cyber-purple";
                            dotColor = "bg-cyber-purple shadow-[0_0_6px_#9b5cf6]";
                          }

                          return (
                            <div
                              key={notif.id}
                              onClick={() => {
                                setNotifOpen(false);
                                onNotificationClick(notif);
                              }}
                              className={`px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-[#121626]/80 flex items-start gap-2.5 cursor-pointer transition-colors ${
                                isUnread ? 'bg-cyber-cyan/5' : ''
                              }`}
                            >
                              <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 ${iconColorClass}`}>
                                <IconComponent className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 tracking-wide uppercase truncate block pr-1.5">
                                    {notif.title}
                                  </span>
                                  {isUnread && (
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                  {notif.text}
                                </p>
                                <span className="text-[7.5px] font-mono text-slate-400 dark:text-slate-500 mt-1 block">
                                  {new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {(!Array.isArray(notifications) || notifications.length === 0) && (
                          <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2 select-none">
                            <Sparkles className="w-6 h-6 text-slate-400 dark:text-slate-700 animate-pulse" />
                            <p className="text-[10px] font-bold italic tracking-wide">All caught up! 🌌</p>
                            <p className="text-[9px] text-slate-400">New follows &amp; badges appear here</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Chat Button — Direct Messages ONLY */}
            <button
              onClick={() => {
                onChatClick && onChatClick();
                setNotifOpen(false);
                setDropdownOpen(false);
              }}
              className="relative flex flex-col items-center gap-0.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#121626] bg-transparent cursor-pointer transition-all duration-200"
              title="Direct Messages"
            >
              <MessageSquare className="w-4 h-4 text-slate-500 dark:text-cyber-magenta" />
              <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none hidden sm:block">Messages</span>
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyber-magenta text-[8px] font-extrabold text-white animate-pulse">
                  {unreadMessagesCount}
                </span>
              )}
            </button>


            {/* Profile Dropdown */}
            <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full border border-slate-200 dark:border-slate-800 hover:border-cyber-cyan/50 dark:hover:border-cyber-cyan/40 bg-slate-550 dark:bg-[#121626] transition-all cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyber-cyan to-cyber-purple flex items-center justify-center text-space-900 font-extrabold text-xs shadow-md">
                {user.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col items-start text-left leading-none hidden sm:flex pr-1 shrink-0 select-none">
                <span className="text-[10px] font-bold font-mono text-slate-600 dark:text-cyber-cyan uppercase">@{user}</span>
                <span className="text-[8px] font-mono text-cyber-purple font-black tracking-widest mt-0.5 uppercase">
                  {userXp} XP
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setDropdownOpen(false)} />
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2.5 w-48 bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 rounded-xl py-2 shadow-2xl z-50 overflow-hidden text-left"
                  >
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onProfileClick();
                      }}
                      className="w-full px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-[#121626] text-slate-700 dark:text-slate-300 hover:text-cyber-cyan dark:hover:text-cyber-cyan text-xs font-bold font-sans flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>My Profile</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onSubmissionsClick();
                      }}
                      className="w-full px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-[#121626] text-slate-700 dark:text-slate-300 hover:text-cyber-cyan dark:hover:text-cyber-cyan text-xs font-bold font-sans flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <List className="w-4 h-4 text-slate-400" />
                      <span>My Submissions</span>
                    </button>
                    
                    <div className="h-[1px] bg-slate-100 dark:bg-slate-850 my-1"></div>
                    
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogoutClick();
                      }}
                      className="w-full px-4 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/10 text-slate-600 dark:text-slate-400 hover:text-rose-550 dark:hover:text-rose-450 text-xs font-bold font-sans flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="px-3 md:px-4 py-1.5 rounded bg-cyber-purple/10 border border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple hover:text-white transition-all text-[10px] md:text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Sign In
          </button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#121626] text-slate-550 hover:text-slate-900 dark:text-cyber-cyan transition-all duration-200 bg-transparent cursor-pointer"
          aria-label="Toggle Theme Mode"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-cyber-cyan" />
          ) : (
            <Moon className="w-4 h-4 text-cyber-purple" />
          )}
        </motion.button>
      </div>
    </motion.nav>
  );
};

export default Navbar;
