const fs = require('fs');

let content = fs.readFileSync('src/pages/dashboard/Career.jsx', 'utf8');

// We'll add a selectedGap state for the modal.
const imports = `import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { Briefcase, ChevronRight, Activity, Zap, CheckCircle2, X } from 'lucide-react';
import { Card } from '../../components/dashboard/Card';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Link } from 'react-router-dom';`;

content = content.replace(/import React[\s\S]*?PageHeader';/, imports);

const stateCode = `  const [roleGaps, setRoleGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGap, setSelectedGap] = useState(null);`;

content = content.replace(/  const \[roleGaps, setRoleGaps\] = useState\(\[\]\);\n  const \[loading, setLoading\] = useState\(true\);/, stateCode);

// Modify the card mapping to add onClick
content = content.replace(/<Card key=\{gap\._id\} className="flex flex-col h-full hover:border-\[\#7568D8\]\/50 transition-colors group cursor-pointer">/g, 
`<Card key={gap._id} onClick={() => setSelectedGap(gap)} className="flex flex-col h-full hover:border-[#7568D8]/50 transition-colors group cursor-pointer relative">`);

// Add modal code at the end of the return statement before the closing div
const modalCode = `
      {/* Modal */}
      {selectedGap && (
        <div className="fixed inset-0 bg-[#17152F]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200 !p-0 overflow-hidden">
            <button 
              onClick={() => setSelectedGap(null)}
              className="absolute top-4 right-4 p-2 hover:bg-[#F2F1FA] rounded-full transition-colors text-[#A5A3B5] hover:text-[#17152F]"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="p-6 border-b border-[#E8E5F0] bg-[#FAFAFC]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E5F0] flex items-center justify-center shrink-0 shadow-sm">
                  <Briefcase className="w-5 h-5 text-[#7568D8]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#17152F]">{selectedGap.jobRole?.title}</h2>
                  <p className="text-xs font-medium text-[#77758A]">{selectedGap.jobRole?.department}</p>
                </div>
                <span className={\`ml-auto text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded border \${getReadinessColor(selectedGap.roleStatus)}\`}>
                  {(selectedGap.roleStatus || 'UNKNOWN').replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-bold text-[#17152F]">Capability Alignment</span>
                  <span className="font-bold text-[#7568D8]">
                    {((selectedGap.meetsCount / Math.max(selectedGap.totalRequiredSkills, 1)) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2.5 bg-[#F2F1FA] rounded-full overflow-hidden">
                  <div className="h-full bg-[#7568D8] rounded-full" style={{ width: \`\${Math.max((selectedGap.meetsCount / Math.max(selectedGap.totalRequiredSkills, 1)) * 100, 2)}%\` }}></div>
                </div>
              </div>

              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A5A3B5] mb-4">Skill Requirements ({selectedGap.skills?.length || 0})</h3>
              
              <div className="space-y-3">
                {selectedGap.skills?.map(s => {
                  const isGap = s.status === 'GAP' || s.status === 'NEAR_GAP';
                  return (
                    <div key={s.skill?._id} className={\`p-4 rounded-xl border flex items-center justify-between \${isGap ? 'bg-[#FDF0F1]/50 border-[#FADCDD]' : 'bg-white border-[#E8E5F0]'}\`}>
                      <div>
                        <div className="font-bold text-sm text-[#17152F] flex items-center gap-2">
                          {s.skill?.name}
                          {isGap && <Zap className="w-3.5 h-3.5 text-[#F47B82]" />}
                        </div>
                        <div className="text-[10px] text-[#77758A] mt-1 font-medium">Importance: {s.importance}</div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-xs text-right">
                        <div>
                          <div className="text-[#A5A3B5] mb-1">Required</div>
                          <div className="font-bold text-[#17152F]">Lvl {s.requiredLevel}</div>
                        </div>
                        <div>
                          <div className="text-[#A5A3B5] mb-1">Current</div>
                          <div className={\`font-bold \${isGap ? 'text-[#F47B82]' : 'text-[#5FD6B1]'}\`}>
                            {s.currentProficiencyLevel ? \`Lvl \${s.currentProficiencyLevel}\` : 'None'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div className="p-6 border-t border-[#E8E5F0] bg-[#FAFAFC] flex justify-end gap-3">
              <Link 
                to="/dashboard/development"
                className="px-6 py-2.5 bg-[#7568D8] hover:bg-[#6355C5] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                Go to Development Plan <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </Card>
        </div>
      )}
`;

content = content.replace(/      \}\)\}\n        <\/div>\n      \)\}\n    <\/div>/, `      })\}
        </div>
      )\}
${modalCode}    </div>`);

fs.writeFileSync('src/pages/dashboard/Career.jsx', content);
