import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LogOut, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPlaceholder() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="text-emerald-500 w-6 h-6" />
          <span className="font-semibold text-white tracking-wide">TalentTwin</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="text-gray-400">Welcome, </span>
            <span className="text-gray-200 font-medium">{user?.name}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <BrainCircuit className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-medium text-white mb-4">Talent Intelligence Dashboard</h1>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            Your authenticated session is active. This space is a placeholder and will be replaced with the actual skill twin interface in Phase 8.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-sm text-gray-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Role: {user?.role}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
