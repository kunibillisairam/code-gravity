import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Cpu, Trophy, BookOpen, Compass } from 'lucide-react';

const Features = () => {
  const featureList = [
    {
      icon: <Brain className="w-7 h-7 text-cyber-cyan" />,
      title: "AI Coding Assistant",
      desc: "Our neural guide analyzes your code structure in real-time, offering algorithmic insights, optimization suggestions, and custom guidance.",
      hoverBorder: "hover:border-cyber-cyan/50"
    },
    {
      icon: <Cpu className="w-7 h-7 text-cyber-purple" />,
      title: "Real-time Execution",
      desc: "Execute code instantly in JavaScript, Python, C++, and more. Built upon secure client-side browser sandboxing with no latency.",
      hoverBorder: "hover:border-cyber-purple/50"
    },
    {
      icon: <Trophy className="w-7 h-7 text-cyber-magenta" />,
      title: "Competitive Arenas",
      desc: "Engage in timed algorithmic skirmishes, represent your faction, clear global challenges, and claim your spot on the high-score boards.",
      hoverBorder: "hover:border-cyber-magenta/50"
    },
    {
      icon: <BookOpen className="w-7 h-7 text-blue-400" />,
      title: "Personalized Curricula",
      desc: "An adaptive learning map that tracks your execution speeds, memory overheads, and error profiles to serve custom challenges tailored for your growth.",
      hoverBorder: "hover:border-blue-400/50"
    }
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section id="features" className="relative py-12 px-6 md:px-12 overflow-hidden bg-slate-50 dark:bg-[#080a10] text-slate-800 dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-cyber-purple font-sans text-xs tracking-wider uppercase font-semibold w-fit mx-auto"
          >
            <Compass className="w-3.5 h-3.5 text-cyber-purple" />
            Capabilities
          </motion.div>
 
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight"
          >
            Engineered to Propel <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 dark:from-white to-slate-500 dark:to-slate-400">
              Your Coding Velocity.
            </span>
          </motion.h2>
 
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-slate-500 dark:text-slate-400 text-xs font-light max-w-lg mx-auto"
          >
            Say goodbye to clunky interfaces. Embrace a robust, flat-designed developer workspace built for elite problem solvers.
          </motion.p>
        </div>
 
        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
        >
          {featureList.map((feat, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className={`p-6 rounded-xl cursor-pointer overflow-hidden transition-all duration-200 bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-[#111626] shadow-sm dark:shadow-md ${feat.hoverBorder}`}
            >
              <div className="flex flex-col text-left space-y-3">
                <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-colors">
                  {React.cloneElement(feat.icon, { className: 'w-5.5 h-5.5' })}
                </div>
                <h3 className="font-sans text-sm font-bold text-slate-800 dark:text-white tracking-wide transition-colors">
                  {feat.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-light leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
 
      </div>
    </section>
  );
};

export default Features;
