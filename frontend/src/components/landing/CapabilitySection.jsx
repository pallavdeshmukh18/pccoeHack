import React, { useEffect, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { ShieldCheck, TrendingUp, BarChart3 } from 'lucide-react';

function Counter({ from, to }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (isInView) {
      const controls = animate(from, to, {
        duration: 0.8,
        ease: "easeOut",
        onUpdate(value) {
          setValue(Math.round(value));
        }
      });
      return () => controls.stop();
    }
  }, [from, to, isInView]);

  return <span ref={ref}>{value}</span>;
}

export default function CapabilitySection() {
  return (
    <div className="py-24 px-6 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
      
      <div className="flex-1">
        <h3 className="text-4xl md:text-5xl font-medium mb-6 text-gray-900 leading-tight">
          Know what someone can <span className="text-emerald-600">demonstrate.</span>
        </h3>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          The intelligence engine calculates a precise, confidence-weighted capability score based exclusively on verified evidence. No more guessing from resumes.
        </p>
      </div>

      <div className="flex-1 w-full relative">
        {/* Abstract background glow */}
        <div className="absolute inset-0 bg-emerald-400/20 blur-[80px] rounded-full"></div>
        
        {/* Product UI Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 bg-[#0f172a] rounded-[24px] p-8 border border-slate-800 shadow-2xl text-white overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
          
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="text-emerald-400 font-medium text-sm tracking-wide mb-1 uppercase">Technical Skill</div>
              <h4 className="text-2xl font-semibold">System Design</h4>
            </div>
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-emerald-400">
              <ShieldCheck size={24} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
              <div className="text-slate-400 text-sm mb-2">Current Capability</div>
              <div className="text-3xl font-light">Level 2.4</div>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
              <div className="text-slate-400 text-sm mb-2">Confidence</div>
              <div className="text-3xl font-light flex items-baseline gap-2">
                <Counter from={0} to={84} />
                <span className="text-lg text-emerald-400">%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp size={20} />
              <span className="font-medium">Improving</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <BarChart3 size={20} />
              <span>12 observations</span>
            </div>
          </div>

        </motion.div>
      </div>
      
    </div>
  );
}
