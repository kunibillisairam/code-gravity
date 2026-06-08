import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import { Bell, MessageSquare } from 'lucide-react';
import Features from './components/Features';
import { chatService } from './services/chatService';
import { apiService } from './services/api';
import { getVirtualProblem } from './data/virtualProblems';
import { PROBLEMS_DB } from './data/problems';

import TopicExplorer from './components/TopicExplorer';
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

const WorkspaceWrapper = ({ theme, toggleTheme }) => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  
  let problem = PROBLEMS_DB[problemId];
  if (!problem && problemId) {
    const parts = problemId.split('_');
    if (parts.length >= 3) {
      const lang = parts[0];
      const topicId = parts[1];
      const slug = parts.slice(2).join('_');
      const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      problem = getVirtualProblem(lang, topicId, slug, title);
    }
  }
  
  if (!problem) {
    problem = PROBLEMS_DB['two-sum'];
  }
  
  return (
    <Workspace 
      problem={problem} 
      onBack={() => navigate(-1)} 
      onHome={() => navigate('/')} 
      theme={theme}
      toggleTheme={toggleTheme}
    />
  );
};

const PublicProfileWrapper = ({ user, onLoginClick }) => {
  const { username } = useParams();
  const navigate = useNavigate();
  
  return (
    <PublicProfile 
      username={username} 
      onBack={() => navigate(-1)} 
      setView={(v) => {
        if (v === 'landing') navigate('/');
        else navigate(`/${v}`);
      }}
      user={user}
      onLoginClick={onLoginClick}
      onUserClick={(uname) => {
        navigate(`/profile/${uname}`);
        window.scrollTo({ top: 0 });
      }}
    />
  );
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const getDerivedView = () => {
    const path = location.pathname;
    if (path.startsWith('/workspace/')) return 'workspace';
    if (path === '/submissions') return 'submissions';
    if (path === '/profile') return 'profile';
    if (path.startsWith('/profile/')) return 'public-profile';
    if (path === '/chat') return 'chat';
    if (path === '/explore') return 'explore';
    return 'landing';
  };

  const view = getDerivedView();
  
  const setView = (v) => {
    if (v === 'landing') navigate('/');
    else navigate(`/${v}`);
  };

  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedUsername, setSelectedUsername] = useState(null);
  
  // Scoped User State
  const [user, setUser] = useState(() => {
    return localStorage.getItem('codegravity_user') || null;
  });

  // Verify token on app mount to prevent client-side local storage spoofing
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('codegravity_token');
      const storedUser = localStorage.getItem('codegravity_user');
      
      if (!token) {
        if (storedUser) {
          localStorage.removeItem('codegravity_user');
          setUser(null);
        }
        return;
      }
      
      try {
        const profileData = await apiService.getUserProfile();
        if (profileData && profileData.username) {
          if (user !== profileData.username) {
            setUser(profileData.username);
            localStorage.setItem('codegravity_user', profileData.username);
          }
        }
      } catch (err) {
        console.error('Token verification failed:', err);
        // Clear auth state if unauthorized response is received
        if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
          localStorage.removeItem('codegravity_user');
          localStorage.removeItem('codegravity_token');
          setUser(null);
        }
      }
    };
    verifyToken();
  }, []);

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

  // Load persistent notifications — split by type:
  // Bell (🔔) = follower, badge, system alerts
  // Chat (💬) = message-type notifications counted as unread DMs
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      return;
    }

    const loadNotifications = async () => {
      try {
        const list = await chatService.getNotifications();
        if (Array.isArray(list)) {
          // Bell only shows non-message notifications
          const bellNotifs = list.filter(n => n.type !== 'message');
          setNotifications(bellNotifs);
          const unreads = bellNotifs.filter(n => !n.is_read).length;
          setUnreadNotificationsCount(unreads);
        } else {
          setNotifications([]);
          setUnreadNotificationsCount(0);
        }
      } catch (err) {
        console.error('Failed to load global notifications:', err);
        setNotifications([]);
        setUnreadNotificationsCount(0);
      }
    };

    loadNotifications();
  }, [user, view]);

  // Poll unread DM count every 10 seconds so navbar badge stays fresh
  useEffect(() => {
    if (!user) {
      setUnreadMessagesCount(0);
      return;
    }

    const refreshUnreadDMs = async () => {
      try {
        const convs = await chatService.getConversations();
        if (Array.isArray(convs)) {
          const total = convs.reduce((sum, c) => {
            return sum + (c.unread_counts?.[user] || 0);
          }, 0);
          setUnreadMessagesCount(total);
        }
      } catch (err) {
        // silently fail
      }
    };

    // When user navigates away from chat page, refresh badge
    if (view !== 'chat') {
      refreshUnreadDMs();
      const interval = setInterval(refreshUnreadDMs, 10000);
      return () => clearInterval(interval);
    } else {
      // On chat page, clear the badge
      setUnreadMessagesCount(0);
    }
  }, [user, view]);

  // Also increment badge from WebSocket message events when not on chat page
  useEffect(() => {
    if (!user || view === 'chat') return;

    const handleDMEvent = (event) => {
      if (event.type === 'message' && event.conversation_id && event.sender_username !== user) {
        setUnreadMessagesCount(prev => prev + 1);
      }
    };

    chatService.connect(handleDMEvent);
    return () => chatService.disconnect(handleDMEvent);
  }, [user, view]);

  // Hook real-time WebSocket global notifications
  // Message-type → increments chat badge; everything else → bell
  useEffect(() => {
    if (!user) return;

    const handleGlobalWebSocketEvent = (event) => {
      if (event.type === 'global_notification') {
        if (event.notif_type === 'message' || event.type_tag === 'message' || (event.link && event.link.view === 'chat')) {
          // This is a DM notification — route to chat button badge, not bell
          if (view !== 'chat') {
            setUnreadMessagesCount(prev => prev + 1);
          }
          // Still show a toast so user sees it
          const toastId = Date.now();
          setGlobalToasts(prev => [...prev, {
            id: toastId,
            title: event.title,
            text: event.text,
            link: event.link,
            isMessage: true
          }]);
          setTimeout(() => {
            setGlobalToasts(prev => prev.filter(t => t.id !== toastId));
          }, 4000);
        } else {
          // Bell notification (follower, badge, system)
          setNotifications(prev => [event, ...prev]);
          setUnreadNotificationsCount(prev => prev + 1);

          const toastId = Date.now();
          setGlobalToasts(prev => [...prev, {
            id: toastId,
            title: event.title,
            text: event.text,
            link: event.link,
            isMessage: false
          }]);
          setTimeout(() => {
            setGlobalToasts(prev => prev.filter(t => t.id !== toastId));
          }, 4000);
        }
      }
    };

    chatService.connect(handleGlobalWebSocketEvent);

    return () => {
      chatService.disconnect(handleGlobalWebSocketEvent);
    };
  }, [user, view]);

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
    localStorage.removeItem('codegravity_user');
    localStorage.removeItem('codegravity_token');
    setUser(null);
    setView('landing');
  };

  const handleNotificationClick = async (notif) => {
    try {
      await chatService.markNotificationRead(notif.id);
      setNotifications(prev => 
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
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
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotificationsCount(0);
    } catch (err) {
      console.error("Failed to clear notification logs:", err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await chatService.clearNotifications();
      setNotifications([]);
      setUnreadNotificationsCount(0);
    } catch (err) {
      console.error("Failed to clean notification payloads:", err);
    }
  };

  const handleSolveProblem = (problem) => {
    const id = typeof problem === 'object' && problem !== null ? problem.id : problem;
    navigate(`/workspace/${id}`);
    window.scrollTo({ top: 0 });
  };

  const handleExploreClick = () => {
    navigate('/explore');
    window.scrollTo({ top: 0 });
  };

  const handleNavigateToSection = (sectionId) => {
    if (sectionId === 'problems') {
      navigate('/explore');
      window.scrollTo({ top: 0 });
      return;
    }

    if (view !== 'landing') {
      navigate('/');
    }
    
    setActiveSection(sectionId);
    
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else if (attempts < 20) {
        attempts++;
        setTimeout(tryScroll, 50);
      }
    };
    
    setTimeout(tryScroll, 10);
  };

  return (
    <Routes>
      <Route path="/workspace/:problemId" element={
        <Suspense fallback={<PageLoader />}>
          <WorkspaceWrapper theme={theme} toggleTheme={toggleTheme} />
        </Suspense>
      } />
      <Route path="/*" element={
        <div className="relative min-h-screen bg-slate-50 dark:bg-[#080a10] text-slate-800 dark:text-white font-sans transition-colors duration-300 selection:bg-cyber-cyan/35 selection:text-white select-none">
          {/* Absolute Glow Background Blobs */}
          {view === 'landing' && (
            <>
              <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full radial-glow-cyan pointer-events-none z-0 opacity-20 dark:opacity-30"></div>
              <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full radial-glow-purple pointer-events-none z-0 opacity-20 dark:opacity-30"></div>
              <div className="fixed inset-0 tech-grid opacity-10 dark:opacity-20 pointer-events-none z-0"></div>
            </>
          )}

          {/* Navigation */}
          <Navbar 
            activeSection={view === 'landing' ? activeSection : ""} 
            setActiveSection={setActiveSection} 
            theme={theme} 
            toggleTheme={toggleTheme} 
            user={user}
            onLoginClick={() => setShowAuthModal(true)}
            onLogoutClick={handleLogout}
            onSubmissionsClick={() => navigate('/submissions')}
            onProfileClick={() => navigate('/profile')}
            onNavClick={handleNavigateToSection}
            onChatClick={() => navigate('/chat')}
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

          <Routes>
            <Route path="/" element={
              <main className="relative z-10 w-full overflow-hidden">
                <Hero onExploreClick={handleExploreClick} />
                
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200/30 dark:via-white/5 to-transparent"></div>
                <Features />
                
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200/30 dark:via-white/5 to-transparent"></div>
                <Suspense fallback={<PageLoader />}>
                  <AIAssistant />
                </Suspense>
                
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200/30 dark:via-white/5 to-transparent"></div>
                <Suspense fallback={<PageLoader />}>
                  <Leaderboard 
                    onUserClick={(username) => {
                      navigate(`/profile/${username}`);
                      window.scrollTo({ top: 0 });
                    }} 
                  />
                </Suspense>
              </main>
            } />
            <Route path="/explore" element={
              <Suspense fallback={<PageLoader />}>
                <div className="pt-24 min-h-screen relative z-10 w-full overflow-hidden">
                  <TopicExplorer onSolveProblem={handleSolveProblem} />
                </div>
              </Suspense>
            } />
            <Route path="/submissions" element={
              <Suspense fallback={<PageLoader />}>
                <Submissions onBack={() => navigate('/')} />
              </Suspense>
            } />
            <Route path="/profile" element={
              <Suspense fallback={<PageLoader />}>
                <ProfileDashboard 
                  onBack={() => navigate('/')} 
                  setView={setView} 
                  onUserClick={(uname) => {
                    navigate(`/profile/${uname}`);
                    window.scrollTo({ top: 0 });
                  }}
                />
              </Suspense>
            } />
            <Route path="/profile/:username" element={
              <Suspense fallback={<PageLoader />}>
                <PublicProfileWrapper 
                  user={user}
                  onLoginClick={() => setShowAuthModal(true)}
                />
              </Suspense>
            } />
            <Route path="/chat" element={
              <Suspense fallback={<PageLoader />}>
                <PeerChat onBack={() => navigate('/')} theme={theme} />
              </Suspense>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Footer (hide on chat view) */}
          {view !== 'chat' && (
            <Suspense fallback={<PageLoader />}>
              <Footer />
            </Suspense>
          )}

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
                        navigate('/chat');
                      } else if (targetView === 'public-profile') {
                        navigate(`/profile/${param}`);
                        window.scrollTo({ top: 0 });
                      } else if (targetView === 'profile') {
                        navigate('/profile');
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
      } />
    </Routes>
  );
}
export default App;
