import React from 'react';
import { Orbit, Send, ChevronUp, MessageSquare } from 'lucide-react';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-slate-50 dark:bg-[#080a10] border-t border-slate-200 dark:border-slate-900 transition-colors duration-300 pt-16 pb-8 px-6 md:px-12 overflow-hidden">
      
      {/* Subtle Star Trails */}
      <div className="absolute inset-0 bg-stellar-sky opacity-10 dark:opacity-20 pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Top Section: Newsletter and Brand */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-12 border-b border-slate-200 dark:border-slate-900">
          {/* Brand Info */}
          <div className="lg:col-span-5 flex flex-col text-left space-y-4">
            <div className="flex items-center gap-2.5 cursor-pointer group w-fit" onClick={scrollToTop}>
              <Orbit className="w-5.5 h-5.5 text-cyber-cyan animate-spin-slow" />
              <span className="font-sans text-lg font-black tracking-widest text-slate-800 dark:text-white">
                CODE<span className="text-cyber-purple">GRAVITY</span>
              </span>
            </div>
            
            <p className="text-slate-555 dark:text-slate-400 text-xs font-light max-w-sm leading-relaxed">
              Bending code, defying logic. Join an elite orbit of developers mastering computational challenges with autonomous neural companions.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-4 pt-2">
              <a href="#" aria-label="GitHub" className="w-9 h-9 rounded bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-450 dark:text-slate-400 hover:text-cyber-cyan hover:border-cyber-cyan/35 hover:shadow-[0_0_10px_rgba(0,240,255,0.1)] transition-all duration-200 shadow-sm cursor-pointer">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </a>
              <a href="#" aria-label="Twitter" className="w-9 h-9 rounded bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-450 dark:text-slate-400 hover:text-cyber-cyan hover:border-cyber-cyan/35 hover:shadow-[0_0_10px_rgba(0,240,255,0.1)] transition-all duration-200 shadow-sm cursor-pointer">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" aria-label="Discord" className="w-9 h-9 rounded bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-450 dark:text-slate-400 hover:text-cyber-cyan hover:border-cyber-cyan/35 hover:shadow-[0_0_10px_rgba(0,240,255,0.1)] transition-all duration-200 shadow-sm cursor-pointer">
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Newsletter Input */}
          <div className="lg:col-span-7 flex flex-col text-left space-y-4">
            <span className="font-sans font-bold text-xs tracking-wider text-slate-800 dark:text-white uppercase">
              Join the Fleet
            </span>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-light max-w-md">
              Subscribe to receive weekly challenges, tournament announcements, and neural network optimization updates directly.
            </p>

            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-3 w-full max-w-md">
              <input
                type="email"
                placeholder="Enter email to subscribe..."
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-xs outline-none text-slate-800 dark:text-white placeholder-slate-550 focus:border-cyber-cyan/40 transition-colors shadow-sm"
              />
              <button
                type="submit"
                className="p-3 bg-cyber-cyan hover:bg-[#00d6e6] text-space-900 rounded-lg transition-all shrink-0 font-bold cursor-pointer"
              >
                <Send className="w-4 h-4 fill-current text-space-900" />
              </button>
            </form>
          </div>
        </div>

        {/* Mid Section: Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 text-left">
          
          {/* COLUMN 1 */}
          <div className="flex flex-col space-y-3">
            <span className="font-sans font-bold text-[10px] tracking-wider text-slate-450 dark:text-slate-500 uppercase">
              Languages
            </span>
            <ul className="space-y-2 text-xs font-light text-slate-500 dark:text-slate-450">
              <li><a href="#" className="hover:text-cyber-cyan transition-colors">Python Deck</a></li>
              <li><a href="#" className="hover:text-cyber-cyan transition-colors">JavaScript Deck</a></li>
              <li><a href="#" className="hover:text-cyber-cyan transition-colors">C++ Deck</a></li>
              <li><a href="#" className="hover:text-cyber-cyan transition-colors">Golang Deck</a></li>
            </ul>
          </div>

          {/* COLUMN 2 */}
          <div className="flex flex-col space-y-3">
            <span className="font-sans font-bold text-[10px] tracking-wider text-slate-450 dark:text-slate-500 uppercase">
              Practice Paths
            </span>
            <ul className="space-y-2 text-xs font-light text-slate-500 dark:text-slate-450">
              <li><a href="#" className="hover:text-cyber-cyan transition-colors">Data Structures</a></li>
              <li><a href="#" className="hover:text-cyber-cyan transition-colors">Algorithms</a></li>
              <li><a href="#" className="hover:text-cyber-cyan transition-colors">Mathematics</a></li>
              <li><a href="#" className="hover:text-cyber-cyan transition-colors">Neural Nets</a></li>
            </ul>
          </div>

          {/* COLUMN 3 */}
          <div className="flex flex-col space-y-3">
            <span className="font-sans font-bold text-[10px] tracking-wider text-slate-450 dark:text-slate-550 uppercase">
              Platform
            </span>
            <ul className="space-y-2 text-xs font-light text-slate-500 dark:text-slate-450">
              <li><a href="#" className="hover:text-cyber-cyan transition-colors">AI Assistant</a></li>
              <li><a href="#" className="hover:text-cyber-cyan transition-colors">Leaderboard</a></li>
              <li><a href="#" className="hover:text-cyber-cyan transition-colors">Arenas</a></li>
            </ul>
          </div>

          {/* COLUMN 4 */}
          <div className="flex flex-col space-y-3">
            <span className="font-sans font-bold text-[10px] tracking-wider text-slate-450 dark:text-slate-550 uppercase">
              Quantum Shields
            </span>
            <ul className="space-y-2 text-xs font-light text-slate-500 dark:text-slate-450">
              <li><a href="#" className="hover:text-cyber-cyan transition-colors">Terms of Orbit</a></li>
              <li><a href="#" className="hover:text-cyber-cyan transition-colors">Data Protocol</a></li>
              <li><a href="#" className="hover:text-cyber-cyan transition-colors">System Security</a></li>
              <li><a href="#" className="hover:text-cyber-cyan transition-colors">API Keys</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Section: Copyright & Back to top */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[10px] font-mono text-slate-450 dark:text-slate-500">
            &copy; {new Date().getFullYear()} CodeGravity Systems. Unauthorized logic gravity-bending prohibited.
          </span>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-250 dark:border-slate-850 hover:border-cyber-cyan/30 text-slate-500 hover:text-cyber-cyan transition-all text-xs font-semibold font-sans uppercase tracking-wider group cursor-pointer"
          >
            <span>To Orbit</span>
            <ChevronUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
