import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { BrainCircuit, Target, CheckCircle2, Play, Calendar, Loader2, ArrowRight, X, AlertCircle } from 'lucide-react';
import { Card } from '../../components/dashboard/Card';
import { PageHeader } from '../../components/dashboard/PageHeader';

export default function Development() {
  const { user } = useAuth();
  
  const [priorities, setPriorities] = useState([]);
  const [copilotPlan, setCopilotPlan] = useState(null);
  const [interventions, setInterventions] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const employeeData = user?.employeeId && typeof user.employeeId === 'object' ? user.employeeId : null;
  const employeeId = employeeData?._id;
  const jobRoleId = employeeData?.role?._id || employeeData?.role;

  const [formData, setFormData] = useState({
    skillId: '',
    title: '',
    description: '',
    interventionType: 'LEARNING',
    plannedStartDate: new Date().toISOString().split('T')[0],
    plannedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const fetchData = async (isMounted = true) => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const [priRes, intRes, planRes] = await Promise.all([
        api.get(`/development-priorities/employee/${employeeId}`).catch(() => ({ data: { data: [] } })),
        api.get(`/interventions/employee/${employeeId}`).catch(() => ({ data: { data: [] } })),
        jobRoleId 
            ? api.get(`/development-copilot/employee/${employeeId}/role/${jobRoleId}`).catch(() => ({ data: { data: null } })) 
            : Promise.resolve({ data: { data: null } })
      ]);
      if (!isMounted) return;
      setPriorities(priRes.data.data || []);
      setInterventions(intRes.data.data || []);
      setCopilotPlan(planRes.data.data);
    } catch (err) {
      if (!isMounted) return;
      console.error(err);
      if (err.response?.status === 401) setError('Authentication session expired.');
      else if (err.response?.status === 403) setError('Not authorized to view this data.');
      else setError('Failed to load development data. Please try again.');
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchData(isMounted);
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, jobRoleId]);

  const handleGeneratePlan = async () => {
    if (!employeeId || !jobRoleId) {
        setGenerateError("Job role not assigned. Cannot generate plan.");
        return;
    }
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await api.post('/development-copilot/generate', { employeeId, jobRoleId });
      if (res.data.success) {
        setCopilotPlan(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setGenerateError(err.response?.data?.message || "Failed to generate plan. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenIntervention = (skillId = '', title = '') => {
    setFormData(prev => ({ ...prev, skillId, title }));
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitIntervention = async (e) => {
    e.preventDefault();
    if (new Date(formData.plannedEndDate) < new Date(formData.plannedStartDate)) {
        alert("End date cannot be before start date.");
        return;
    }
    setSubmitLoading(true);
    try {
      await api.post('/interventions', {
          employeeId,
          jobRoleId,
          skillId: formData.skillId,
          title: formData.title,
          description: formData.description,
          interventionType: formData.interventionType,
          status: 'PLANNED',
          plannedStartDate: formData.plannedStartDate,
          plannedEndDate: formData.plannedEndDate
      });
      setIsModalOpen(false);
      fetchData(true);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create intervention');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!employeeData) {
    return (
      <div className="flex h-full items-center justify-center text-[#A5A3B5] text-sm">
        Your account is not linked to an employee profile yet.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center max-w-sm text-center">
          <AlertCircle className="w-10 h-10 text-[#F47B82] mb-3 opacity-80" />
          <h2 className="text-[#17152F] font-bold mb-1">Unable to Load Development Plan</h2>
          <p className="text-[#77758A] text-xs mb-4">{error}</p>
          <button onClick={() => fetchData(true)} className="px-4 py-2 bg-[#F2F1FA] text-[#7568D8] rounded font-bold text-xs">Retry</button>
        </div>
      </div>
    );
  }

  const gaps = priorities.flatMap(p => p.priorities || []).filter(p => p.status === 'GAP' || p.status === 'NEAR_GAP');

  const getPriorityColor = (level) => {
    if (level === 'CRITICAL') return 'text-[#F47B82] bg-[#FDF0F1] border-[#FADCDD]';
    if (level === 'HIGH') return 'text-[#7568D8] bg-[#F2F1FA] border-[#E8E5F0]';
    if (level === 'MEDIUM') return 'text-[#F3C85E] bg-[#FEF9F0] border-[#FCECD0]';
    return 'text-[#5FD6B1] bg-[#F0FBF7] border-[#D6F4EA]';
  };

  const getInterventionStatusColor = (status) => {
    if (status === 'COMPLETED') return 'text-[#5FD6B1] bg-[#F0FBF7] border-[#D6F4EA]';
    if (status === 'IN_PROGRESS') return 'text-[#7568D8] bg-[#F2F1FA] border-[#E8E5F0]';
    if (status === 'CANCELLED') return 'text-[#A5A3B5] bg-[#F9F8FC] border-[#E8E5F0]';
    return 'text-[#F3C85E] bg-[#FEF9F0] border-[#FCECD0]';
  };

  return (
    <div className="animate-in fade-in duration-300 h-full flex flex-col">
      <PageHeader title="Development Plan" subtitle="Confirmed capability gaps and recommended actions." />
      
      <div className="flex flex-col lg:flex-row gap-5 flex-1 overflow-hidden pb-4">
        
        {/* Left Panel */}
        <div className="flex-1 lg:w-[70%] flex flex-col gap-5 overflow-y-auto custom-scrollbar">
          
          {/* Confirmed Priorities */}
          <Card className="!p-0 overflow-hidden shrink-0">
            <div className="p-4 border-b border-[#E8E5F0] bg-[#FAFAFC] flex justify-between items-center">
              <h2 className="text-sm font-bold text-[#17152F]">Confirmed Priorities</h2>
            </div>
            {loading ? (
                <div className="divide-y divide-[#E8E5F0]">
                    {[1,2].map(i => <div key={i} className="p-4 h-20 bg-[#FAFAFC] animate-pulse" />)}
                </div>
            ) : gaps.length === 0 ? (
              <div className="p-8 text-center text-sm font-medium text-[#77758A]">
                <p className="text-[#17152F] font-bold mb-1">No confirmed development priorities yet.</p>
                <p className="text-xs">TalentTwin does not currently have enough confirmed role gaps to create a development priority.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E8E5F0]">
                {gaps.map((p, i) => (
                  <div key={i} className="p-4 hover:bg-[#F9F8FC] transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-[#17152F] text-sm mb-1">{p.skill?.name || 'Unknown Skill'}</div>
                        <div className="text-[11px] font-medium text-[#77758A] flex flex-wrap items-center gap-3">
                          <span className={`px-2 py-0.5 rounded-sm uppercase tracking-wider font-bold border ${getPriorityColor(p.priorityLevel)}`}>
                            {p.priorityLevel} PRIORITY
                          </span>
                          <span>Required: Lvl {p.requiredLevel}</span>
                          <span>Current: Lvl {p.currentProficiencyLevel !== null ? p.currentProficiencyLevel : '—'}</span>
                          <span className="text-[#F47B82] font-semibold">Gap: {(p.gapSize || 0).toFixed(1)} levels</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleOpenIntervention(p.skill?._id, `Upskill: ${p.skill?.name}`)}
                        className="text-[10px] text-[#7568D8] uppercase tracking-wider font-bold border border-[#E8E5F0] px-3 py-1.5 bg-white hover:bg-[#F2F1FA] rounded transition-colors whitespace-nowrap"
                      >
                        Create Intervention
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Active Interventions */}
          <Card className="!p-0 overflow-hidden shrink-0">
            <div className="p-4 border-b border-[#E8E5F0] bg-[#FAFAFC] flex justify-between items-center">
              <h2 className="text-sm font-bold text-[#17152F]">Active Interventions</h2>
              <button 
                onClick={() => handleOpenIntervention()}
                className="text-[10px] text-[#7568D8] uppercase tracking-wider font-bold border border-[#E8E5F0] px-2 py-1 bg-white hover:bg-[#F2F1FA] rounded transition-colors"
              >
                + Add New
              </button>
            </div>
            
            {loading ? (
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1,2].map(i => <div key={i} className="h-32 bg-[#FAFAFC] rounded-xl border border-[#E8E5F0] animate-pulse" />)}
                </div>
            ) : interventions.length === 0 ? (
              <div className="p-8 text-center text-sm font-medium text-[#77758A]">No active interventions.</div>
            ) : (
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {interventions.map(inv => (
                  <div key={inv._id} className="border border-[#E8E5F0] rounded-xl p-4 hover:border-[#7568D8]/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-[#17152F] text-sm line-clamp-1" title={inv.title}>{inv.title}</div>
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${getInterventionStatusColor(inv.status)} whitespace-nowrap`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </div>
                    {inv.description && <div className="text-xs text-[#77758A] mb-3 line-clamp-2">{inv.description}</div>}
                    
                    {inv.skill && (
                        <div className="mb-3">
                            <span className="text-[10px] bg-[#F2F1FA] text-[#7568D8] px-2 py-1 rounded font-medium">
                                {inv.skill.name}
                            </span>
                        </div>
                    )}
                    
                    <div className="text-[10px] font-medium text-[#A5A3B5] flex flex-wrap items-center gap-4">
                        {inv.plannedStartDate && inv.plannedEndDate && (
                          <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> 
                              {new Date(inv.plannedStartDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})} - {new Date(inv.plannedEndDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                          </span>
                        )}
                        <span className="capitalize border border-[#E8E5F0] px-1.5 py-0.5 rounded">{inv.interventionType.toLowerCase()}</span>
                    </div>

                    <div className="mt-3">
                        <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-[#A5A3B5]">
                            <span>Progress</span>
                            <span>{inv.completionPercentage !== null && inv.completionPercentage !== undefined ? `${inv.completionPercentage}%` : '0%'}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#F2F1FA] rounded-full overflow-hidden">
                            <div className="h-full bg-[#7568D8]" style={{ width: `${inv.completionPercentage || 0}%` }}></div>
                        </div>
                    </div>

                    {inv.status === 'COMPLETED' && inv.impact?.impactStatus && (
                      <div className="mt-4 text-[10px] bg-[#F0FBF7] text-[#5FD6B1] border border-[#D6F4EA] p-2.5 rounded flex flex-col gap-1">
                        <span className="font-bold uppercase tracking-wider text-[9px] text-[#A5A3B5]">Outcome</span>
                        <span className="font-medium">Observed capability shifted. This observed change does not establish that the intervention caused the outcome.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* AI Copilot Panel */}
        <div className="w-full lg:w-[30%] shrink-0 flex flex-col">
          <Card className="bg-[#F6F5FB] border-[#E8E5F0] flex-1 flex flex-col h-full !p-0 overflow-hidden relative">
            <div className="p-5 border-b border-[#E8E5F0] bg-white sticky top-0 z-10">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[#EFEDF8] flex items-center justify-center">
                    <BrainCircuit className="w-4 h-4 text-[#7568D8]" />
                  </div>
                  <h2 className="text-sm font-bold text-[#17152F]">AI Copilot Plan</h2>
                </div>
                {copilotPlan && (
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#77758A] bg-[#F7F6FB] px-1.5 py-0.5 rounded border border-[#E8E5F0]">
                    {new Date(copilotPlan.generatedAt).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                  </span>
                )}
              </div>

              {!jobRoleId ? (
                  <div className="text-[11px] font-medium text-[#F47B82] leading-relaxed bg-[#FDF0F1] p-3 rounded-lg border border-[#FADCDD]">
                      Your employee profile does not have a standardized role assigned yet. A role is required to compare your capabilities against role expectations.
                  </div>
              ) : gaps.length === 0 ? (
                  <div className="text-[11px] font-medium text-[#77758A] leading-relaxed bg-[#FAFAFC] p-3 rounded-lg border border-[#E8E5F0]">
                      AI planning becomes available when TalentTwin identifies a confirmed role gap.
                  </div>
              ) : !copilotPlan ? (
                <>
                  <p className="text-[11px] font-medium text-[#77758A] leading-relaxed mb-4">
                    Based on your role requirements and confirmed gaps, TalentTwin AI can generate a personalized development strategy.
                  </p>
                  <button 
                    onClick={handleGeneratePlan} 
                    disabled={generating}
                    className="w-full py-2 px-4 text-xs font-bold text-white bg-[#7568D8] hover:bg-[#6355C5] rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {generating ? 'Generating development plan...' : 'Generate AI Plan'}
                  </button>
                  {generateError && (
                      <p className="text-[10px] text-[#F47B82] mt-2 font-bold text-center">{generateError}</p>
                  )}
                </>
              ) : (
                <button 
                  onClick={handleGeneratePlan} 
                  disabled={generating}
                  className="w-full py-1.5 px-3 text-[10px] font-bold text-[#7568D8] bg-white border border-[#E8E5F0] hover:bg-[#F9F8FC] rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Regenerate Plan"}
                </button>
              )}
              {copilotPlan && generateError && (
                  <p className="text-[10px] text-[#F47B82] mt-2 font-bold text-center">{generateError}</p>
              )}
            </div>

            {loading ? (
                <div className="flex-1 p-5 space-y-4">
                    <div className="h-20 bg-white rounded-xl border border-[#E8E5F0] animate-pulse"></div>
                    <div className="h-40 bg-white rounded-xl border border-[#E8E5F0] animate-pulse"></div>
                </div>
            ) : copilotPlan && (
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#77758A] mb-2 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" /> Objective
                  </h3>
                  <p className="text-sm font-semibold text-[#17152F]">{copilotPlan.summary?.developmentObjective || '—'}</p>
                  <p className="text-xs text-[#77758A] mt-2 leading-relaxed">{copilotPlan.summary?.whyThisMatters || '—'}</p>
                </div>
                
                {copilotPlan.recommendations?.map((rec, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-[#E8E5F0] shadow-sm">
                    <div className="flex justify-between items-start mb-3 pb-2 border-b border-[#E8E5F0]">
                        <div className="font-bold text-[#17152F] text-xs">Skill Focus: <span className="text-[#7568D8]">{rec.skill?.name || 'Skill'}</span></div>
                        <button
                            onClick={() => handleOpenIntervention(rec.skill?._id, `AI Rec: ${rec.skill?.name}`)}
                            className="text-[9px] uppercase tracking-wider font-bold text-[#7568D8] hover:text-[#17152F] transition-colors"
                        >
                            Create Action
                        </button>
                    </div>
                    
                    {rec.recommendedActions?.length > 0 && (
                        <div className="mb-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#A5A3B5] mb-1.5">Recommended Actions</div>
                        <ul className="space-y-1.5">
                            {rec.recommendedActions.map((action, j) => (
                            <li key={j} className="text-xs text-[#17152F] flex items-start gap-1.5">
                                <ArrowRight className="w-3 h-3 text-[#7568D8] shrink-0 mt-0.5" /> <span>{action}</span>
                            </li>
                            ))}
                        </ul>
                        </div>
                    )}
                    
                    {rec.practiceActivities?.length > 0 && (
                      <div className="mb-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#A5A3B5] mb-1.5">Practice</div>
                        <ul className="space-y-1.5">
                          {rec.practiceActivities.map((act, j) => (
                            <li key={j} className="text-xs text-[#17152F] flex items-start gap-1.5">
                              <Play className="w-3 h-3 text-[#5FD6B1] shrink-0 mt-0.5" /> <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {rec.successIndicators?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#A5A3B5] mb-1.5">Success Indicators</div>
                        <ul className="space-y-1.5">
                          {rec.successIndicators.map((ind, j) => (
                            <li key={j} className="text-xs text-[#77758A] flex items-start gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-[#A5A3B5] shrink-0 mt-0.5" /> <span>{ind}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
                
                {copilotPlan.summary?.estimatedTimeframe && (
                    <div className="bg-[#FEF9F0] border border-[#FCECD0] p-3 rounded-lg flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#F3C85E] mb-1">Timeframe</div>
                        <p className="text-xs text-[#17152F] font-medium">{copilotPlan.summary.estimatedTimeframe}</p>
                    </div>
                    </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Add Intervention Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#17152F]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-5 border-b border-[#E8E5F0] shrink-0">
              <h2 className="text-lg font-bold text-[#17152F]">Add Intervention</h2>
              <button onClick={() => !submitLoading && setIsModalOpen(false)} className="text-[#A5A3B5] hover:text-[#F47B82] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 custom-scrollbar flex-1">
                {!jobRoleId ? (
                    <div className="text-xs text-[#F47B82] font-bold text-center">Cannot create an intervention without an assigned Job Role.</div>
                ) : (
                    <form id="intervention-form" onSubmit={handleSubmitIntervention} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-[#17152F] mb-1">Skill <span className="text-[#F47B82]">*</span></label>
                            <select name="skillId" required value={formData.skillId} onChange={handleInputChange} className="w-full bg-[#FAFAFC] border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50">
                                <option value="" disabled>Select a skill priority...</option>
                                {gaps.map(p => (
                                    <option key={p.skill?._id} value={p.skill?._id}>{p.skill?.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-[#17152F] mb-1">Title <span className="text-[#F47B82]">*</span></label>
                            <input type="text" name="title" required value={formData.title} onChange={handleInputChange} placeholder="e.g. Master React Hooks" className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#17152F] mb-1">Intervention Type <span className="text-[#F47B82]">*</span></label>
                            <select name="interventionType" required value={formData.interventionType} onChange={handleInputChange} className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50">
                                <option value="LEARNING">Learning</option>
                                <option value="PRACTICE">Practice</option>
                                <option value="PROJECT">Project</option>
                                <option value="ASSESSMENT">Assessment</option>
                                <option value="MENTORING">Mentoring</option>
                                <option value="COACHING">Coaching</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#17152F] mb-1">Description</label>
                            <textarea name="description" rows="2" value={formData.description} onChange={handleInputChange} placeholder="Details about this intervention..." className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50 resize-none"></textarea>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#17152F] mb-1">Start Date <span className="text-[#F47B82]">*</span></label>
                                <input type="date" name="plannedStartDate" required value={formData.plannedStartDate} onChange={handleInputChange} className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#17152F] mb-1">End Date <span className="text-[#F47B82]">*</span></label>
                                <input type="date" name="plannedEndDate" required value={formData.plannedEndDate} onChange={handleInputChange} className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50" />
                            </div>
                        </div>
                    </form>
                )}
            </div>
            
            {jobRoleId && (
                <div className="p-4 border-t border-[#E8E5F0] bg-[#FAFAFC] shrink-0 flex justify-end gap-3 rounded-b-2xl">
                    <button 
                        type="button" 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-xs font-bold text-[#77758A] hover:text-[#17152F] transition-colors"
                        disabled={submitLoading}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        form="intervention-form"
                        disabled={submitLoading}
                        className="flex items-center justify-center min-w-[120px] bg-[#7568D8] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#6355C5] transition-colors disabled:opacity-50"
                    >
                        {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                    </button>
                </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
