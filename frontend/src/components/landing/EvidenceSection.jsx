import React from 'react';
import { motion } from 'framer-motion';
import { FileCheck, GitBranch, Code, Users, Award, Target } from 'lucide-react';

export default function EvidenceSection() {
  const signals = [
    { icon: <FileCheck />, label: "Assessments" },
    { icon: <Code />, label: "Projects" },
    { icon: <Users />, label: "Peer Feedback" },
    { icon: <Target />, label: "KPIs" },
    { icon: <GitBranch />, label: "GitHub" },
    { icon: <Award />, label: "Certifications" }
  ];

  return (
    <div className="pt-32 pb-24 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-20">
        <h2 className="text-emerald-600 font-semibold tracking-wide uppercase text-sm mb-3">Core Concept</h2>
        <h3 className="text-4xl md:text-5xl font-medium mb-6 text-gray-900">Talent isn't static.</h3>
        <p className="text-xl text-gray-500 max-w-3xl mx-auto">
          Traditional profiles capture snapshots (resumes, titles). TalentTwin continuously connects <span className="font-semibold text-gray-800">evidence</span> over time to build a living map.
        </p>
      </div>

      <div className="bg-gray-50 rounded-[32px] p-8 md:p-16 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex-1"
          >
            <h4 className="text-3xl font-medium mb-6 text-gray-900">Every capability starts with evidence.</h4>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              TalentTwin brings together signals from across your organization. But activity is not automatically treated as mastery. Every signal goes through our intelligence engine:
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-gray-700 font-medium bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">1</div>
                Raw Evidence
              </div>
              <div className="flex items-center gap-4 text-gray-700 font-medium bg-white p-4 rounded-2xl shadow-sm border border-gray-100 ml-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">2</div>
                Quality Weighting
              </div>
              <div className="flex items-center gap-4 text-gray-700 font-medium bg-white p-4 rounded-2xl shadow-sm border border-gray-100 ml-8">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">3</div>
                Normalized Score
              </div>
              <div className="flex items-center gap-4 text-emerald-700 font-semibold bg-emerald-50 p-4 rounded-2xl shadow-sm border border-emerald-200 ml-12">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">4</div>
                Verified Capability
              </div>
            </div>
          </motion.div>

          <div className="flex-1 w-full">
            <div className="grid grid-cols-2 gap-4">
              {signals.map((signal, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 text-gray-600 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md hover:border-emerald-200 hover:text-emerald-600"
                >
                  <div className="text-emerald-500">
                    {signal.icon}
                  </div>
                  <span className="font-medium text-sm">{signal.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
