import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { Card } from '../../components/dashboard/Card';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Plus, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const ALLOWED_SOURCES = [
  'PROJECT',
  'TRAINING',
  'CERTIFICATION',
  'EXTERNAL_GITHUB',
  'EXTERNAL_LEETCODE',
  'EXTERNAL_HACKERRANK',
  'EXTERNAL_COURSERA'
];

export default function Evidence() {
  const { user } = useAuth();
  
  const [evidence, setEvidence] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const employeeData = user?.employeeId && typeof user.employeeId === 'object' ? user.employeeId : null;
  const employeeId = employeeData?._id;

  const [formData, setFormData] = useState({
    title: '',
    skillId: '',
    sourceType: 'PROJECT',
    description: '',
    occurredAt: new Date().toISOString().split('T')[0],
    referenceUrl: '',
    // Source specific fields
    projectScore: '',
    completionPercent: '',
    githubPrs: '',
    githubMerged: '',
    githubIssues: '',
    githubReviews: '',
    leetcodeRating: '',
    leetcodeHard: '',
    leetcodeMedium: '',
    leetcodeEasy: ''
  });

  const fetchEvidence = async (isMounted = true) => {
    if (!employeeId) return;
    try {
      const [evRes, skillRes] = await Promise.all([
        api.get(`/evidence?employeeId=${employeeId}`),
        api.get('/skills')
      ]);
      if (!isMounted) return;
      setEvidence(evRes.data.data || []);
      setSkills(skillRes.data.data || []);
      setError(null);
    } catch (err) {
      if (!isMounted) return;
      console.error(err);
      if (err.response?.status === 401) setError('Authentication session expired.');
      else if (err.response?.status === 403) setError('Not authorized to view this data.');
      else setError('Failed to load evidence. Please try again.');
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchEvidence(isMounted);
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    
    // Construct rawValue based on exact backend requirements
    let rawValue = {};
    const kindMap = {
      PROJECT: 'ACHIEVEMENT',
      TRAINING: 'ACTIVITY',
      CERTIFICATION: 'CERTIFICATION',
      EXTERNAL_GITHUB: 'ACTIVITY',
      EXTERNAL_LEETCODE: 'ACHIEVEMENT',
      EXTERNAL_HACKERRANK: 'ACHIEVEMENT',
      EXTERNAL_COURSERA: 'ACTIVITY'
    };
    
    if (formData.sourceType === 'PROJECT') {
      if (formData.projectScore !== '') rawValue.projectScore = Number(formData.projectScore);
      else if (formData.completionPercent !== '') rawValue.completionPercent = Number(formData.completionPercent);
    } else if (formData.sourceType === 'TRAINING') {
      if (formData.completionPercent !== '') rawValue.completionPercent = Number(formData.completionPercent);
    } else if (formData.sourceType === 'EXTERNAL_GITHUB') {
      if (formData.githubPrs !== '') rawValue.pullRequests = Number(formData.githubPrs);
      if (formData.githubMerged !== '') rawValue.mergedPullRequests = Number(formData.githubMerged);
      if (formData.githubIssues !== '') rawValue.issuesClosed = Number(formData.githubIssues);
      if (formData.githubReviews !== '') rawValue.reviewActivity = Number(formData.githubReviews);
    } else if (formData.sourceType === 'EXTERNAL_LEETCODE') {
      if (formData.leetcodeRating !== '') {
        rawValue.contestRating = Number(formData.leetcodeRating);
      } else {
        if (formData.leetcodeHard !== '') rawValue.hardSolved = Number(formData.leetcodeHard);
        if (formData.leetcodeMedium !== '') rawValue.mediumSolved = Number(formData.leetcodeMedium);
        if (formData.leetcodeEasy !== '') rawValue.easySolved = Number(formData.leetcodeEasy);
      }
    }

    const payload = {
      employee: employeeId,
      skill: formData.skillId,
      sourceType: formData.sourceType,
      title: formData.title,
      description: formData.description,
      occurredAt: formData.occurredAt,
      evidenceKind: kindMap[formData.sourceType] || 'OBSERVATION',
      rawValue
    };
    
    if (formData.referenceUrl) {
      payload.metadata = { referenceUrl: formData.referenceUrl };
    }

    try {
      await api.post('/evidence', payload);
      setSubmitSuccess(true);
      await fetchEvidence(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
        setFormData({
            title: '',
            skillId: '',
            sourceType: 'PROJECT',
            description: '',
            occurredAt: new Date().toISOString().split('T')[0],
            referenceUrl: '',
            projectScore: '',
            completionPercent: '',
            githubPrs: '',
            githubMerged: '',
            githubIssues: '',
            githubReviews: '',
            leetcodeRating: '',
            leetcodeHard: '',
            leetcodeMedium: '',
            leetcodeEasy: ''
        });
      }, 2000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit evidence');
    } finally {
      setSubmitLoading(false);
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
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center max-w-sm text-center">
          <AlertCircle className="w-10 h-10 text-[#F47B82] mb-3 opacity-80" />
          <h2 className="text-[#17152F] font-bold mb-1">Unable to Load Evidence</h2>
          <p className="text-[#77758A] text-xs mb-4">{error}</p>
          <button onClick={() => fetchEvidence(true)} className="px-4 py-2 bg-[#F2F1FA] text-[#7568D8] rounded font-bold text-xs">Retry</button>
        </div>
      </div>
    );
  }

  const formatSourceType = (type) => type.replace('EXTERNAL_', '').replace('_', ' ');

  return (
    <div className="animate-in fade-in duration-300 h-full flex flex-col relative">
      <PageHeader 
        title="Evidence Log" 
        subtitle="See the raw observations behind your capability profile." 
        rightNode={
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-[#7568D8] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#6355C5] transition-colors"
            >
                <Plus className="w-4 h-4" /> Add Evidence
            </button>
        }
      />
      
      <Card className="flex-1 !p-0 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-[#77758A]">
            <thead className="bg-[#FAFAFC] text-[#A5A3B5] border-b border-[#E8E5F0] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Skill</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E5F0]">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                        <td className="px-6 py-4"><div className="h-4 bg-[#FAFAFC] rounded w-20 animate-pulse"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-[#FAFAFC] rounded w-48 animate-pulse"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-[#FAFAFC] rounded w-24 animate-pulse"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-[#FAFAFC] rounded w-24 animate-pulse"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-[#FAFAFC] rounded w-16 animate-pulse"></div></td>
                    </tr>
                ))
              ) : evidence.length === 0 ? (
                <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center">
                            <h3 className="text-[#17152F] font-bold mb-1">No evidence found.</h3>
                            <p className="text-[#A5A3B5] text-xs mb-4">Add projects, training, certifications, and other evidence to build your capability profile.</p>
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 bg-[#F2F1FA] text-[#7568D8] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#E5E3F5] transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Add Evidence
                            </button>
                        </div>
                    </td>
                </tr>
              ) : evidence.map(ev => (
                <tr key={ev._id} className="hover:bg-[#F9F8FC] transition-colors group cursor-default">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-xs">
                    {new Date(ev.occurredAt).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#17152F] max-w-[250px] truncate">{ev.title}</div>
                    {ev.description && <div className="text-[10px] text-[#A5A3B5] truncate max-w-[250px] mt-0.5">{ev.description}</div>}
                  </td>
                  <td className="px-6 py-4 font-bold text-[#17152F] text-xs">{ev.skill?.name || '—'}</td>
                  <td className="px-6 py-4">
                     <span className="text-[9px] uppercase tracking-wider font-bold text-[#A5A3B5] border border-[#E8E5F0] bg-[#FAFAFC] px-2 py-0.5 rounded-md">
                        {formatSourceType(ev.sourceType)}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                    {ev.normalizedValue !== null && ev.normalizedValue !== undefined ? (
                      <span className={`font-bold border px-2.5 py-1 rounded text-[11px] ${ev.direction === 'NEGATIVE' ? 'text-[#F47B82] bg-[#FDF0F1] border-[#FADCDD]' : 'text-[#5FD6B1] bg-[#F0FBF7] border-[#D6F4EA]'}`}>
                        {(ev.normalizedValue * 100).toFixed(0)}%
                      </span>
                    ) : <span className="text-xs text-[#A5A3B5] font-medium">Unquantified</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Evidence Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#17152F]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#E8E5F0] shrink-0">
              <h2 className="text-lg font-bold text-[#17152F]">Add Evidence</h2>
              <button onClick={() => !submitLoading && setIsModalOpen(false)} className="text-[#A5A3B5] hover:text-[#F47B82] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
                <div className="p-10 flex flex-col items-center text-center flex-1 justify-center">
                    <CheckCircle2 className="w-16 h-16 text-[#5FD6B1] mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-[#17152F] mb-2">Evidence Added</h2>
                    <p className="text-sm text-[#77758A]">Capability estimates update automatically from processed evidence.</p>
                </div>
            ) : (
                <div className="overflow-y-auto p-5 custom-scrollbar flex-1">
                    <form id="evidence-form" onSubmit={handleSubmit} className="space-y-4">
                        
                        <div>
                            <label className="block text-xs font-bold text-[#17152F] mb-1">Source Type <span className="text-[#F47B82]">*</span></label>
                            <select name="sourceType" required value={formData.sourceType} onChange={handleInputChange} className="w-full bg-[#FAFAFC] border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50">
                                {ALLOWED_SOURCES.map(src => (
                                    <option key={src} value={src}>{formatSourceType(src)}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#17152F] mb-1">Title <span className="text-[#F47B82]">*</span></label>
                            <input type="text" name="title" required value={formData.title} onChange={handleInputChange} placeholder="e.g. Completed Advanced Node.js Module" className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#17152F] mb-1">Skill <span className="text-[#F47B82]">*</span></label>
                            <select name="skillId" required value={formData.skillId} onChange={handleInputChange} className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50">
                                <option value="" disabled>Select a skill</option>
                                {skills.map(skill => (
                                    <option key={skill._id} value={skill._id}>{skill.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#17152F] mb-1">Date Occurred <span className="text-[#F47B82]">*</span></label>
                            <input type="date" name="occurredAt" required value={formData.occurredAt} onChange={handleInputChange} className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#17152F] mb-1">Description</label>
                            <textarea name="description" rows="2" value={formData.description} onChange={handleInputChange} placeholder="Optional details..." className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50 resize-none"></textarea>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#17152F] mb-1">Reference URL</label>
                            <input type="url" name="referenceUrl" value={formData.referenceUrl} onChange={handleInputChange} placeholder="https://..." className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50" />
                        </div>

                        {/* Conditional Numeric Fields */}
                        <div className="bg-[#FAFAFC] p-4 rounded-xl border border-[#E8E5F0] space-y-4">
                            <h4 className="text-[10px] font-bold text-[#A5A3B5] uppercase tracking-wider">Quantitative Data (Optional)</h4>
                            
                            {formData.sourceType === 'PROJECT' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-[#17152F] mb-1">Score (0-100)</label>
                                        <input type="number" min="0" max="100" name="projectScore" value={formData.projectScore} onChange={handleInputChange} placeholder="e.g. 85" className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#17152F] mb-1">Completion %</label>
                                        <input type="number" min="0" max="100" name="completionPercent" value={formData.completionPercent} onChange={handleInputChange} placeholder="e.g. 100" className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50" />
                                    </div>
                                </div>
                            )}

                            {formData.sourceType === 'TRAINING' && (
                                <div>
                                    <label className="block text-xs font-bold text-[#17152F] mb-1">Completion %</label>
                                    <input type="number" min="0" max="100" name="completionPercent" value={formData.completionPercent} onChange={handleInputChange} placeholder="e.g. 100" className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50" />
                                </div>
                            )}

                            {formData.sourceType === 'EXTERNAL_GITHUB' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-[#17152F] mb-1">Pull Requests</label>
                                        <input type="number" min="0" name="githubPrs" value={formData.githubPrs} onChange={handleInputChange} className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#17152F] mb-1">Merged PRs</label>
                                        <input type="number" min="0" name="githubMerged" value={formData.githubMerged} onChange={handleInputChange} className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#17152F] mb-1">Issues Closed</label>
                                        <input type="number" min="0" name="githubIssues" value={formData.githubIssues} onChange={handleInputChange} className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#17152F] mb-1">Reviews</label>
                                        <input type="number" min="0" name="githubReviews" value={formData.githubReviews} onChange={handleInputChange} className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm" />
                                    </div>
                                </div>
                            )}

                            {formData.sourceType === 'EXTERNAL_LEETCODE' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-[#17152F] mb-1">Contest Rating</label>
                                        <input type="number" min="0" name="leetcodeRating" value={formData.leetcodeRating} onChange={handleInputChange} placeholder="e.g. 1750" className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#E8E5F0]">
                                        <div>
                                            <label className="block text-[10px] font-bold text-[#17152F] mb-1">Hard</label>
                                            <input type="number" min="0" name="leetcodeHard" value={formData.leetcodeHard} onChange={handleInputChange} className="w-full bg-white border border-[#E8E5F0] rounded-lg px-2 py-1.5 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-[#17152F] mb-1">Medium</label>
                                            <input type="number" min="0" name="leetcodeMedium" value={formData.leetcodeMedium} onChange={handleInputChange} className="w-full bg-white border border-[#E8E5F0] rounded-lg px-2 py-1.5 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-[#17152F] mb-1">Easy</label>
                                            <input type="number" min="0" name="leetcodeEasy" value={formData.leetcodeEasy} onChange={handleInputChange} className="w-full bg-white border border-[#E8E5F0] rounded-lg px-2 py-1.5 text-sm" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {['CERTIFICATION', 'EXTERNAL_COURSERA', 'EXTERNAL_HACKERRANK'].includes(formData.sourceType) && (
                                <p className="text-xs text-[#77758A]">
                                    Provide the reference URL above. The intelligence engine will extract and verify certification metadata automatically.
                                </p>
                            )}
                        </div>

                    </form>
                </div>
            )}
            
            {/* Footer */}
            {!submitSuccess && (
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
                        form="evidence-form"
                        disabled={submitLoading}
                        className="flex items-center justify-center min-w-[120px] bg-[#7568D8] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#6355C5] transition-colors disabled:opacity-50"
                    >
                        {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Evidence'}
                    </button>
                </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
