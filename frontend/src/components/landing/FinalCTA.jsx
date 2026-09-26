import React from 'react';
import { motion } from 'framer-motion';

export default function FinalCTA() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative z-10 py-32 px-6 flex flex-col items-center justify-center text-center text-white"
    >
      <h2 className="text-5xl md:text-6xl font-medium tracking-tight mb-8">
        Build a workforce<br />that keeps learning.
      </h2>
      <p className="text-xl text-emerald-100/80 mb-12 max-w-2xl">
        Move from static talent profiles to continuously evolving capability intelligence. Start building your evidence-backed talent map today.
      </p>
      <button className="px-10 py-5 bg-white text-[#00a859] hover:bg-emerald-50 font-bold rounded-full transition-colors shadow-2xl text-lg">
        Explore TalentTwin
      </button>
      
      <div className="mt-32 pt-8 border-t border-emerald-500/30 w-full max-w-6xl flex flex-col md:flex-row items-center justify-between text-emerald-100/60 text-sm">
        <div>© 2026 TalentTwin. All rights reserved.</div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </motion.div>
  );
}
