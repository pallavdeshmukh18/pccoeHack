import React from 'react';
import { motion } from 'framer-motion';

export default function AICopilotSection() {
  return (
    <div className="py-24 px-6 max-w-6xl mx-auto bg-gray-50 rounded-[40px] my-12 border border-gray-100 text-center">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-12"
      >
        <h3 className="text-3xl md:text-4xl font-medium mb-6 text-gray-900 leading-tight">
          AI that explains <span className="text-emerald-600">what to do next.</span>
        </h3>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          TalentTwin's intelligence engine establishes the evidence-backed capability state. Its AI Development Copilot turns that state into personalized development guidance. We never let AI guess your capability—we use it to help you grow.
        </p>
      </motion.div>

    </div>
  );
}
