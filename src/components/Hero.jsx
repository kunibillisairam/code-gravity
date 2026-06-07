import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Shield, Sparkles, Code, Play } from 'lucide-react';

const Hero = ({ onExploreClick }) => {
  const [typedText, setTypedText] = useState('');
  const codeString = `// Master the Algorithms of the Universe
function calculateEscapeVelocity(mass, radius) {
  const G = 6.6743e-11; // Gravity Constant
  const escapeVelocity = Math.sqrt((2 * G * mass) / radius);
  
  return {
    velocity: escapeVelocity.toFixed(2) + " m/s",
    status: escapeVelocity > 11186 ? "Orbit Cleared 🚀" : "Trapped"
  };
}

// Executing code...
console.log(calculateEscapeVelocity(5.97e24, 6.37e6));`;

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setTypedText((prev) => prev + codeString.charAt(index));
      index++;
      if (index >= codeString.length) {
        clearInterval(interval);
      }
    }, 18);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="hero" className="relative min-h-[85vh] pt-20 pb-10 px-6 md:px-12 flex flex-col items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#080a10] text-slate-800 dark:text-white transition-colors duration-300 tech-grid">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-cyber-cyan/5 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-cyber-purple/5 rounded-full blur-3xl pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Side: Copy */}
        <div className="lg:col-span-6 flex flex-col text-left space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-200/50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 w-fit text-cyber-cyan font-sans text-xs tracking-wider uppercase font-bold"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyber-cyan animate-pulse animate-bounce" />
            AI-Engine Active
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-sans text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white"
          >
            Defy the Gravity of <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyber-cyan via-blue-550 to-cyber-purple">
              Ordinary Code.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-lg font-light leading-relaxed"
          >
            CodeGravity is a premium solid workspace for developers to practice advanced algorithms, execute templates inside browser terminals, and learn with an active AI coding co-pilot.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onExploreClick}
              className="px-8 py-3.5 bg-cyber-cyan hover:bg-[#00d6e6] text-space-900 font-sans font-bold text-xs tracking-wider uppercase rounded-lg transition-all duration-200 cursor-pointer"
            >
              Start Coding
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const featuresEl = document.getElementById('features');
                if (featuresEl) featuresEl.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-3.5 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-white font-sans font-bold text-xs tracking-wider uppercase rounded-lg transition-all duration-200 bg-white/60 dark:bg-slate-900/40 cursor-pointer"
            >
              Learn More
            </motion.button>
          </motion.div>
        </div>

        {/* Right Side: Solid Developer IDE Console */}
        <div className="lg:col-span-6 relative flex items-center justify-center">
          
          {/* Main IDE Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-850 rounded-xl shadow-2xl relative overflow-hidden z-10"
          >
            {/* Header bar */}
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-850 bg-slate-100/50 dark:bg-[#0b0e17] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block"></span>
                <span className="ml-2 font-mono text-[10px] text-slate-400 dark:text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-cyber-cyan" />
                  gravity_solver.js
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded px-2.5 py-0.5">
                <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400">SANDBOX STABLE</span>
              </div>
            </div>

            {/* Content editor */}
            <div className="p-6 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-300 text-left bg-slate-50 dark:bg-[#090c15] overflow-y-auto max-h-[280px] min-h-[280px] scrollbar-thin">
              <pre className="whitespace-pre-wrap select-none text-indigo-655 dark:text-cyber-cyan">
                {typedText}
                <span className="typing-cursor"></span>
              </pre>
            </div>

            {/* Run Console Simulator */}
            <div className="border-t border-slate-200 dark:border-slate-850 px-6 py-3.5 bg-slate-100/50 dark:bg-[#0b0e17] flex items-center justify-between text-left text-xs font-mono">
              <div className="flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-cyber-cyan fill-current" />
                <span className="text-slate-400 dark:text-slate-500">Output:</span>
                <span className="text-indigo-600 dark:text-cyber-cyan font-medium">11186.04 m/s (Orbit Cleared 🚀)</span>
              </div>
              <span className="text-[9px] text-emerald-650 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 px-2 py-0.5 rounded">
                COMPILE OK
              </span>
            </div>
          </motion.div>

          {/* Floating Solid Badge 1 */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-5 -right-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-lg shadow-lg flex items-center gap-2 z-20"
          >
            <Shield className="w-4 h-4 text-cyber-cyan" />
            <span className="font-sans font-bold text-[9px] tracking-wider text-slate-800 dark:text-cyber-cyan uppercase">Secure Sandbox</span>
          </motion.div>

          {/* Floating Solid Badge 2 */}
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-5 -left-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-lg shadow-lg flex items-center gap-2 z-20"
          >
            <Terminal className="w-4 h-4 text-cyber-purple" />
            <span className="font-sans font-bold text-[9px] tracking-wider text-cyber-purple uppercase">Client Sandbox</span>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
};

export default Hero;
