import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, Activity, ChevronRight, ShieldAlert, AlertCircle } from 'lucide-react';
import { Card } from '../../components/dashboard/Card';
import { PageHeader } from '../../components/dashboard/PageHeader';

export default function Trajectory() {
  const { user } = useAuth();
  
  const [capabilities, setCapabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const employeeData = user?.employeeId && typeof user.employeeId === 'object' ? user.employeeId : null;
  const employeeId = employeeData?._id;

  const fetchTrajectory = async (isMounted = true) => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/capabilities/employee/${employeeId}`);
      if (!isMounted) return;
      setCapabilities(res.data.data || []);
    } catch (err) {
      if (!isMounted) return;
      console.error(err);
      if (err.response?.status === 401) setError('Authentication session expired.');
      else if (err.response?.status === 403) setError('Not authorized to view this data.');
      else setError('Failed to load trajectory. Please try again.');
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchTrajectory(isMounted);
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <h2 className="text-[#17152F] font-bold mb-1">Unable to Load Trajectory</h2>
          <p className="text-[#77758A] text-xs mb-4">{error}</p>
          <button onClick={() => fetchTrajectory(true)} className="px-4 py-2 bg-[#F2F1FA] text-[#7568D8] rounded font-bold text-xs">Retry</button>
        </div>
      </div>
    );
  }

  const improving = capabilities.filter(c => c.trajectoryDirection === 'IMPROVING');
  const declining = capabilities.filter(c => c.trajectoryDirection === 'DECLINING');
  const stable = capabilities.filter(c => c.trajectoryDirection === 'STABLE');
  const validTrajectorySkills = capabilities.filter(c => c.trajectoryDirection !== 'INSUFFICIENT_DATA');
  const insufficientHistorySkills = capabilities.filter(c => c.trajectoryDirection === 'INSUFFICIENT_DATA' && c.capabilityScore !== null && c.capabilityScore !== undefined);

  const getVelocityColor = (velocity) => {
    if (velocity > 0) return 'text-[#5FD6B1]';
    if (velocity < 0) return 'text-[#F47B82]';
    return 'text-[#A5A3B5]';
  };

  const getDirectionIcon = (dir) => {
    if (dir === 'IMPROVING') return <TrendingUp className="w-4 h-4 text-[#5FD6B1]" />;
    if (dir === 'DECLINING') return <TrendingDown className="w-4 h-4 text-[#F47B82]" />;
    if (dir === 'STABLE') return <Minus className="w-4 h-4 text-[#A5A3B5]" />;
    return <Activity className="w-4 h-4 text-[#A5A3B5]" />;
  };

  const formatVelocity = (vel) => {
    if (vel === null || vel === undefined) return '—';
    const sign = vel > 0 ? '+' : '';
    return `${sign}${vel.toFixed(3)} / month`;
  };

  return (
    <div className="animate-in fade-in duration-300 h-full flex flex-col relative">
      <PageHeader title="Skill Trajectory" subtitle="Track how your demonstrated capabilities are changing over time." />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5 shrink-0">
        <Card className="py-5 px-6">
          <div className="text-[10px] text-[#77758A] font-bold uppercase tracking-wider mb-2">Improving Skills</div>
          {loading ? (
             <div className="h-9 bg-[#FAFAFC] rounded w-12 animate-pulse" />
          ) : (
             <div className="text-3xl font-extrabold text-[#5FD6B1] mb-1">{improving.length}</div>
          )}
        </Card>
        <Card className="py-5 px-6">
          <div className="text-[10px] text-[#77758A] font-bold uppercase tracking-wider mb-2">Declining Skills</div>
          {loading ? (
             <div className="h-9 bg-[#FAFAFC] rounded w-12 animate-pulse" />
          ) : (
             <div className="text-3xl font-extrabold text-[#F47B82] mb-1">{declining.length}</div>
          )}
        </Card>
        <Card className="py-5 px-6">
          <div className="text-[10px] text-[#77758A] font-bold uppercase tracking-wider mb-2">Stable Skills</div>
          {loading ? (
             <div className="h-9 bg-[#FAFAFC] rounded w-12 animate-pulse" />
          ) : (
             <div className="text-3xl font-extrabold text-[#A5A3B5] mb-1">{stable.length}</div>
          )}
        </Card>
      </div>

      <Card className="flex-1 !p-0 overflow-hidden flex flex-col min-h-0">
        <div className="p-5 border-b border-[#E8E5F0] bg-[#FAFAFC] shrink-0">
          <h2 className="text-sm font-bold text-[#17152F]">Detailed Trajectory Analysis</h2>
        </div>
        
        <div className="flex-1 overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="p-6 space-y-4">
                {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-16 bg-[#FAFAFC] rounded-xl border border-[#E8E5F0] animate-pulse"></div>
                ))}
            </div>
          ) : capabilities.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
                <Activity className="w-8 h-8 text-[#A5A3B5] mb-3 opacity-50" />
                <h3 className="text-[#17152F] font-bold mb-1">No trajectory data yet.</h3>
                <p className="text-[#A5A3B5] text-xs">Trajectory appears after TalentTwin has enough historical evidence to identify a direction.</p>
            </div>
          ) : validTrajectorySkills.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
                <ShieldAlert className="w-8 h-8 text-[#A5A3B5] mb-3 opacity-50" />
                <h3 className="text-[#17152F] font-bold mb-1">Insufficient history.</h3>
                <p className="text-[#A5A3B5] text-xs">Your skills have been measured, but do not yet have enough chronological observations to establish a velocity.</p>
            </div>
          ) : (
            <div className="min-w-[800px] p-5 space-y-3">
              {validTrajectorySkills.map(cap => (
                <Link 
                  key={cap._id} 
                  to={`/dashboard/skills/${cap.skill?._id}`}
                  className="block bg-white hover:bg-[#F9F8FC] border border-[#E8E5F0] rounded-xl p-4 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Skill & Capability */}
                    <div className="w-[30%] shrink-0">
                      <div className="font-bold text-[#17152F] group-hover:text-[#7568D8] transition-colors mb-1 truncate">{cap.skill?.name || 'Unknown Skill'}</div>
                      <div className="text-[10px] font-medium text-[#77758A]">
                        {cap.capabilityScore !== null && cap.capabilityScore !== undefined ? (
                            <>Score <span className="font-bold text-[#17152F]">{(cap.capabilityScore * 100).toFixed(0)}%</span> &middot; Level {cap.proficiencyLevel}</>
                        ) : 'Unquantified Capability'}
                      </div>
                    </div>

                    {/* Middle: Trajectory */}
                    <div className="w-[20%] shrink-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getDirectionIcon(cap.trajectoryDirection)}
                        <span className="text-xs font-bold text-[#17152F] capitalize">{cap.trajectoryDirection.toLowerCase()}</span>
                      </div>
                      <div className={`text-[11px] font-bold ${getVelocityColor(cap.trajectoryVelocity)}`}>
                        {formatVelocity(cap.trajectoryVelocity)}
                      </div>
                    </div>

                    {/* Middle: Evidence Info */}
                    <div className="w-[30%] shrink-0 px-4">
                        <div className="text-xs font-medium text-[#17152F] mb-1">
                            {cap.observationCount !== undefined && cap.observationCount !== null ? `${cap.observationCount} observations` : '—'}
                        </div>
                        <div className="text-[10px] font-medium text-[#A5A3B5] truncate">
                            {cap.firstObservedAt && cap.lastObservedAt ? (
                                `Observed ${new Date(cap.firstObservedAt).toLocaleDateString(undefined, {month:'short', year:'2-digit'})} - ${new Date(cap.lastObservedAt).toLocaleDateString(undefined, {month:'short', year:'2-digit'})}`
                            ) : cap.evidenceSufficiency ? (
                                `${cap.evidenceSufficiency.toLowerCase()} sufficiency`
                            ) : '—'}
                        </div>
                    </div>

                    {/* Right: Confidence */}
                    <div className="w-[15%] shrink-0 text-right pr-4">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-[#A5A3B5] mb-1">Confidence</div>
                        <div className="text-sm font-bold text-[#17152F]">
                            {cap.trajectoryConfidence !== null && cap.trajectoryConfidence !== undefined ? `${(cap.trajectoryConfidence * 100).toFixed(0)}%` : '—'}
                        </div>
                    </div>

                    <div className="shrink-0 flex items-center justify-end">
                      <ChevronRight className="w-5 h-5 text-[#A5A3B5] group-hover:text-[#7568D8] transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}

              {insufficientHistorySkills.length > 0 && (
                <div className="mt-8 pt-6 border-t border-[#E8E5F0] border-dashed">
                    <h3 className="text-[11px] font-bold text-[#A5A3B5] uppercase tracking-wider mb-4">Insufficient History ({insufficientHistorySkills.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {insufficientHistorySkills.map(cap => (
                            <div key={cap._id} className="bg-[#FAFAFC] border border-[#E8E5F0] rounded-lg p-3 flex justify-between items-center opacity-80">
                                <div className="min-w-0 pr-2">
                                    <div className="text-xs font-bold text-[#17152F] truncate mb-0.5">{cap.skill?.name || '—'}</div>
                                    <div className="text-[10px] text-[#A5A3B5] truncate">{(cap.capabilityScore * 100).toFixed(0)}% &middot; Needs more evidence</div>
                                </div>
                                <Activity className="w-4 h-4 text-[#A5A3B5] shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
