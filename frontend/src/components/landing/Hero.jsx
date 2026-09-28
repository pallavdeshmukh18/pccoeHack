import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Activity, Brain, LineChart, Network, Workflow, Target, GitMerge } from 'lucide-react';

export default function Hero() {
  const shouldReduceMotion = useReducedMotion();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center justify-center text-center">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10"
      >
        <motion.div variants={item} className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 mb-6 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          AI-powered talent intelligence
        </motion.div>

        <motion.h1 variants={item} className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight text-white mb-8 leading-[1.1]">
          Understand talent.<br />
          <span className="text-gray-400">Grow continuously.</span>
        </motion.h1>
        
        <motion.p variants={item} className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 mb-12 leading-relaxed">
          TalentTwin transforms scattered employee evidence into a living map of capabilities, skill trajectories, role gaps, and development opportunities.
        </motion.p>

        <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-full transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_4px_20px_rgba(16,185,129,0.3)] active:translate-y-0 active:scale-[0.98] text-lg flex items-center gap-2">
            Explore TalentTwin
          </Link>
          <button className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-full transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98] text-lg flex items-center gap-2">
            See How It Works
          </button>
        </motion.div>
      </motion.div>

      {/* Decorative floating icons - static and subtle */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1 }} className="absolute left-20 top-40 text-emerald-500/10">
        <Activity size={64} />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 1 }} className="absolute right-20 top-60 text-emerald-500/10">
        <LineChart size={80} />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }} className="absolute left-1/4 bottom-10 text-emerald-500/10">
        <Brain size={48} />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 1 }} className="absolute right-1/4 bottom-20 text-emerald-500/5">
        <Workflow size={56} />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0, duration: 1 }} className="absolute left-[10%] top-[70%] text-emerald-500/5">
        <Network size={72} />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 1 }} className="absolute right-[15%] top-20 text-emerald-500/10">
        <Target size={40} />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 1 }} className="absolute left-[30%] top-20 text-emerald-500/5">
        <GitMerge size={32} />
      </motion.div>
    </div>
  );
}
