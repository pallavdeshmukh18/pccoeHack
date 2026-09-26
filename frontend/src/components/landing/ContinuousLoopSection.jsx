import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ArrowRight } from 'lucide-react';

export default function ContinuousLoopSection() {
  const steps = [
    "Evidence",
    "Capability",
    "Role Gap",
    "Development",
    "Intervention",
    "New Evidence"
  ];

  return (
    <div className="py-24 px-6 max-w-6xl mx-auto border-t border-gray-100">
      
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-6">
          <RefreshCw size={32} />
        </div>
        <h3 className="text-4xl md:text-5xl font-medium mb-6 text-gray-900 leading-tight">
          Development becomes <span className="text-emerald-600">evidence.</span>
        </h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          TalentTwin doesn't stop at recommendations. It tracks what happens next, captures snapshots, and observes how capability changes over time. The loop never closes.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-4 text-gray-800 font-medium">
          {steps.map((step, i) => (
            <React.Fragment key={i}>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
                className={`px-6 py-4 rounded-2xl shadow-sm border ${i === steps.length - 1 ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20' : 'bg-white border-gray-200'}`}
              >
                {step}
              </motion.div>
              
              {i < steps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.05 + 0.02, duration: 0.4 }}
                  className="text-gray-300"
                >
                  <ArrowRight size={24} />
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* The loop back arrow */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-8 flex justify-center"
        >
          <svg width="400" height="60" viewBox="0 0 400 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.path 
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
              d="M 350,10 C 350,50 50,50 50,10" 
              stroke="#10b981" 
              strokeWidth="2" 
              strokeDasharray="6 6" 
              fill="transparent" 
            />
            <motion.path 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 1.3, duration: 0.3 }}
              d="M 45,15 L 50,5 L 55,15" 
              fill="#10b981" 
            />
          </svg>
        </motion.div>
      </div>
      
    </div>
  );
}
