import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, Bot, User, Cpu, ArrowRight } from 'lucide-react';

const PRESET_PROMPTS = [
  { label: 'Fix Index Out of Bounds', query: 'Why does line 12 fail with index out of bounds?' },
  { label: 'Optimize Complexity', query: 'Optimize my solution to O(N) runtime.' },
  { label: 'Explain Dijkstra Algorithm', query: 'Briefly explain the optimal node state progression of Dijkstra.' }
];

const AI_RESPONSES = {
  'Why does line 12 fail with index out of bounds?': {
    reply: "Ah! Let's inspect line 12: `arr[i] = temp;` \n\nAt the final loop iteration, your counter variable `i` equals `arr.length`. Because standard arrays are 0-indexed, your maximum boundary index is `arr.length - 1`. \n\nFix this by replacing your loop definition from `i <= arr.length` with `i < arr.length`.",
    details: 'Bug resolved | Runtime: 0.1ms'
  },
  'Optimize my solution to O(N) runtime.': {
    reply: "Currently, your nested loops generate an $O(N^2)$ complexity. We can achieve linear $O(N)$ runtime by utilizing a hash map to index target matches in a single pass:\n\n```javascript\nconst map = new Map();\nfor (let i = 0; i < nums.length; i++) {\n  const diff = target - nums[i];\n  if (map.has(diff)) return [map.get(diff), i];\n  map.set(nums[i], i);\n}\n```",
    details: 'Complexity optimized: O(N^2) → O(N)'
  },
  'Briefly explain the optimal node state progression of Dijkstra.': {
    reply: "Dijkstra's Algorithm utilizes a min-priority queue to track the shortest distance to active nodes:\n\n1. Initialize distance to starting node as 0, all others as $\\infty$.\n2. Pop node with the smallest tentative distance.\n3. Relax neighboring edges; if a shorter path is found, update the queue.\n4. Repeat until all nodes are settled.",
    details: 'Algorithm: Dijkstra | Heap Optimized'
  }
};

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Greetings, Pilot. I am your neural co-pilot. Drop a snippet of code, ask about algorithmic complexities, or request optimization steps. What are we refactoring today?",
      details: 'Neural Core Online'
    }
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handlePromptClick = (query) => {
    if (isTyping) return;
    
    // Add user message
    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      const response = AI_RESPONSES[query] || {
        reply: "I am analyzing your request. Based on system parameters, this code executes within safe thresholds.",
        details: "General analysis complete"
      };

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: response.reply,
        details: response.details
      }]);
      setIsTyping(false);
    }, 1800);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!currentInput.trim() || isTyping) return;
    
    const query = currentInput;
    setCurrentInput('');
    handlePromptClick(query);
  };

  return (
    <section id="ai-assistant" className="relative py-12 px-6 md:px-12 bg-slate-50 dark:bg-[#080a10] border-t border-slate-205 dark:border-slate-900 transition-colors duration-300">
      
      {/* Background blurs */}
      <div className="absolute top-[30%] right-[10%] w-[350px] h-[350px] bg-cyber-purple/5 pointer-events-none rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-[20%] left-[10%] w-[350px] h-[350px] bg-cyber-cyan/5 pointer-events-none rounded-full blur-3xl opacity-30"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* LEFT SIDE: Explanatory Copy */}
          <div className="lg:col-span-5 flex flex-col text-left space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-cyber-cyan font-sans text-xs tracking-wider uppercase font-bold w-fit"
            >
              <Brain className="w-3.5 h-3.5 text-cyber-cyan animate-pulse animate-bounce" />
              Autonomous Companion
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight leading-[1.1] text-slate-905 dark:text-white"
            >
              Your Algorithmic <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyber-cyan via-purple-400 to-cyber-purple">
                Copilot in Orbit.
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-light leading-relaxed"
            >
              Never get stuck in a compiler loop again. CodeGravity's built-in AI analyzes your syntax, traces computational complexities, and explains optimal coding patterns, ensuring genuine cognitive growth.
            </motion.p>

            {/* Presets Grid */}
            <div className="flex flex-col space-y-2 pt-1">
              <span className="font-sans font-bold text-[9px] text-slate-450 dark:text-slate-500 tracking-wider uppercase">
                Tap a Preset Command
              </span>
              
              <div className="flex flex-col gap-2">
                {PRESET_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    disabled={isTyping}
                    onClick={() => handlePromptClick(prompt.query)}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e121e] hover:bg-slate-100 dark:hover:bg-[#121626] hover:border-cyber-cyan/30 text-left transition-all duration-200 group cursor-pointer"
                  >
                    <span className="text-slate-700 dark:text-slate-350 text-[11px] font-semibold group-hover:text-cyber-cyan transition-colors">
                      {prompt.label}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-450 dark:text-slate-650 group-hover:text-cyber-cyan group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Animated Chat Simulator Container */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="w-full max-w-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[500px]"
            >
              {/* Chat Header */}
              <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b0e17] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 flex items-center justify-center text-cyber-purple shadow-sm">
                    <Bot className="w-5 h-5 text-cyber-purple" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-[9px] text-cyber-purple bg-cyber-purple/10 px-2 py-0.5 rounded tracking-wider uppercase">
                        AI CO-PILOT
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500">model_gravity_v1.0.8</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-0.5 font-mono text-[9px] text-slate-550 dark:text-slate-400">
                  <Cpu className="w-3.5 h-3.5 text-cyber-cyan" />
                  Latency: 14ms
                </div>
              </div>

              {/* Chat Messages Feed */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 flex flex-col scrollbar-thin bg-slate-50/50 dark:bg-[#090c15]/20">
                <AnimatePresence>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 text-left max-w-[85%] ${
                        msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 border ${
                        msg.sender === 'user'
                          ? 'bg-slate-100 dark:bg-slate-900 border-slate-250 dark:border-cyber-cyan/35 text-cyber-cyan shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-900 border-slate-250 dark:border-cyber-purple/35 text-cyber-purple shadow-sm'
                      }`}>
                        {msg.sender === 'user' ? <User className="w-4 h-4 text-slate-600 dark:text-slate-350" /> : <Bot className="w-4 h-4 text-cyber-purple" />}
                      </div>

                      {/* Bubble */}
                      <div className={`p-4 rounded-xl text-xs font-light leading-relaxed flex flex-col space-y-2 border ${
                        msg.sender === 'user'
                          ? 'bg-cyber-cyan/5 border-cyber-cyan/20 text-slate-800 dark:text-cyber-cyan rounded-tr-none'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        
                        {msg.details && (
                          <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-1.5 mt-1 block">
                            {msg.details}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3 text-left self-start"
                    >
                      <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-cyber-purple">
                        <Bot className="w-4 h-4 animate-bounce text-cyber-purple" />
                      </div>
                      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl rounded-tl-none flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-cyber-cyan rounded-full animate-ping" />
                        <span className="w-1.5 h-1.5 bg-cyber-cyan rounded-full animate-ping [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-cyber-cyan rounded-full animate-ping [animation-delay:0.4s]" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b0e17] flex items-center gap-3">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  disabled={isTyping}
                  placeholder="Ask a question..."
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-xs outline-none text-slate-800 dark:text-white placeholder-slate-500 focus:border-cyber-cyan/40 transition-colors"
                />
                
                <button
                  type="submit"
                  disabled={isTyping || !currentInput.trim()}
                  className="p-3 bg-cyber-cyan hover:bg-[#00d6e6] text-space-900 rounded-lg disabled:opacity-40 transition-all shrink-0 font-bold cursor-pointer"
                >
                  <Send className="w-4 h-4 fill-current text-space-900" />
                </button>
              </form>

            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default AIAssistant;
