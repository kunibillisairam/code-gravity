import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import { Bell, MessageSquare } from 'lucide-react';
import Features from './components/Features';
import { chatService } from './services/chatService';
import { apiService } from './services/api';
import { getVirtualProblem } from './data/virtualProblems';
import { PROBLEMS_DB } from './data/problems';

const TopicExplorer = lazy(() => import('./components/TopicExplorer'));
const AIAssistant = lazy(() => import('./components/AIAssistant'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const Footer = lazy(() => import('./components/Footer'));
const Workspace = lazy(() => import('./components/Workspace'));
const AuthModal = lazy(() => import('./components/AuthModal'));
const Submissions = lazy(() => import('./components/Submissions'));
const ProfileDashboard = lazy(() => import('./components/ProfileDashboard'));
const PublicProfile = lazy(() => import('./components/PublicProfile'));
const PeerChat = lazy(() => import('./components/PeerChat'));

const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-[#080a10] text-slate-405">
    <div className="w-8 h-8 rounded-full border-2 border-t-cyber-cyan border-slate-700 animate-spin" />
    <span className="text-xs font-light tracking-wider uppercase">Aligning Quantum Grid...</span>
  </div>
);

function App() {
  const [view, setView] = useState('landing'); // 'landing' or 'workspace'
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedUsername, setSelectedUsername] = useState(null);
  
  // Scoped User State
  const [user, setUser] = useState(() => {
    return localStorage.getItem('codegravity_user') || null;
  });

  // Sync solved problems from backend to local storage scoped keys upon login / mount
  useEffect(() => {
    const syncSolvedProblems = async () => {
      if (!user) return;
      try {
        const profileData = await apiService.getUserProfile();
        if (profileData && profileData.progress && Array.isArray(profileData.progress.solved_problems)) {
          profileData.progress.solved_problems.forEach((probId) => {
            localStorage.setItem(`solved_${user}_${probId}`, 'true');
          });
        }
      } catch (err) {
        console.error('Failed to sync solved problems from backend:', err);
      }
    };
    syncSolvedProblems();
  }, [user]);

  const [activeSection, setActiveSection] = useState('hero');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('codegravity_theme') || 'dark';
  });

  // Global Real-time Notification Logs State
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [globalToasts, setGlobalToasts] = useState([]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('codegravity_theme', theme);
  }, [theme]);

  // Real-time WebSockets Stream integration
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      setUnreadMessagesCount(0);
      return;
    }

    // Connect to global notifications & live chat status alerts
    chatService.connectNotificationSocket(user);

    // Initial fetch of follows/badges activity alerts
    const syncInitialNotifications = async () => {
      try {
        const alerts = await chatService.getActivityNotifications();
        setNotifications(alerts);
        setUnreadNotificationsCount(alerts.filter(n => !n.is_seen).length);
      } catch (err) {
        console.error("Failed to load active timeline notification stream:", err);
      }
    };

    // Initial fetch of unread chat counts scoped per user conversation
    const syncUnreadMessages = async () => {
      try {
        const count = await chatService.getUnreadMessagesCount();
        setUnreadMessagesCount(count);
      } catch (err) {
        console.error("Failed to fetch unread DM payload counts:", err);
      }
    };

    syncInitialNotifications();
    syncUnreadMessages();

    // Register global listener for incoming updates
    const handleWebSocketEvent = (event) => {
      if (event.type === 'global_notification') {
        const notif = event.data;

        // If DM update link is present, dispatch message count increment, else dispatch Bell alert count
        if (notif.link && notif.link.view === 'chat') {
          // Increment local live messages counter immediately
          setUnreadMessagesCount(prev => prev + 1);

          // Append DM message toast alert popup
          setGlobalToasts(prev => [
            ...prev,
            {
              id: Date.now(),
              title: notif.title,
              text: notif.content,
              link: notif.link,
              isMessage: true
            }
          ]);
        } else {
          // Normal activity alerts (follower triggers, badges, levels)
          setNotifications(prev => [notif, ...prev]);
          setUnreadNotificationsCount(prev => prev + 1);

          // Append Normal Activity toast alert popup
          setGlobalToasts(prev => [
            ...prev,
            {
              id: Date.now(),
              title: notif.title,
              text: notif.content,
              link: notif.link,
              isMessage: false
            }
          ]);
        }
      } else if (event.type === 'chat_read_receipt') {
        // Recipient read DMs, decrement count
        syncUnreadMessages();
      }
    };

    chatService.addNotificationListener(handleWebSocketEvent);

    return () => {
      chatService.removeNotificationListener(handleWebSocketEvent);
      chatService.disconnectNotificationSocket();
    };
  }, [user]);

  // Clean-up toasts automatically after 6 seconds
  useEffect(() => {
    if (globalToasts.length > 0) {
      const timer = setTimeout(() => {
        setGlobalToasts(prev => prev.slice(1));
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [globalToasts]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLoginSuccess = (username) => {
    setUser(username);
    localStorage.setItem('codegravity_user', username);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    chatService.disconnectNotificationSocket();
    localStorage.removeItem('codegravity_token');
    localStorage.removeItem('codegravity_user');
    setUser(null);
    setView('landing');
  };

  const handleNotificationClick = async (notif) => {
    try {
      await chatService.markNotificationAsRead(notif.id);
      setNotifications(prev => 
        prev.map(n => n.id === notif.id ? { ...n, is_seen: true } : n)
      );
      setUnreadNotificationsCount(prev => Math.max(0, prev - 1));

      // Trigger navigation router alignment based on alert payload link meta
      if (notif.link) {
        const { view: targetView, param } = notif.link;
        if (targetView === 'chat') {
          if (param) {
            localStorage.setItem('active_chat_recipient', param);
          }
          setView('chat');
        } else if (targetView === 'public-profile') {
          setSelectedUsername(param);
          setView('public-profile');
          window.scrollTo({ top: 0 });
        } else if (targetView === 'profile') {
          setView('profile');
        }
      }
    } catch (err) {
      console.error("Failed to update notification logs status:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await chatService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_seen: true })));
      setUnreadNotificationsCount(0);
    } catch (err) {
      console.error("Failed to clear notification logs:", err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await chatService.clearAllNotifications();
      setNotifications([]);
      setUnreadNotificationsCount(0);
    } catch (err) {
      console.error("Failed to clean notification payloads:", err);
    }
  };

  const handleSolveProblem = (problemId) => {
    setSelectedProblem(PROBLEMS_DB[problemId] || PROBLEMS_DB['two-sum']);
    setView('workspace');
    window.scrollTo({ top: 0 });
  };

  const handleExploreClick = () => {
    handleNavigateToSection('problems');
  };

  const handleNavigateToSection = (sectionId) => {
    if (view !== 'landing') {
      setView('landing');
    }
    
    setActiveSection(sectionId);
    
    const tryScroll = () => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    };
    
    setTimeout(tryScroll, 50);
  };

  const handleBackToExplorer = () => {
    handleNavigateToSection('problems');
  };

  // If in immersive coding workspace, only render Workspace view
  if (view === 'workspace') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Workspace 
          problem={selectedProblem} 
          onBack={handleBackToExplorer} 
          theme={theme}
          toggleTheme={toggleTheme}
        />
      </Suspense>
    );
  }

  // If in Submissions history view, render Navbar shell + Submissions board
  if (view === 'submissions') {
    return (
      <div className="relative min-h-screen bg-slate-50 dark:bg-[#080a10] text-slate-800 dark:text-white font-sans transition-colors duration-300 selection:bg-cyber-cyan/35 selection:text-white select-none">
        <Navbar 
          activeSection="" 
          setActiveSection={() => {}} 
          theme={theme} 
          toggleTheme={toggleTheme} 
          user={user}
          onLoginClick={() => setShowAuthModal(true)}
          onLogoutClick={handleLogout}
          onSubmissionsClick={() => setView('submissions')}
          onProfileClick={() => setView('profile')}
          onNavClick={handleNavigateToSection}
          onChatClick={() => setView('chat')}
          notifications={notifications}
          unreadNotificationsCount={unreadNotificationsCount}
          unreadMessagesCount={unreadMessagesCount}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllRead}
          onClearNotifications={handleClearNotifications}
        />
        <Suspense fallback={<PageLoader />}>
          <Submissions onBack={() => setView('landing')} />
        </Suspense>
        <Suspense fallback={<PageLoader />}>
          <Footer />
        </Suspense>
      </div>
    );
  }

  // If in Profile dashboard view, render Navbar shell + Profile Dashboard
  if (view === 'profile') {
    return (
      <div className="relative min-h-screen bg-slate-50 dark:bg-[#080a10] text-slate-800 dark:text-white font-sans transition-colors duration-300 selection:bg-cyber-cyan/35 selection:text-white select-none">
        <Navbar 
          activeSection="" 
          setActiveSection={() => {}} 
          theme={theme} 
          toggleTheme={toggleTheme} 
          user={user}
          onLoginClick={() => setShowAuthModal(true)}
          onLogoutClick={handleLogout}
          onSubmissionsClick={() => setView('submissions')}
          onProfileClick={() => setView('profile')}
          onNavClick={handleNavigateToSection}
          onNavClick={handleNavigateToSection}
          onChatClick={() => setView('chat')}
          notifications={notifications}
          unreadNotificationsCount={unreadNotificationsCount}
          unreadMessagesCount={unreadMessagesCount}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllRead}
          onClearNotifications={handleClearNotifications}
        />
        <Suspense fallback={<PageLoader />}>
          <ProfileDashboard 
            onBack={() => setView('landing')} 
            setView={setView} 
            onUserClick={(uname) => {
              setSelectedUsername(uname);
              setView('public-profile');
              window.scrollTo({ top: 0 });
            }}
          />
        </Suspense>
        <Suspense fallback={<PageLoader />}>
          <Footer />
        </Suspense>
      </div>
    );
  }

  // If in Public Profile view, render Navbar shell + Public Profile component
  if (view === 'public-profile') {
    return (
      <div className="relative min-h-screen bg-slate-50 dark:bg-[#080a10] text-slate-800 dark:text-white font-sans transition-colors duration-300 selection:bg-cyber-cyan/35 selection:text-white select-none">
        <Navbar 
          activeSection="" 
          setActiveSection={() => {}} 
          theme={theme} 
          toggleTheme={toggleTheme} 
          user={user}
          onLoginClick={() => setShowAuthModal(true)}
          onLogoutClick={handleLogout}
          onSubmissionsClick={() => setView('submissions')}
          onProfileClick={() => setView('profile')}
          onNavClick={handleNavigateToSection}
          onChatClick={() => setView('chat')}
          notifications={notifications}
          unreadNotificationsCount={unreadNotificationsCount}
          unreadMessagesCount={unreadMessagesCount}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllRead}
          onClearNotifications={handleClearNotifications}
        />
        <Suspense fallback={<PageLoader />}>
          <PublicProfile 
            username={selectedUsername} 
            onBack={() => setView('landing')} 
            setView={setView}
            user={user}
            onLoginClick={() => setShowAuthModal(true)}
            onUserClick={(uname) => {
              setSelectedUsername(uname);
              setView('public-profile');
              window.scrollTo({ top: 0 });
            }}
          />
        </Suspense>
        <Suspense fallback={<PageLoader />}>
          <Footer />
        </Suspense>
      </div>
    );
  }

  // If in Peer Chat view, render Navbar shell + Peer Learning Chat
  if (view === 'chat') {
    return (
      <div className="relative min-h-screen bg-slate-50 dark:bg-[#080a10] text-slate-800 dark:text-white font-sans transition-colors duration-300 selection:bg-cyber-cyan/35 selection:text-white select-none">
        <Navbar 
          activeSection="" 
          setActiveSection={() => {}} 
          theme={theme} 
          toggleTheme={toggleTheme} 
          user={user}
          onLoginClick={() => setShowAuthModal(true)}
          onLogoutClick={handleLogout}
          onSubmissionsClick={() => setView('submissions')}
          onProfileClick={() => setView('profile')}
          onNavClick={handleNavigateToSection}
          onChatClick={() => setView('chat')}
          notifications={notifications}
          unreadNotificationsCount={unreadNotificationsCount}
          unreadMessagesCount={0}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllRead}
          onClearNotifications={handleClearNotifications}
        />
        <Suspense fallback={<PageLoader />}>
          <PeerChat onBack={() => setView('landing')} theme={theme} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#080a10] text-slate-800 dark:text-white font-sans transition-colors duration-300 selection:bg-cyber-cyan/35 selection:text-white">
      {/* Absolute Glow Background Blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full radial-glow-cyan pointer-events-none z-0 opacity-20 dark:opacity-30"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full radial-glow-purple pointer-events-none z-0 opacity-20 dark:opacity-30"></div>

      {/* Grid Pattern Mesh */}
      <div className="fixed inset-0 tech-grid opacity-10 dark:opacity-20 pointer-events-none z-0"></div>

      {/* Navigation */}
      <Navbar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        user={user}
        onLoginClick={() => setShowAuthModal(true)}
        onLogoutClick={handleLogout}
        onSubmissionsClick={() => setView('submissions')}
        onProfileClick={() => setView('profile')}
        onNavClick={handleNavigateToSection}
        onChatClick={() => setView('chat')}
        notifications={notifications}
        unreadNotificationsCount={unreadNotificationsCount}
        unreadMessagesCount={unreadMessagesCount}
        onNotificationClick={handleNotificationClick}
        onMarkAllRead={handleMarkAllRead}
        onClearNotifications={handleClearNotifications}
      />

      <Suspense fallback={<PageLoader />}>
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </Suspense>

      {/* Main Sections */}
      <main className="relative z-10 w-full overflow-hidden">
        <Hero onExploreClick={handleExploreClick} />
        
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200/30 dark:via-white/5 to-transparent"></div>
        <Features />
        
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200/30 dark:via-white/5 to-transparent"></div>
        <Suspense fallback={<PageLoader />}>
          <TopicExplorer onSolveProblem={handleSolveProblem} />
        </Suspense>
        
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200/30 dark:via-white/5 to-transparent"></div>
        <Suspense fallback={<PageLoader />}>
          <AIAssistant />
        </Suspense>
        
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200/30 dark:via-white/5 to-transparent"></div>
        <Suspense fallback={<PageLoader />}>
          <Leaderboard 
            onUserClick={(username) => {
              setSelectedUsername(username);
              setView('public-profile');
              window.scrollTo({ top: 0 });
            }} 
          />
        </Suspense>
      </main>

      {/* Footer */}
      <Suspense fallback={<PageLoader />}>
        <Footer />
      </Suspense>

      {/* --- GLOBAL REAL-TIME NOTIFICATION TOASTER --- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {globalToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              onClick={() => {
                if (toast.link) {
                  const { view: targetView, param } = toast.link;
                  if (targetView === 'chat') {
                    if (param) localStorage.setItem('active_chat_recipient', param);
                    setView('chat');
                  } else if (targetView === 'public-profile') {
                    setSelectedUsername(param);
                    setView('public-profile');
                    window.scrollTo({ top: 0 });
                  } else if (targetView === 'profile') {
                    setView('profile');
                  }
                }
                setGlobalToasts(prev => prev.filter(t => t.id !== toast.id));
              }}
              className={`p-4 rounded-xl shadow-2xl cursor-pointer w-80 text-left flex items-start gap-3 select-none z-50 border-l-4 ${
                toast.isMessage
                  ? 'bg-white dark:bg-[#100b18] border-cyber-magenta shadow-[0_0_20px_rgba(255,0,255,0.15)]'
                  : 'bg-white dark:bg-[#080f1a] border-cyber-cyan shadow-[0_0_20px_rgba(0,240,255,0.12)]'
              }`}
            >
              {toast.isMessage ? (
                <div className="p-1.5 rounded-lg bg-cyber-magenta/10 shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4 text-cyber-magenta" />
                </div>
              ) : (
                <div className="p-1.5 rounded-lg bg-cyber-cyan/10 shrink-0 mt-0.5">
                  <Bell className="w-4 h-4 text-cyber-cyan" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className={`text-[10px] uppercase font-black tracking-wider block ${
                  toast.isMessage ? 'text-cyber-magenta' : 'text-cyber-cyan'
                }`}>{toast.title}</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5 line-clamp-2">{toast.text}</p>
                <span className={`text-[9px] font-bold mt-1 block uppercase tracking-widest ${
                  toast.isMessage ? 'text-cyber-magenta/60' : 'text-cyber-cyan/60'
                }`}>{toast.isMessage ? 'Direct Message' : 'Notification'}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
