import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { Link } from 'react-router-dom';
import { Loader2, TrendingUp, TrendingDown, Minus, Activity, ChevronRight, ShieldAlert, AlertCircle } from 'lucide-react';
import { Card } from '../../components/dashboard/Card';
import { PageHeader } from '../../components/dashboard/PageHeader';

export default function SkillsList() {
  const { user } = useAuth();
  const [capabilities, setCapabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const employeeData = user?.employeeId && typeof user.employeeId === 'object' ? user.employeeId : null;
  const employeeId = employeeData?._id;

  useEffect(() => {
    if (!employeeId) return;
    
    let isMounted = true;
    setLoading(true);
    setError(null);

    api.get(`/capabilities/employee/${employeeId}`)
      .then(res => {
        if (!isMounted) return;
        setCapabilities(res.data.data || []);
        setLoading(false);
      })
      .catch(err => {
        if (!isMounted) return;
        console.error(err);
        if (err.response?.status === 401) {
          setError('Authentication session expired.');
        } else if (err.response?.status === 403) {
          setError('Not authorized to view this data.');
        } else if (err.response?.status === 404) {
          setError('Employee data not found.');
        } else {
          setError('Failed to load skills. Please try again.');
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [employeeId]);

  if (!employeeData) {
    return (
      <div className="flex h-full items-center justify-center text-[#A5A3B5] text-sm">
        Employee profile setup is incomplete.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center max-w-sm text-center">
          <AlertCircle className="w-10 h-10 text-[#F47B82] mb-3 opacity-80" />
          <h2 className="text-[#17152F] font-bold mb-1">Unable to Load Skills</h2>
          <p className="text-[#77758A] text-xs">{error}</p>
        </div>
      </div>
    );
  }

  const validSkills = capabilities.filter(c => c.capabilityScore !== null && c.capabilityScore !== undefined);
  const insufficientSkills = capabilities.filter(c => c.capabilityScore === null || c.capabilityScore === undefined);

  const TrajectoryMini = ({ dir }) => {
    if (dir === 'IMPROVING') return <TrendingUp className="w-4 h-4 text-[#5FD6B1]" />;
    if (dir === 'DECLINING') return <TrendingDown className="w-4 h-4 text-[#F47B82]" />;
    if (dir === 'STABLE') return <Minus className="w-4 h-4 text-[#A5A3B5]" />;
    return <Activity className="w-4 h-4 text-[#E8E5F0]" />;
  };

  return (
    <div className="animate-in fade-in duration-300 h-full flex flex-col">
      <PageHeader 
        title="My Skills" 
        subtitle="Your digital capability twin based on continuous evidence."
      />

      <div className="flex flex-col lg:flex-row gap-5 flex-1">
        
        {/* Main Content Area (Left 70%) */}
        <div className="flex-1 lg:w-[70%]">
          <Card className="h-full bg-white flex flex-col">
            <h2 className="text-sm font-bold text-[#17152F] mb-4">Measurable Capabilities</h2>
            
            {loading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1,2,3,4].map(i => <div key={i} className="h-24 bg-[#FAFAFC] border border-[#E8E5F0] rounded-xl animate-pulse" />)}
               </div>
            ) : validSkills.length === 0 ? (
              <div className="py-12 flex-1 flex flex-col items-center justify-center text-[#A5A3B5] text-xs font-medium">
                <ShieldAlert className="w-8 h-8 mb-3 opacity-50" />
                <p className="mb-1 text-[#17152F] font-bold">No measurable skills yet.</p>
                <p>Capability estimates appear as TalentTwin collects quantitative evidence.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {validSkills.map(cap => (
                  <Link 
                    key={cap._id} 
                    to={`/dashboard/skills/${cap.skill?._id}`}
                    className="bg-white border border-[#E8E5F0] rounded-xl p-4 hover:border-[#7568D8]/50 hover:shadow-md transition-all group relative overflow-hidden flex items-center justify-between"
                  >
                    <div className="absolute left-0 bottom-0 h-1 bg-[#EFEDF8] w-full">
                      <div className="h-full bg-[#7568D8] transition-all" style={{ width: `${Math.max(cap.capabilityScore * 100, 0)}%` }}></div>
                    </div>
                    <div className="min-w-0 pr-3 pb-1">
                      <div className="text-sm font-bold text-[#17152F] truncate group-hover:text-[#7568D8] transition-colors">{cap.skill?.name || 'Unknown Skill'}</div>
                      <div className="text-[11px] font-medium text-[#77758A] mt-1 capitalize">
                        Lvl {cap.proficiencyLevel} &middot; {cap.evidenceSufficiency?.toLowerCase() || 'insufficient'} ev.
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end pb-1">
                      <div className="text-xl font-extrabold text-[#17152F] mb-1">{(cap.capabilityScore * 100).toFixed(0)}%</div>
                      <TrajectoryMini dir={cap.trajectoryDirection} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Sidebar Panel (Right 30%) */}
        <div className="w-full lg:w-[30%] shrink-0">
          <Card className="h-full bg-[#FAFAFC] flex flex-col">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-bold text-[#17152F]">Developing Profile</h3>
              {!loading && (
                  <div className="text-[10px] font-bold bg-[#E8E5F0] text-[#77758A] px-2 py-0.5 rounded">{insufficientSkills.length}</div>
              )}
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[1,2,3].map(i => <div key={i} className="h-12 bg-white border border-[#E8E5F0] rounded-lg animate-pulse" />)}
                </div>
            ) : insufficientSkills.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center text-xs font-medium text-[#A5A3B5] py-10">No skills currently developing.</div>
            ) : (
              <div className="space-y-2">
                {insufficientSkills.map(cap => (
                  <Link 
                    key={cap._id} 
                    to={`/dashboard/skills/${cap.skill?._id}`}
                    className="p-2.5 -mx-2.5 rounded-lg hover:bg-white border border-transparent hover:border-[#E8E5F0] hover:shadow-sm flex items-center justify-between group transition-all"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-[#17152F] group-hover:text-[#7568D8] truncate">{cap.skill?.name || 'Unknown Skill'}</div>
                      <div className="text-[10px] font-medium text-[#A5A3B5] mt-0.5 truncate">{cap.evidenceCount || 0} observations</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#A5A3B5] group-hover:text-[#7568D8] shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
