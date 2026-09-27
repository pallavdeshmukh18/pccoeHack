import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { ChevronLeft, Loader2, Activity, Play, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { Card } from '../../components/dashboard/Card';
import { PageHeader } from '../../components/dashboard/PageHeader';

export default function SkillDetail() {
  const { skillId } = useParams();
  const { user } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [assessment, setAssessment] = useState(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  
  const employeeData = user?.employeeId && typeof user.employeeId === 'object' ? user.employeeId : null;
  const employeeId = employeeData?._id;

  const fetchData = async () => {
    if (!employeeId || !skillId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [capRes, evRes, skillRes] = await Promise.all([
        api.get(`/capabilities/employee/${employeeId}/skill/${skillId}`).catch(err => {
            if(err.response?.status === 404) return { data: { data: null } };
            throw err;
        }),
        api.get(`/evidence?employeeId=${employeeId}&skillId=${skillId}`).catch(() => ({ data: { data: [] } })),
        api.get(`/skills/${skillId}`)
      ]);
      
      setData({ 
        skill: skillRes.data.data, 
        capability: capRes.data.data, 
        evidence: evRes.data.data || [] 
      });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setError('Authentication session expired.');
      } else if (err.response?.status === 403) {
        setError('Not authorized to view this data.');
      } else if (err.response?.status === 404) {
        setError('Skill not found.');
      } else {
        setError('Failed to load skill details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, skillId]);

  const handleStartAssessment = async () => {
    setAssessmentLoading(true);
    try {
      const res = await api.post('/assessments/start', { employeeId, skillId });
      setAssessment(res.data.data);
      setIsAssessing(true);
    } catch (error) {
      alert("Failed to start assessment");
      console.error(error);
    } finally {
      setAssessmentLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedOption) return;
    setAssessmentLoading(true);
    try {
      const res = await api.post(`/assessments/${assessment._id}/answer`, { answer: selectedOption });
      setAssessment(res.data.data);
      setSelectedOption('');
      if (res.data.data.status === 'COMPLETED') {
        setTimeout(() => {
          setIsAssessing(false);
          setAssessment(null);
          fetchData(); 
        }, 3000);
      }
    } catch (error) {
      alert("Failed to submit answer");
      console.error(error);
    } finally {
      setAssessmentLoading(false);
    }
  };

  if (!employeeData) {
    return (
      <div className="flex h-full items-center justify-center text-[#A5A3B5] text-sm">
        Employee profile setup is incomplete.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center flex-col">
        <Link to="/dashboard/skills" className="text-[11px] uppercase font-bold tracking-wider text-[#77758A] hover:text-[#17152F] flex items-center gap-1 mb-6 transition-colors absolute top-6 left-6">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex flex-col items-center max-w-sm text-center">
          <AlertCircle className="w-10 h-10 text-[#F47B82] mb-3 opacity-80" />
          <h2 className="text-[#17152F] font-bold mb-1">Unable to Load Skill</h2>
          <p className="text-[#77758A] text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="animate-in fade-in duration-300 h-full flex flex-col relative">
        <div className="mb-4">
            <Link to="/dashboard/skills" className="text-[11px] uppercase font-bold tracking-wider text-[#77758A] flex items-center gap-1 mb-2">
            <ChevronLeft className="w-4 h-4" /> Back
            </Link>
            <div className="h-10 bg-[#FAFAFC] border border-[#E8E5F0] rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-5">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-[#FAFAFC] border border-[#E8E5F0] rounded-xl animate-pulse" />)}
        </div>
        <div className="flex-1 bg-[#FAFAFC] border border-[#E8E5F0] rounded-xl animate-pulse" />
      </div>
    );
  }

  const { skill, capability, evidence } = data;
  
  const isForming = !capability || capability.capabilityScore === null || capability.capabilityScore === undefined;
  
  // Strict Null checks
  const score = isForming ? null : capability.capabilityScore;
  const confidence = capability?.confidenceScore !== null && capability?.confidenceScore !== undefined ? capability.confidenceScore : null;
  const observationsCount = capability?.effectiveEvidenceCount !== undefined ? capability.effectiveEvidenceCount : capability?.evidenceCount !== undefined ? capability.evidenceCount : '—';
  const trajectoryDirection = capability?.trajectoryDirection && capability.trajectoryDirection !== 'INSUFFICIENT_DATA' ? capability.trajectoryDirection.toLowerCase() : '—';

  const quantEv = evidence
    .filter(e => e.normalizedValue !== null && e.normalizedValue !== undefined)
    .sort((a,b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
    
  const hasHistory = quantEv.length >= 3;

  let svgPath = '';
  if (hasHistory) {
    const t0 = new Date(quantEv[0].occurredAt).getTime();
    const tN = new Date(quantEv[quantEv.length-1].occurredAt).getTime();
    const range = tN - t0 || 1;
    const points = quantEv.map((ev) => {
      const x = ((new Date(ev.occurredAt).getTime() - t0) / range) * 400;
      const y = 100 - (ev.normalizedValue * 100); 
      return `${x},${y}`;
    });
    svgPath = `M ${points[0]} ` + points.slice(1).map(p => `L ${p}`).join(' ');
  }

  return (
    <div className="animate-in fade-in duration-300 h-full flex flex-col relative">
      <div className="mb-4">
        <Link to="/dashboard/skills" className="text-[11px] uppercase font-bold tracking-wider text-[#77758A] hover:text-[#17152F] flex items-center gap-1 mb-2 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <PageHeader 
          title={skill?.name || 'Unknown Skill'} 
          subtitle={isForming ? 'Developing Profile' : 'Measured Capability'}
          rightNode={
            <button 
              onClick={handleStartAssessment}
              className="flex items-center gap-2 bg-[#7568D8] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#6355C5] transition-colors"
            >
              {assessmentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Assess Skill
            </button>
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <Card className="py-5 px-6">
          <div className="text-[10px] text-[#77758A] font-bold uppercase tracking-wider mb-2">Capability Score</div>
          <div className="text-3xl font-extrabold text-[#17152F] mb-1">{score !== null ? `${(score*100).toFixed(0)}%` : '—'}</div>
        </Card>
        <Card className="py-5 px-6">
          <div className="text-[10px] text-[#77758A] font-bold uppercase tracking-wider mb-2">Confidence</div>
          <div className="text-3xl font-extrabold text-[#17152F] mb-1">{confidence !== null ? `${(confidence*100).toFixed(0)}%` : '—'}</div>
        </Card>
        <Card className="py-5 px-6">
          <div className="text-[10px] text-[#77758A] font-bold uppercase tracking-wider mb-2">Observations</div>
          <div className="text-3xl font-extrabold text-[#17152F] mb-1">{observationsCount}</div>
        </Card>
        <Card className="py-5 px-6">
          <div className="text-[10px] text-[#77758A] font-bold uppercase tracking-wider mb-2">Trajectory</div>
          <div className="text-2xl font-extrabold text-[#17152F] mb-1 capitalize truncate">{trajectoryDirection}</div>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 flex-1 pb-4">
        <div className="flex-1 lg:w-[70%]">
          <Card className="h-full flex flex-col">
            <h2 className="text-sm font-bold text-[#17152F] mb-1">Observed Evidence Signals</h2>
            <p className="text-[11px] font-medium text-[#A5A3B5] mb-6">Chronological raw quantitative data points.</p>
            
            {!hasHistory ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[#A5A3B5] text-xs font-medium border border-[#E8E5F0] border-dashed rounded-lg bg-[#FAFAFC]">
                <Activity className="w-8 h-8 mb-3 opacity-30" />
                Insufficient historical evidence (requires 3+ quantitative data points).
              </div>
            ) : (
              <div className="flex-1 relative bg-white rounded-lg border border-[#E8E5F0] p-4">
                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                  <div className="w-full h-px bg-[#F2F1FA]"></div>
                  <div className="w-full h-px bg-[#F2F1FA]"></div>
                  <div className="w-full h-px bg-[#F2F1FA]"></div>
                </div>
                
                <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 100" className="absolute inset-0 p-4 overflow-visible z-10">
                  <path d={svgPath} fill="none" stroke="#7568D8" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/>
                  {quantEv.map((ev) => {
                    const t0 = new Date(quantEv[0].occurredAt).getTime();
                    const tN = new Date(quantEv[quantEv.length-1].occurredAt).getTime();
                    const range = tN - t0 || 1;
                    const x = ((new Date(ev.occurredAt).getTime() - t0) / range) * 400;
                    const y = 100 - (ev.normalizedValue * 100);
                    return (
                        <g key={ev._id}>
                            <title>{new Date(ev.occurredAt).toLocaleDateString()}: {(ev.normalizedValue*100).toFixed(0)}%</title>
                            <circle cx={x} cy={y} r="4" fill="white" stroke="#7568D8" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
                        </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </Card>
        </div>

        <div className="w-full lg:w-[30%] shrink-0">
          <Card className="h-full !p-0 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#E8E5F0] bg-[#FAFAFC]">
              <h3 className="text-sm font-bold text-[#17152F]">Supporting Evidence</h3>
            </div>
            <div className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar bg-white">
              {[...evidence].sort((a,b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()).map(ev => (
                <div key={ev._id} className="p-3 hover:bg-[#F9F8FC] rounded-lg border border-transparent hover:border-[#E8E5F0] transition-colors flex items-start gap-3">
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${ev.direction === 'POSITIVE' ? 'bg-[#5FD6B1]' : ev.direction === 'NEGATIVE' ? 'bg-[#F47B82]' : 'bg-[#A5A3B5]'}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#17152F] mb-1">{ev.title}</div>
                    <div className="text-[10px] font-medium text-[#77758A]">{new Date(ev.occurredAt).toLocaleDateString()} &middot; <span className="capitalize">{ev.sourceType.replace('_', ' ').toLowerCase()}</span></div>
                  </div>
                </div>
              ))}
              {evidence.length === 0 && (
                <div className="text-center p-5 text-xs text-[#A5A3B5]">No evidence yet.</div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Assessment Modal Overlay */}
      {isAssessing && assessment && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-[#E8E5F0] relative">
            {assessment.status === 'COMPLETED' ? (
              <div className="text-center p-8">
                <CheckCircle2 className="w-16 h-16 text-[#5FD6B1] mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-[#17152F] mb-2">Assessment Complete</h2>
                <p className="text-sm text-[#77758A]">Your evidence has been recorded and capability profile updated.</p>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex justify-between items-center mb-6 text-sm text-[#77758A] font-bold uppercase tracking-wider">
                  <span>Question {assessment.questionsCount + 1}</span>
                  <span className="text-[#7568D8]">Difficulty: {(assessment.currentDifficulty * 100).toFixed(0)}%</span>
                </div>
                
                <h3 className="text-lg font-bold text-[#17152F] mb-6">
                  {assessment.currentQuestion?.text || "Generating next question..."}
                </h3>
                
                <div className="space-y-3 mb-6">
                  {assessment.currentQuestion?.options?.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedOption(opt)}
                      className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all ${selectedOption === opt ? 'bg-[#F2F1FA] border-[#7568D8] text-[#7568D8]' : 'bg-white border-[#E8E5F0] text-[#17152F] hover:border-[#A5A3B5]'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E5F0]">
                  <button 
                    onClick={() => { setIsAssessing(false); setAssessment(null); }}
                    className="px-4 py-2 text-xs font-bold text-[#77758A] hover:text-[#17152F] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSubmitAnswer}
                    disabled={!selectedOption || assessmentLoading}
                    className="px-6 py-2 bg-[#7568D8] hover:bg-[#6355C5] text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {assessmentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Submit <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

    </div>
  );
}
