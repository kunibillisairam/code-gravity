import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import { Bell, MessageSquare } from 'lucide-react';
import Features from './components/Features';
import TopicExplorer from './components/TopicExplorer';
import AIAssistant from './components/AIAssistant';
import Leaderboard from './components/Leaderboard';
import Footer from './components/Footer';
import Workspace from './components/Workspace';
import AuthModal from './components/AuthModal';
import Submissions from './components/Submissions';
import ProfileDashboard from './components/ProfileDashboard';
import PublicProfile from './components/PublicProfile';
import PeerChat from './components/PeerChat';
import { chatService } from './services/chatService';
import { apiService } from './services/api';
import { getVirtualProblem } from './data/virtualProblems';
import { PROBLEMS_DB } from './data/problems';

function App() {
  const [view, setView] = useState('landing'); // 'landing' or 'workspace'
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedUsername, setSelectedUsername] = useState(null);
  const [activeSection, setActiveSection] = useState('hero');
  const [user, setUser] = useState(() => localStorage.getItem('codegravity_user'));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [globalToasts, setGlobalToasts] = useState([]);
  const token = localStorage.getItem('codegravity_token');

  // Sync solved problems from backend to local storage scoped keys upon login / mount
  useEffect(() => {
    if (!user || !token) return;

    const syncSolvedProblems = async () => {
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
  }, [user, token]);

  // Load persistent notifications — split by type:
  // Bell (🔔) = follower, badge, system alerts
  // Chat (💬) = message-type notifications counted as unread DMs
  useEffect(() => {
    if (!user || !token) {
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
  }, [user, token, view]);

  // Poll unread DM count every 10 seconds so navbar badge stays fresh
  useEffect(() => {
    if (!user || !token) {
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
  }, [user, token, view]);

  // Also increment badge from WebSocket message events when not on chat page
  useEffect(() => {
    if (!token || !user || view === 'chat') return;

    const handleDMEvent = (event) => {
      if (event.type === 'message' && event.conversation_id && event.sender_username !== user) {
        setUnreadMessagesCount(prev => prev + 1);
      }
    };

    chatService.connect(token, handleDMEvent);
    return () => chatService.disconnect(handleDMEvent);
  }, [token, user, view]);
  // Hook real-time WebSocket global notifications
  // Message-type → increments chat badge; everything else → bell
  useEffect(() => {
    if (!token || !user) return;

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

    chatService.connect(token, handleGlobalWebSocketEvent);

    return () => {
      chatService.disconnect(handleGlobalWebSocketEvent);
    };
  }, [token, user, view]);

  const handleNotificationClick = async (notif) => {
    try {
      await chatService.markNotificationRead(notif.id);
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      );
      setUnreadNotificationsCount(prev => Math.max(0, prev - 1));

      if (notif.link) {
        const { view: targetView, param } = notif.link;
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
    } catch (err) {
      console.error('Failed to handle notification click:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await chatService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotificationsCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await chatService.clearNotifications();
      setNotifications([]);
      setUnreadNotificationsCount(0);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('codegravity_theme');
    return savedTheme || 'light';
  });

  // Sync theme changes with HTML document element class list and localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('codegravity_theme', theme);
  }, [theme]);

  // Monitor scrolling to dynamically update active section in Navbar
  useEffect(() => {
    if (view !== 'landing') return;

    const handleScroll = () => {
      const sections = ['hero', 'features', 'problems', 'ai-assistant', 'leaderboard'];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [view]);

  const handleExploreClick = () => {
    const problemsEl = document.getElementById('problems');
    if (problemsEl) {
      problemsEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSolveProblem = (prob) => {
    if (typeof prob === 'string') {
      setSelectedProblem(PROBLEMS_DB[prob] || PROBLEMS_DB['two-sum']);
    } else if (prob && prob.id) {
      const slug = prob.id;
      if (slug.endsWith('two-sum')) {
        setSelectedProblem(PROBLEMS_DB['two-sum']);
      } else if (slug.endsWith('valid-parentheses')) {
        setSelectedProblem(PROBLEMS_DB['valid-parentheses']);
      } else if (slug.endsWith('container-with-most-water')) {
        setSelectedProblem(PROBLEMS_DB['container-with-most-water']);
      } else {
        const parts = prob.id.split('_');
        if (parts.length >= 3) {
          const lang = parts[0];
          const topicId = parts[1];
          const problemSlug = parts[2];
          
          const virtualProb = getVirtualProblem(
            lang,
            topicId,
            problemSlug,
            prob.title,
            prob.difficulty,
            prob.maxScore
          );
          setSelectedProblem(virtualProb);
        } else {
          setSelectedProblem(PROBLEMS_DB['two-sum']);
        }
      }
    }
    setView('workspace');
    window.scrollTo({ top: 0 });
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLoginSuccess = (username) => {
    setUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem('codegravity_token');
    localStorage.removeItem('codegravity_user');
    setUser(null);
  };

  const handleNavigateToSection = (sectionId) => {
    setView('landing');
    
    let attempts = 0;
    const tryScroll = () => {
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      } else if (attempts < 10) {
        attempts++;
        setTimeout(tryScroll, 50);
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
      <Workspace 
        problem={selectedProblem} 
        onBack={handleBackToExplorer} 
        theme={theme}
        toggleTheme={toggleTheme}
      />
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
        <Submissions onBack={() => setView('landing')} />
        <Footer />
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
          onChatClick={() => setView('chat')}
          notifications={notifications}
          unreadNotificationsCount={unreadNotificationsCount}
          unreadMessagesCount={unreadMessagesCount}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllRead}
          onClearNotifications={handleClearNotifications}
        />
        <ProfileDashboard 
          onBack={() => setView('landing')} 
          setView={setView} 
          onUserClick={(uname) => {
            setSelectedUsername(uname);
            setView('public-profile');
            window.scrollTo({ top: 0 });
          }}
        />
        <Footer />
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
        <Footer />
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
        <PeerChat onBack={() => setView('landing')} theme={theme} />
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

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Main Sections */}
      <main className="relative z-10 w-full overflow-hidden">
        <Hero onExploreClick={handleExploreClick} />
        
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200/30 dark:via-white/5 to-transparent"></div>
        <Features />
        
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200/30 dark:via-white/5 to-transparent"></div>
        <TopicExplorer onSolveProblem={handleSolveProblem} />
        
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200/30 dark:via-white/5 to-transparent"></div>
        <AIAssistant />
        
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200/30 dark:via-white/5 to-transparent"></div>
        <Leaderboard 
          onUserClick={(username) => {
            setSelectedUsername(username);
            setView('public-profile');
            window.scrollTo({ top: 0 });
          }} 
        />
      </main>

      {/* Footer */}
      <Footer />

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
