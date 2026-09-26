import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function TrajectorySection() {
  return (
    <div className="py-24 px-6 max-w-6xl mx-auto bg-gray-50 rounded-[40px] my-12 border border-gray-100 shadow-sm relative overflow-hidden">
      
      <div className="text-center mb-16 relative z-10">
        <h3 className="text-4xl md:text-5xl font-medium mb-6 text-gray-900 leading-tight">
          Don't just see where talent is.<br />
          <span className="text-emerald-600">See where it's going.</span>
        </h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          TalentTwin tracks capability over time. We calculate velocity to identify if an employee is improving, stable, or declining before it affects performance.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 relative z-10 max-w-4xl mx-auto">
        
        {/* Improving Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex-1 bg-white rounded-3xl p-8 border border-emerald-100 shadow-lg shadow-emerald-500/5"
        >
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
            <TrendingUp size={24} />
          </div>
          <h4 className="text-xl font-semibold mb-2 text-gray-900">Improving</h4>
          <p className="text-gray-500 text-sm mb-6">Velocity {'>'} +0.01 / 30d</p>
          
          <div className="h-24 w-full flex items-end gap-2">
            {[30, 40, 45, 60, 75, 85].map((h, i) => (
              <motion.div 
                key={i}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: 0.1 + (i * 0.05), duration: 0.5, ease: "easeOut" }}
                className="flex-1 bg-emerald-400 rounded-t-md origin-bottom"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </motion.div>

        {/* Stable Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          className="flex-1 bg-white rounded-3xl p-8 border border-gray-200 shadow-sm opacity-60"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600 mb-6">
            <Minus size={24} />
          </div>
          <h4 className="text-xl font-semibold mb-2 text-gray-900">Stable</h4>
          <p className="text-gray-500 text-sm mb-6">Steady capability</p>
          
          <div className="h-24 w-full flex items-end gap-2">
            {[60, 60, 60, 60, 60, 60].map((h, i) => (
              <motion.div 
                key={i}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: 0.15 + (i * 0.05), duration: 0.5, ease: "easeOut" }}
                className="flex-1 bg-gray-300 rounded-t-md origin-bottom" 
                style={{ height: `${h}%` }} 
              />
            ))}
          </div>
        </motion.div>

        {/* Declining Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          className="flex-1 bg-white rounded-3xl p-8 border border-gray-200 shadow-sm opacity-60"
        >
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6">
            <TrendingDown size={24} />
          </div>
          <h4 className="text-xl font-semibold mb-2 text-gray-900">Declining</h4>
          <p className="text-gray-500 text-sm mb-6">Velocity {'<'} -0.01 / 30d</p>
          
          <div className="h-24 w-full flex items-end gap-2">
            {[80, 75, 60, 50, 40, 35].map((h, i) => (
              <motion.div 
                key={i} 
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: 0.25 + (i * 0.05), duration: 0.5, ease: "easeOut" }}
                className="flex-1 bg-red-200 rounded-t-md origin-bottom" 
                style={{ height: `${h}%` }} 
              />
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
