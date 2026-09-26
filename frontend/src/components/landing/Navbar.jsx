import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 text-gray-300">
      <div className="flex items-center gap-12">
        <Link to="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-emerald-400 to-green-600 flex items-center justify-center text-xs text-black">
            TT
          </div>
          TalentTwin
        </Link>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a href="#" className="hover:text-white transition-colors">Product</a>
          <a href="#" className="hover:text-white transition-colors">How It Works</a>
          <a href="#" className="hover:text-white transition-colors">Intelligence</a>
          <a href="#" className="hover:text-white transition-colors">AI Copilot</a>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm font-medium">
        <Link to="/login" className="hidden md:block hover:text-white transition-colors">Log In</Link>
        <Link to="/signup" className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-full transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_2px_10px_rgba(16,185,129,0.2)] active:translate-y-0 active:scale-[0.98]">
          Get Started
        </Link>
      </div>
    </nav>
  );
}
