import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, AlertTriangle } from 'lucide-react';

export default function RoleGapSection() {
  return (
    <div className="py-24 px-6 max-w-6xl mx-auto flex flex-col md:flex-row-reverse items-center gap-16">
      
      <div className="flex-1">
        <h3 className="text-4xl md:text-5xl font-medium mb-6 text-gray-900 leading-tight">
          Connect talent to what the role <span className="text-emerald-600">actually requires.</span>
        </h3>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          TalentTwin compares verified capabilities against role requirements. It intelligently identifies gaps, near-gaps, and areas with insufficient evidence—without penalizing employees for missing data.
        </p>
      </div>

      <div className="flex-1 w-full relative">
        <div className="absolute inset-0 bg-blue-400/10 blur-[80px] rounded-full"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 bg-white rounded-[24px] p-8 border border-gray-200 shadow-xl overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Briefcase size={20} />
            </div>
            <div>
              <div className="text-gray-500 text-sm">Target Role</div>
              <div className="text-gray-900 font-semibold">Software Engineer</div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border border-red-100 bg-red-50/50 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">System Design</h4>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="text-red-600 text-sm flex items-center gap-1 font-medium mt-1"
                  >
                    <AlertTriangle size={14} /> 2 Level Gap
                  </motion.div>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full uppercase tracking-wider">High Importance</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4 relative">
                {/* Visual Gap Line connecting the two levels */}
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: "calc(50% - 2rem)" }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
                  className="absolute top-1/2 left-[25%] h-px bg-red-300 border-t border-dashed border-red-400 hidden sm:block" 
                />
                
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Required</div>
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div> Level 4
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Current</div>
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> Level 2
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="border border-gray-200 bg-gray-50 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">Database Management</h4>
                  <div className="text-gray-500 text-sm font-medium mt-1">
                    Insufficient Evidence
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 italic">No quantitative signals mapped to this skill yet.</p>
            </div>
          </div>

        </motion.div>
      </div>
      
    </div>
  );
}
