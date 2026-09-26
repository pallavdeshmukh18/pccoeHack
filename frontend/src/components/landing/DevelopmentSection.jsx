import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DevelopmentSection() {
  return (
    <div className="py-24 px-6 max-w-6xl mx-auto">
      
      <div className="text-center mb-16">
        <h3 className="text-4xl md:text-5xl font-medium mb-6 text-gray-900 leading-tight">
          Turn gaps into <span className="text-emerald-600">development.</span>
        </h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          The AI Development Copilot analyzes prioritized gaps and generates a personalized, actionable roadmap—without hallucinating fake capability scores.
        </p>
      </div>

      <div className="bg-[#0f172a] rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row gap-12">
          
          <div className="flex-1 pt-4 text-white z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium mb-8">
              <BrainCircuit size={16} /> AI Copilot Plan
            </div>
            
            <h4 className="text-2xl font-semibold mb-2">System Design <span className="text-slate-500 text-lg font-normal ml-2">High Priority</span></h4>
            <p className="text-slate-300 mb-8 leading-relaxed italic">
              "Strengthen the ability to design scalable systems and reason about reliability and architectural trade-offs."
            </p>

            <div className="space-y-6">
              <div>
                <h5 className="text-emerald-400 text-sm uppercase tracking-wider font-semibold mb-3">Recommended Actions</h5>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-slate-300">
                    <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Lead the architecture review for the upcoming microservices migration.</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-300">
                    <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Complete advanced distributed systems training module.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-slate-900 rounded-2xl p-6 border border-slate-700/50 relative z-10">
            <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-4">Behind the scenes</div>
            
            <div className="space-y-3 relative">
              <div className="absolute left-[15px] top-4 bottom-4 w-px bg-slate-700"></div>
              
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                className="flex items-center gap-4 relative z-10 bg-slate-800 p-3 rounded-xl border border-slate-700"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center text-xs text-slate-400 shrink-0">1</div>
                <div className="text-sm text-slate-200">Role Gap Identified</div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                className="flex items-center gap-4 relative z-10 bg-slate-800 p-3 rounded-xl border border-slate-700"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center text-xs text-slate-400 shrink-0">2</div>
                <div className="text-sm text-slate-200">Priority Engine Scores Severity</div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
                className="flex items-center gap-4 relative z-10 bg-emerald-900/40 p-3 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs text-black font-bold shrink-0">3</div>
                <div className="text-sm text-emerald-100">AI Generates Interventions</div>
              </motion.div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-800">
              <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-2 transition-colors">
                Explore the AI logic <ArrowRight size={16} />
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
