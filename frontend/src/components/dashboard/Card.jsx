import React from 'react';
export const Card = ({ children, className = '', noPadding = false }) => (
  <div className={`bg-white border border-[#E8E5F0] rounded-xl flex flex-col shadow-[0_4px_20px_rgba(50,40,90,0.03)] ${noPadding ? '' : 'p-5'} ${className}`}>
    {children}
  </div>
);
