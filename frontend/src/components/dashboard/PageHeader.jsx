import React from 'react';
export const PageHeader = ({ title, subtitle, rightNode }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
    <div>
      <h1 className="text-xl font-semibold text-[#17152F] tracking-tight mb-1">{title}</h1>
      {subtitle && <p className="text-xs text-[#77758A]">{subtitle}</p>}
    </div>
    {rightNode && <div>{rightNode}</div>}
  </div>
);
