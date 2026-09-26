import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { Card } from '../../components/dashboard/Card';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  
  const [jobRoles, setJobRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [rolesError, setRolesError] = useState(null);
  
  const employeeData = user?.employeeId && typeof user.employeeId === 'object' ? user.employeeId : null;
  const employeeId = employeeData?._id;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    department: '',
    location: '',
    role: ''
  });

  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchRoles = async () => {
        try {
            const res = await api.get('/job-roles');
            if (isMounted) setJobRoles(res.data.data?.filter(r => r.isActive !== false) || []);
        } catch (err) {
            console.error(err);
            if (isMounted) setRolesError('Unable to load available job roles.');
        } finally {
            if (isMounted) setLoadingRoles(false);
        }
    };
    fetchRoles();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (employeeData) {
        setFormData({
            firstName: employeeData.firstName || '',
            lastName: employeeData.lastName || '',
            jobTitle: employeeData.jobTitle || '',
            department: employeeData.department || '',
            location: employeeData.location || '',
            role: employeeData.role?._id || employeeData.role || ''
        });
        setIsDirty(false);
    }
  }, [employeeData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const next = { ...prev, [name]: value };
        setIsDirty(true);
        setSaveSuccess(false);
        setSaveError(null);
        return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
        const payload = {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            jobTitle: formData.jobTitle.trim(),
            department: formData.department.trim(),
            location: formData.location.trim(),
            role: formData.role || null
        };
        const res = await api.patch(`/employees/${employeeId}`, payload);
        if (res.data.success) {
            setSaveSuccess(true);
            setIsDirty(false);
            const meRes = await api.get('/auth/me');
            if (meRes.data.success) {
                window.location.reload();
            }
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    } catch (err) {
        console.error(err);
        setSaveError(err.response?.data?.message || 'Unable to save profile changes.');
    } finally {
        setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="animate-in fade-in duration-300 h-full flex flex-col relative overflow-y-auto custom-scrollbar">
      <PageHeader title="Settings" subtitle="Manage your account and preferences." />

      <div className="flex flex-col gap-6 max-w-3xl pb-10">
        
        {/* Account Information (Read Only) */}
        <Card className="!p-0 overflow-hidden">
            <div className="p-4 border-b border-[#E8E5F0] bg-[#FAFAFC]">
              <h2 className="text-sm font-bold text-[#17152F]">Account Information</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div>
                    <label className="block text-xs font-bold text-[#A5A3B5] uppercase tracking-wider mb-2">Profile Photo</label>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#EFEDF8] text-[#7568D8] flex items-center justify-center text-sm font-bold border border-[#E8E5F0] overflow-hidden shrink-0">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                            ) : null}
                            <span className={user.avatarUrl ? 'hidden w-full h-full items-center justify-center' : 'w-full h-full flex items-center justify-center'}>
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                        </div>
                        <div className="text-[11px] font-medium text-[#77758A] leading-tight">
                            {user.avatarUrl ? 'Synced from Google' : 'No Google profile photo'}
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#A5A3B5] uppercase tracking-wider mb-2">Email</label>
                    <div className="text-sm font-semibold text-[#17152F] bg-[#FAFAFC] border border-[#E8E5F0] px-3 py-2 rounded-lg opacity-80">{user.email}</div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#A5A3B5] uppercase tracking-wider mb-2">System Role</label>
                    <div className="text-sm font-semibold text-[#17152F] bg-[#FAFAFC] border border-[#E8E5F0] px-3 py-2 rounded-lg capitalize opacity-80">{user.role?.toLowerCase()}</div>
                </div>
            </div>
        </Card>

        {/* Employee Profile (Editable) */}
        {!employeeData ? (
            <Card className="flex flex-col items-center justify-center p-10 text-center">
                <AlertCircle className="w-10 h-10 text-[#F47B82] mb-3 opacity-80" />
                <h3 className="text-[#17152F] font-bold mb-1">Unable to load your employee profile.</h3>
                <p className="text-[#A5A3B5] text-xs">Your account is not linked to an employee profile.</p>
            </Card>
        ) : (
            <Card className="!p-0 overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <div className="p-4 border-b border-[#E8E5F0] bg-[#FAFAFC]">
                        <h2 className="text-sm font-bold text-[#17152F]">Employee Profile</h2>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        {/* Name */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-[#17152F] mb-2">First Name <span className="text-[#F47B82]">*</span></label>
                                <input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange} className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#17152F] mb-2">Last Name <span className="text-[#F47B82]">*</span></label>
                                <input type="text" name="lastName" required value={formData.lastName} onChange={handleInputChange} className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50" />
                            </div>
                        </div>

                        {/* HR Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-[#E8E5F0] border-dashed">
                            <div>
                                <label className="block text-xs font-bold text-[#17152F] mb-2">Job Title</label>
                                <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#17152F] mb-2">Department</label>
                                <input type="text" name="department" value={formData.department} onChange={handleInputChange} className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#17152F] mb-2">Location</label>
                                <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50" />
                            </div>
                        </div>

                        {/* TalentTwin Job Role */}
                        <div className="pt-4 border-t border-[#E8E5F0] border-dashed">
                            <label className="block text-xs font-bold text-[#17152F] mb-1">TalentTwin Job Role</label>
                            <p className="text-xs text-[#77758A] mb-3">Used to compare your capabilities against standardized role expectations, unlocking gap analysis and development planning.</p>
                            
                            {rolesError ? (
                                <div className="text-xs text-[#F47B82] font-semibold bg-[#FDF0F1] border border-[#FADCDD] px-3 py-2 rounded-lg flex justify-between items-center">
                                    <span>Unable to load available job roles.</span>
                                </div>
                            ) : loadingRoles ? (
                                <select disabled className="w-full md:w-1/2 bg-[#FAFAFC] border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm text-[#A5A3B5]">
                                    <option>Loading roles...</option>
                                </select>
                            ) : jobRoles.length === 0 ? (
                                <div className="text-xs text-[#A5A3B5] font-semibold bg-[#FAFAFC] border border-[#E8E5F0] px-3 py-2 rounded-lg">
                                    No standardized job roles are currently available.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <select name="role" value={formData.role} onChange={handleInputChange} className="w-full md:w-1/2 bg-white border border-[#E8E5F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7568D8]/50 font-medium">
                                        <option value="">Select a standardized role...</option>
                                        {jobRoles.map(role => (
                                            <option key={role._id} value={role._id}>{role.title}</option>
                                        ))}
                                    </select>
                                    {!formData.role && (
                                        <div className="text-[10px] text-[#F3C85E] font-bold tracking-wide uppercase mt-1">
                                            Assign a role to unlock intelligence features.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 border-t border-[#E8E5F0] bg-[#FAFAFC] flex justify-between items-center">
                        <div className="flex-1">
                            {saveError && <span className="text-xs font-bold text-[#F47B82] flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {saveError}</span>}
                            {saveSuccess && <span className="text-xs font-bold text-[#5FD6B1] flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Profile updated successfully.</span>}
                        </div>
                        <button 
                            type="submit" 
                            disabled={!isDirty || saving || loadingRoles}
                            className="flex items-center justify-center min-w-[120px] bg-[#7568D8] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#6355C5] transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </Card>
        )}

        {/* Organization Information (Read Only) */}
        {employeeData && (
            <Card className="!p-0 overflow-hidden opacity-75">
                <div className="p-4 border-b border-[#E8E5F0] bg-[#FAFAFC]">
                    <h2 className="text-sm font-bold text-[#17152F]">Organization Information</h2>
                </div>
                <div className="p-6">
                    <p className="text-xs font-medium text-[#77758A] mb-4">These fields are managed directly by your organization.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-[#A5A3B5] uppercase tracking-wider mb-1">Employee Code</label>
                            <div className="text-sm font-semibold text-[#17152F]">{employeeData.employeeCode || '—'}</div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-[#A5A3B5] uppercase tracking-wider mb-1">Joining Date</label>
                            <div className="text-sm font-semibold text-[#17152F]">
                                {employeeData.joiningDate ? new Date(employeeData.joiningDate).toLocaleDateString() : '—'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-[#A5A3B5] uppercase tracking-wider mb-1">Status</label>
                            <div className="text-sm font-semibold text-[#17152F] capitalize">
                                {employeeData.status?.toLowerCase() || 'Active'}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        )}

      </div>
    </div>
  );
}
