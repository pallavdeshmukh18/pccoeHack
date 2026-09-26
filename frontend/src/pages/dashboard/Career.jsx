import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { Briefcase, ChevronRight, Activity, Zap, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/dashboard/Card';
import { PageHeader } from '../../components/dashboard/PageHeader';

export default function Career() {
  const { user } = useAuth();
  const [roleGaps, setRoleGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const employeeData = user?.employeeId && typeof user.employeeId === 'object' ? user.employeeId : null;
  const employeeId = employeeData?._id;

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    api.get(`/role-gaps/employee/${employeeId}`)
      .then(res => setRoleGaps(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (!employeeId) return null;

  const getReadinessColor = (state) => {
    if (state === 'MEETS_REQUIREMENTS') return 'text-[#5FD6B1] bg-[#F0FBF7] border-[#D6F4EA]';
    if (state === 'HAS_GAPS') return 'text-[#F47B82] bg-[#FDF0F1] border-[#FADCDD]';
    return 'text-[#A5A3B5] bg-[#F7F6FB] border-[#E8E5F0]';
  };

  return (
    <div className="animate-in fade-in duration-300 h-full flex flex-col">
      <PageHeader title="Career & Roles" subtitle="Map your current capability to potential career paths." />
      
      {loading ? (
        <div className="flex justify-center p-10"><Activity className="w-6 h-6 text-[#7568D8] animate-spin" /></div>
      ) : roleGaps.length === 0 ? (
        <Card className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 bg-[#F6F5FB] rounded-full flex items-center justify-center mb-4 border border-[#E8E5F0]">
            <Briefcase className="w-6 h-6 text-[#7568D8]" />
          </div>
          <h3 className="text-sm font-bold text-[#17152F] mb-2">No roles mapped</h3>
          <p className="text-xs font-medium text-[#77758A] max-w-sm text-center">
            TalentTwin needs more quantitative capability data or mapped roles before it can confidently match you to adjacent career paths.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roleGaps.map(gap => {
            const matchScore = gap.totalRequiredSkills > 0 ? (gap.meetsCount / gap.totalRequiredSkills) : 0;
            const missingSkills = gap.skills?.filter(s => s.status === 'GAP' || s.status === 'NEAR_GAP') || [];
            return (
            <Card key={gap._id} className="flex flex-col h-full hover:border-[#7568D8]/50 transition-colors group cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#F6F5FB] border border-[#E8E5F0] flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-[#7568D8]" />
                </div>
                <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${getReadinessColor(gap.roleStatus)}`}>
                  {(gap.roleStatus || 'UNKNOWN').replace('_', ' ')}
                </span>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-bold text-[#17152F] group-hover:text-[#7568D8] transition-colors">{gap.jobRole?.title || 'Role'}</h3>
                <p className="text-[11px] font-medium text-[#77758A] mt-1">{gap.jobRole?.department || 'Department'}</p>
              </div>
              
              <div className="mb-4 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#A5A3B5] mb-2">Capability Alignment</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-[#F2F1FA] rounded-full overflow-hidden">
                    <div className="h-full bg-[#7568D8]" style={{ width: `${Math.max(matchScore * 100, 5)}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-[#17152F]">{(matchScore * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="border-t border-[#E8E5F0] pt-4 mt-auto">
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-medium text-[#77758A]">Missing Skills:</span>
                  <span className="font-bold text-[#F47B82]">{missingSkills.length}</span>
                </div>
                {missingSkills.slice(0,2).map((g, i) => (
                  <div key={i} className="text-[10px] text-[#A5A3B5] truncate flex items-center gap-1.5 mb-1">
                    <Zap className="w-3 h-3 text-[#F47B82]" /> {g.skill?.name || 'Skill'}
                  </div>
                ))}
              </div>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  );
}
