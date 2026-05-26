import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import TopicExplorer from './components/TopicExplorer';
import AIAssistant from './components/AIAssistant';
import Leaderboard from './components/Leaderboard';
import Footer from './components/Footer';
import Workspace from './components/Workspace';
import AuthModal from './components/AuthModal';
import Submissions from './components/Submissions';
import ProfileDashboard from './components/ProfileDashboard';
import { getVirtualProblem } from './data/virtualProblems';
import { PROBLEMS_DB } from './data/problems';

function App() {
  const [view, setView] = useState('landing'); // 'landing' or 'workspace'
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [activeSection, setActiveSection] = useState('hero');
  const [user, setUser] = useState(() => localStorage.getItem('codegravity_user'));
  const [showAuthModal, setShowAuthModal] = useState(false);
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

  const handleBackToExplorer = () => {
    setView('landing');
    setTimeout(() => {
      const problemsEl = document.getElementById('problems');
      if (problemsEl) {
        problemsEl.scrollIntoView({ behavior: 'auto' });
      }
    }, 10);
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
        />
        <ProfileDashboard onBack={() => setView('landing')} />
        <Footer />
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
        <Leaderboard />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
