import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { axiosPublic } from '../api/axios';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await axiosPublic.post('/auth/login/', {
        username: username,
        password: password
      });
      const { access, user: userData } = response.data;
      if (access) {
        login(access, userData);
        navigate('/dashboard');
      } else {
        setError('Login failed: Authentication token was not returned.');
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F6F8FC] font-sans">
      {/* Left Sidebar Banner */}
      <div className="md:w-5/12 lg:w-[40%] bg-gradient-to-b from-[#003882] via-[#003175] to-[#002256] text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden min-h-[340px] md:min-h-screen">
        {/* Subtle Decorative Background Wave Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 500 800" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-100 200 C 100 400, 300 100, 600 300 C 900 500, 700 800, 1000 700" stroke="white" strokeWidth="2" fill="none" />
            <path d="M-50 400 C 150 600, 350 300, 650 500 C 950 700, 750 1000, 1050 900" stroke="white" strokeWidth="2" fill="none" />
            <path d="M-150 0 C 50 200, 250 -100, 550 100 C 850 300, 650 600, 950 500" stroke="white" strokeWidth="2" fill="none" />
          </svg>
        </div>

        {/* Top Logo */}
        <div className="relative z-10">
          <span className="font-black text-2xl tracking-wider text-white uppercase">
            GRIDY
          </span>
        </div>

        {/* Middle Main Content */}
        <div className="relative z-10 my-auto py-8">
          <h1 className="text-4xl lg:text-[2.75rem] font-extrabold text-white tracking-tight leading-[1.15] mb-4">
            Secure Portal<br />
            for Admin<br />
            Personnel
          </h1>
          <p className="text-blue-100/75 text-sm lg:text-base font-normal max-w-sm mb-10 leading-relaxed">
            Access announcements, request, and records through our system
          </p>

          {/* Feature List */}
          <div className="space-y-4">
            {/* Feature 1 */}
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-[11px] lg:text-xs font-semibold tracking-wider text-blue-100/90 uppercase">
                CREDENTIALS VERIFICATION
              </span>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-[11px] lg:text-xs font-semibold tracking-wider text-blue-100/90 uppercase">
                ADMIN ACCESS TIERS
              </span>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <span className="text-[11px] lg:text-xs font-semibold tracking-wider text-blue-100/90 uppercase">
                SECURITY AUDIT COMPLIANCE
              </span>
            </div>
          </div>
        </div>

        {/* Empty bottom element for flex spacing balance */}
        <div className="relative z-10 hidden md:block"></div>
      </div>

      {/* Right Login Section */}
      <div className="md:w-7/12 lg:w-[60%] flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md">
          {/* Welcome Header */}
          <div className="mb-8">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-slate-500 text-sm mt-2 font-normal">
              Please enter your citizen credentials to continue.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50/90 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleLogin}>
            {/* Username Field */}
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-2">
                USERNAME
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#EEF2F6] focus:bg-white border border-transparent focus:border-[#003882] focus:ring-1 focus:ring-[#003882] rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  PASSWORD
                </label>
                <Link to="/forgot-password" className="text-xs font-bold text-[#003882] hover:underline transition-colors">
                    Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#EEF2F6] focus:bg-white border border-transparent focus:border-[#003882] focus:ring-1 focus:ring-[#003882] rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                  placeholder="........"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-[#003882] hover:bg-[#002D6B] active:bg-[#002254] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#003882]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75"
              >
                <span>{loading ? 'Logging in...' : 'Login to Admin Portal'}</span>
                {!loading && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
            </div>

            {/* Register Link */}
            <div className="text-center pt-3">
              <p className="text-xs text-slate-500 font-medium">
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-slate-900 hover:text-[#003882] hover:underline transition-colors">
                  Register here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
