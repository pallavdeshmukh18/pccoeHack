import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { ArrowUpRight, CheckCircle2, BrainCircuit, Activity, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/dashboard/Card';
import { PageHeader } from '../../components/dashboard/PageHeader';

export default function Overview() {
  const { user } = useAuth();
  
  const [data, setData] = useState({ capabilities: [], priorities: [], evidence: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Safely extract employeeId according to requirements
  const employeeData = user?.employeeId && typeof user.employeeId === 'object' ? user.employeeId : null;
  const employeeId = employeeData?._id;

  useEffect(() => {
    if (!employeeId) return;
    
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get(`/capabilities/employee/${employeeId}`),
      api.get(`/development-priorities/employee/${employeeId}`),
      api.get(`/evidence?employeeId=${employeeId}`)
    ]).then(([capRes, priRes, evRes]) => {
      if (!isMounted) return;
      setData({
        capabilities: capRes.data.data || [],
        priorities: priRes.data.data || [],
        evidence: evRes.data.data || []
      });
      setLoading(false);
    }).catch(err => {
      if (!isMounted) return;
      console.error(err);
      if (err.response?.status === 401) {
        setError('Authentication session expired.');
      } else if (err.response?.status === 403) {
        setError('Not authorized to view this data.');
      } else if (err.response?.status === 404) {
        setError('Employee data not found.');
      } else {
        setError('Failed to load dashboard data. Please try again.');
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
          <h2 className="text-[#17152F] font-bold mb-1">Unable to Load Dashboard</h2>
          <p className="text-[#77758A] text-xs">{error}</p>
        </div>
      </div>
    );
  }

  const { capabilities, priorities, evidence } = data;
  
  // Explicit explicit null check
  const validCaps = capabilities.filter(c => c.capabilityScore !== null && c.capabilityScore !== undefined);
  
  const allPriorities = priorities
    .flatMap(p => p.priorities || [])
    .filter(p => p.status === 'GAP' || p.status === 'NEAR_GAP');

  // Trajectory uses evidence with valid quantitative signal, sorted ascending chronologically
  const quantitativeEvidenceAsc = [...evidence]
    .filter(e => e.normalizedValue !== null && e.normalizedValue !== undefined)
    .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

  // Recent evidence uses all evidence, sorted descending
  const recentEvidenceDesc = [...evidence]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 8);

  const getPriorityColor = (level) => {
    if (level === 'CRITICAL') return 'text-[#F47B82] bg-[#FDF0F1] border-[#FADCDD]';
    if (level === 'HIGH') return 'text-[#7568D8] bg-[#F2F1FA] border-[#E8E5F0]';
    if (level === 'MEDIUM') return 'text-[#F3C85E] bg-[#FEF9F0] border-[#FCECD0]';
    return 'text-[#5FD6B1] bg-[#F0FBF7] border-[#D6F4EA]';
  };

  const metricCards = [
    { label: 'Overall Capability', value: '—', context: 'Insufficient data for aggregate' },
    { label: 'Skills Tracked', value: validCaps.length, context: 'Active utilization' },
    { label: 'Development', value: allPriorities.length, context: 'Confirmed gaps' }
  ];

  return (
    <div className="animate-in fade-in duration-300 h-full flex flex-col">
      <PageHeader 
        title="Dashboard Overview" 
        subtitle={`Good morning, ${employeeData.firstName}. Here is your capability intelligence.`}
        rightNode={
          <div className="text-[10px] uppercase tracking-wider font-bold text-[#7568D8] bg-[#F2F1FA] px-2.5 py-1.5 rounded-full border border-[#E8E5F0]">
            {employeeData.jobTitle || 'EMPLOYEE'}
          </div>
        }
      />

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        {metricCards.map((m, i) => (
          <Card key={i} className="py-5 px-6">
            <div className="text-[10px] text-[#77758A] font-bold uppercase tracking-wider mb-2">{m.label}</div>
            {loading ? (
              <div className="h-9 bg-[#FAFAFC] border border-[#E8E5F0] rounded w-16 mb-1 animate-pulse" />
            ) : (
              <div className="text-3xl font-extrabold text-[#17152F] mb-1">{m.value}</div>
            )}
            <div className="text-[11px] text-[#A5A3B5] font-medium">{m.context}</div>
          </Card>
        ))}
      </div>

      {/* Main Dense Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 flex-1">
        
        {/* LEFT COLUMN 70% */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Main Analytics Panel */}
          <Card className="flex-1 min-h-[300px] flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h2 className="text-sm font-bold text-[#17152F]">Observed Evidence Signals</h2>
              <div className="flex gap-2">
                <span className="text-[10px] font-semibold bg-[#F7F6FB] border border-[#E8E5F0] text-[#77758A] px-2 py-1 rounded">Chronological</span>
              </div>
            </div>
            
            {loading ? (
              <div className="flex-1 flex items-end gap-1.5 items-stretch relative z-10 animate-pulse">
                 {[1,2,3,4,5,6,7].map(i => (
                    <div key={i} className="flex-1 bg-[#FAFAFC] border border-[#E8E5F0] rounded-t-sm h-full" />
                 ))}
              </div>
            ) : quantitativeEvidenceAsc.length < 2 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[#A5A3B5] text-xs border border-[#E8E5F0] border-dashed rounded-lg bg-[#FAFAFC]">
                <Activity className="w-6 h-6 mb-2 opacity-50" />
                Insufficient quantitative evidence data to plot trajectory.
              </div>
            ) : (
              <div className="flex-1 flex items-end gap-1.5 items-stretch relative z-10">
                {/* Extremely subtle background grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-5">
                  <div className="w-full h-px bg-[#F2F1FA]"></div>
                  <div className="w-full h-px bg-[#F2F1FA]"></div>
                  <div className="w-full h-px bg-[#F2F1FA]"></div>
                  <div className="w-full h-px bg-[#F2F1FA]"></div>
                </div>

                {/* Simplified Bar Chart */}
                {quantitativeEvidenceAsc.slice(-15).map(ev => (
                  <div key={ev._id} className="flex-1 flex flex-col justify-end group relative z-10">
                    <div className="text-[9px] font-bold text-[#7568D8] text-center mb-1 truncate px-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4 w-full">
                      {(ev.normalizedValue * 100).toFixed(0)}%
                    </div>
                    <div 
                      className="w-full bg-[#E5E3F5] group-hover:bg-[#7568D8] rounded-t-sm transition-all relative"
                      style={{ height: `${Math.max(ev.normalizedValue * 100, 5)}%` }}
                    >
                        {ev.direction === 'NEGATIVE' && (
                            <div className="absolute top-0 w-full h-1 bg-[#F47B82] rounded-t-sm" />
                        )}
                    </div>
                    <div className="text-[9px] font-semibold text-[#A5A3B5] text-center mt-2 truncate px-1" title={new Date(ev.occurredAt).toLocaleDateString()}>
                      {new Date(ev.occurredAt).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Bottom Workspace Table */}
          <Card className="flex-1 min-h-[250px] !p-0 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#E8E5F0] flex items-center justify-between bg-[#FAFAFC]">
              <h2 className="text-sm font-bold text-[#17152F]">Recent Evidence</h2>
              <Link to="/dashboard/evidence" className="text-[10px] text-[#77758A] hover:text-[#7568D8] uppercase tracking-wider font-bold transition-colors">View All</Link>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              {loading ? (
                <div className="p-8 space-y-3">
                   {[1,2,3].map(i => <div key={i} className="h-10 bg-[#FAFAFC] border border-[#E8E5F0] rounded w-full animate-pulse" />)}
                </div>
              ) : recentEvidenceDesc.length === 0 ? (
                <div className="p-8 text-center text-xs font-medium text-[#A5A3B5]">No evidence recorded.</div>
              ) : (
                <table className="w-full text-left text-xs text-[#77758A]">
                  <thead className="bg-[#FAFAFC] text-[#A5A3B5] border-b border-[#E8E5F0]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Skill</th>
                      <th className="px-5 py-3 font-semibold">Evidence</th>
                      <th className="px-5 py-3 font-semibold">Signal</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E5F0]">
                    {recentEvidenceDesc.map(ev => (
                      <tr key={ev._id} className="hover:bg-[#F9F8FC] transition-colors">
                        <td className="px-5 py-3 font-semibold text-[#17152F] truncate max-w-[120px]">{ev.skill?.name || '—'}</td>
                        <td className="px-5 py-3 truncate max-w-[200px]">
                          {ev.title}
                          <span className="ml-2 text-[9px] uppercase tracking-wider font-bold text-[#A5A3B5] border border-[#E8E5F0] bg-white px-1.5 py-0.5 rounded-sm">{ev.sourceType.toLowerCase()}</span>
                        </td>
                        <td className="px-5 py-3">
                          {ev.normalizedValue !== null && ev.normalizedValue !== undefined ? (
                            <span className={`font-bold border px-2 py-0.5 rounded text-[10px] ${ev.direction === 'NEGATIVE' ? 'text-[#F47B82] bg-[#FDF0F1] border-[#FADCDD]' : 'text-[#5FD6B1] bg-[#F0FBF7] border-[#D6F4EA]'}`}>
                              {(ev.normalizedValue * 100).toFixed(0)}%
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3 font-medium">{new Date(ev.occurredAt).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

        </div>

        {/* RIGHT COLUMN 30% */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          
          {/* Priority Panel */}
          <Card className="flex-1">
            <h2 className="text-sm font-bold text-[#17152F] mb-4">Development Priorities</h2>
            {loading ? (
                <div className="space-y-3">
                   {[1,2,3].map(i => <div key={i} className="h-12 bg-[#FAFAFC] border border-[#E8E5F0] rounded w-full animate-pulse" />)}
                </div>
            ) : allPriorities.length === 0 ? (
              <div className="text-center text-xs font-medium text-[#77758A] py-10 flex flex-col items-center">
                <CheckCircle2 className="w-7 h-7 text-[#5FD6B1] mb-2 opacity-80" />
                <span className="text-[#17152F] font-bold mb-0.5">You're on track</span>
                No confirmed capability gaps.
              </div>
            ) : (
              <div className="space-y-3">
                {allPriorities.map((p, i) => (
                  <div key={i} className="flex justify-between items-center group cursor-pointer hover:bg-[#F9F8FC] p-2.5 -mx-2.5 rounded-lg transition-colors">
                    <div className="min-w-0 pr-3">
                      <div className="text-xs font-bold text-[#17152F] truncate flex items-center gap-2">
                        {p.skill?.name}
                        <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(p.priorityLevel)}`}>
                          {p.priorityLevel}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#A5A3B5] font-medium mt-1 flex gap-2">
                        <span className="text-[#F47B82] font-semibold">Gap: {(p.gapSize || 0).toFixed(1)}</span>
                        <span>Req: {p.requiredLevel}</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#A5A3B5] group-hover:text-[#7568D8] shrink-0 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* AI Panel - Soft Pastel Design */}
          <Card className="bg-[#F6F5FB] border-[#E8E5F0]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-[#EFEDF8] flex items-center justify-center">
                <BrainCircuit className="w-3.5 h-3.5 text-[#7568D8]" />
              </div>
              <h2 className="text-sm font-bold text-[#17152F]">TalentTwin AI</h2>
            </div>
            <p className="text-[11px] font-medium text-[#77758A] mb-4 leading-relaxed">
              Your next move. Explore development strategies for your confirmed gaps.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/dashboard/development" className="py-2 px-2 text-[10px] font-bold text-[#17152F] bg-white border border-[#E8E5F0] shadow-sm rounded-lg text-center hover:border-[#7568D8]/50 transition-colors">
                Build Plan
              </Link>
              <Link to="/dashboard/career" className="py-2 px-2 text-[10px] font-bold text-[#17152F] bg-white border border-[#E8E5F0] shadow-sm rounded-lg text-center hover:border-[#7568D8]/50 transition-colors">
                Explore Roles
              </Link>
            </div>
          </Card>
          
        </div>
      </div>
    </div>
  );
}
