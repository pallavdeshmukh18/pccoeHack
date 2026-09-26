import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import authBg from '../assets/auth-bg.jpg';

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeCode: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkingState, setLinkingState] = useState(false);
  const [employeeCode, setEmployeeCode] = useState('');
  const [googleCredential, setGoogleCredential] = useState('');
  
  const { signup, googleAuth, googleLink } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (linkingState) {
      setIsSubmitting(true);
      try {
        await googleLink(googleCredential, employeeCode);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        employeeCode: formData.employeeCode,
        password: formData.password
      };
      
      await signup(payload);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.response?.data?.message) {
        let msg = err.response.data.message;
        if (msg === 'Employee not found') msg = "We couldn't find an active employee profile for this employee code.";
        if (msg === 'Employee is not active') msg = "Your employee profile is currently inactive. Please contact your administrator.";
        if (msg === 'Employee is already linked to a user') msg = "An account is already linked to this employee.";
        setError(msg);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    setError('');
    setIsSubmitting(true);
    try {
      const res = await googleAuth(tokenResponse.access_token);
      if (res.data.action === 'LOGIN_SUCCESS') {
        navigate('/dashboard', { replace: true });
      } else if (res.data.action === 'LINK_EMPLOYEE') {
        setGoogleCredential(tokenResponse.access_token);
        setLinkingState(true);
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Google authentication failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const customGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Google authentication failed.')
  });

  return (
    <div className="min-h-screen bg-gray-950 flex p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-[1400px] mx-auto bg-gray-900 border border-gray-800 rounded-3xl flex overflow-hidden shadow-2xl relative">
        
        {/* Left Side: Visual Inspiration from Reference */}
        <div className="hidden lg:flex w-1/2 relative bg-gray-950 p-12 flex-col justify-between overflow-hidden">
          <div className="absolute inset-0">
            <img src={authBg} alt="Abstract Capability Network" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-screen pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-transparent to-transparent pointer-events-none" />
          </div>

          <div className="relative z-10 flex items-center gap-4 text-xs font-semibold tracking-[0.2em] text-emerald-500 uppercase">
            <span className="w-12 h-[1px] bg-emerald-500/50"></span>
            Talent Intelligence
          </div>

          <div className="relative z-10 max-w-lg mb-12">
            <h1 className="text-5xl lg:text-7xl font-serif font-medium text-white tracking-tight leading-[1.1] mb-6">
              Create your profile.
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Link your employee record to begin mapping your capabilities and connecting with the network.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 md:p-16 flex flex-col justify-center relative bg-gray-900 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md mx-auto py-8"
          >
            {/* Header */}
            <div className="text-center mb-10">
              <Link to="/" className="inline-flex items-center justify-center gap-2 mb-8 hover:opacity-80 transition-opacity lg:hidden">
                <BrainCircuit className="w-8 h-8 text-emerald-500" />
                <span className="text-2xl font-semibold text-white tracking-wide">TalentTwin</span>
              </Link>
              <h2 className="text-4xl font-serif font-medium text-white mb-3 tracking-tight">
                {linkingState ? 'Complete your profile' : 'Sign Up'}
              </h2>
              <p className="text-gray-400">
                {linkingState ? 'Link your employee code to continue.' : 'Create an account to access TalentTwin'}
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            {!linkingState ? (
              <>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:bg-white/[0.05] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
                        placeholder="Jane"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:bg-white/[0.05] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
                        placeholder="Doe"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Work Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:bg-white/[0.05] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
                      placeholder="name@company.com"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Employee Code</label>
                    <input
                      type="text"
                      name="employeeCode"
                      value={formData.employeeCode}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:bg-white/[0.05] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
                      placeholder="e.g. EMP-1042"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:bg-white/[0.05] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner pr-10"
                          placeholder="Min. 8 chars"
                          required
                          minLength={8}
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                          tabIndex="-1"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:bg-white/[0.05] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
                        placeholder="Min. 8 chars"
                        required
                        minLength={8}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group mt-4"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Sign Up'
                    )}
                  </button>
                </form>

                <div className="my-8 flex items-center">
                  <div className="flex-1 h-px bg-gray-800"></div>
                  <span className="px-4 text-sm text-gray-500">or</span>
                  <div className="flex-1 h-px bg-gray-800"></div>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => customGoogleLogin()}
                    className="w-full py-3.5 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98] shadow-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>

                <p className="text-center mt-12 text-gray-400 text-sm">
                  Already have an account?{' '}
                  <Link to="/login" className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
                    Sign in
                  </Link>
                </p>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Employee Code</label>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:bg-white/[0.05] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
                    placeholder="e.g. EMP-1042"
                    required
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Please provide your assigned employee code to link your account.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group mt-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Verify employee
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLinkingState(false);
                    setGoogleCredential('');
                    setError('');
                  }}
                  className="w-full py-3.5 text-gray-400 hover:text-white font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
