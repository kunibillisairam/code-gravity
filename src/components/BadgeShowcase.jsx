import React from 'react';
import { Trophy, Zap, Flame, Award, Check } from 'lucide-react';

const badgeDetails = {
  first_success: {
    id: "first_success",
    title: "First Success",
    desc: "Unlock your first Accepted code challenge.",
    icon: <Trophy className="w-5 h-5" />
  },
  speed_demon: {
    id: "speed_demon",
    title: "Speed Demon",
    desc: "Compile and execute code successfully in under 100ms.",
    icon: <Zap className="w-5 h-5" />
  },
  streak_master: {
    id: "streak_master",
    title: "Streak Master",
    desc: "Maintain a consecutive 3-day active coding streak.",
    icon: <Flame className="w-5 h-5" />
  },
  algorithm_alchemist: {
    id: "algorithm_alchemist",
    title: "Algorithm Alchemist",
    desc: "Complete 5 unique programming problems successfully.",
    icon: <Award className="w-5 h-5" />
  }
};

const BadgeShowcase = ({ unlockedBadges = [] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
      {Object.values(badgeDetails).map((badge) => {
        const isUnlocked = unlockedBadges.includes(badge.id);

        return (
          <div 
            key={badge.id}
            className={`p-4 rounded-xl border flex items-center gap-3.5 transition-all select-none ${
              isUnlocked 
                ? 'border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/5 shadow-inner' 
                : 'border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/10 opacity-50 grayscale'
            }`}
          >
            <div className={`p-3 rounded-xl border shrink-0 ${
              isUnlocked
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-space-900 border-transparent shadow-md'
                : 'bg-slate-100 dark:bg-slate-900 border-slate-250 dark:border-slate-800 text-slate-400'
            }`}>
              {badge.icon}
            </div>

            <div className="space-y-0.5">
              <h4 className={`text-xs font-black font-sans uppercase ${isUnlocked ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                {badge.title}
              </h4>
              <p className="text-[10px] text-slate-455 dark:text-slate-500 font-light leading-relaxed">
                {badge.desc}
              </p>
              {isUnlocked && (
                <div className="text-[8px] font-mono text-emerald-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Unlocked
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BadgeShowcase;
export { badgeDetails };
