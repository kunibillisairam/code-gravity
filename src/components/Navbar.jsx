import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Orbit, Sun, Moon, User, LogOut, List, ChevronDown, MessageSquare } from 'lucide-react';

const Navbar = ({ activeSection, setActiveSection, theme, toggleTheme, user, onLoginClick, onLogoutClick, onSubmissionsClick, onProfileClick, onNavClick, onChatClick }) => {
  const navItems = [
    { id: 'hero', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'problems', label: 'Problems Explorer' },
    { id: 'ai-assistant', label: 'AI Assistant' },
    { id: 'leaderboard', label: 'Leaderboard' }
  ];

  const [dropdownOpen, setDropdownOpen] = useState(false);

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
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full border border-slate-200 dark:border-slate-800 hover:border-cyber-cyan/50 dark:hover:border-cyber-cyan/40 bg-slate-550 dark:bg-[#121626] transition-all cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyber-cyan to-cyber-purple flex items-center justify-center text-space-900 font-extrabold text-xs shadow-md">
                {user.charAt(0).toUpperCase()}
              </div>
              <span className="text-[10px] font-bold font-mono text-slate-600 dark:text-cyber-cyan uppercase hidden sm:block pr-1">@{user}</span>
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
                    
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onChatClick();
                      }}
                      className="w-full px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-[#121626] text-slate-700 dark:text-slate-300 hover:text-cyber-cyan dark:hover:text-cyber-cyan text-xs font-bold font-sans flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <span>Peer Learning Chat</span>
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
