import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { axiosPublic } from '../../api/axios';

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [barangayId, setBarangayId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [affirmation, setAffirmation] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validations
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!affirmation) {
      setError('You must affirm that you are an authorized employee of the district authority.');
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, any> = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirm_password: confirmPassword,
        affirmation,
      };

      if (barangayId.trim()) {
        const parsedId = parseInt(barangayId.trim(), 10);
        if (!isNaN(parsedId)) {
          payload.barangay_id = parsedId;
        }
      }

      await axiosPublic.post('/auth/register/admin/', payload);
      setSuccess('Admin account registered successfully! Redirecting to login...');

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Registration failed:', err);
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          setError(data);
        } else if (data.detail) {
          setError(data.detail);
        } else if (data.email) {
          setError(Array.isArray(data.email) ? data.email[0] : data.email);
        } else if (data.confirm_password) {
          setError(Array.isArray(data.confirm_password) ? data.confirm_password[0] : data.confirm_password);
        } else if (data.password) {
          setError(Array.isArray(data.password) ? data.password[0] : data.password);
        } else if (data.barangay_id) {
          setError(Array.isArray(data.barangay_id) ? data.barangay_id[0] : data.barangay_id);
        } else if (data.affirmation) {
          setError(Array.isArray(data.affirmation) ? data.affirmation[0] : data.affirmation);
        } else if (data.error) {
          setError(data.error);
        } else {
          const firstKey = Object.keys(data)[0];
          setError(Array.isArray(data[firstKey]) ? data[firstKey][0] : String(data[firstKey]));
        }
      } else {
        setError('Failed to create admin account. Please check your connection and try again.');
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
            Register as<br />
            Authorized<br />
            Personnel
          </h1>
          <p className="text-blue-100/75 text-sm lg:text-base font-normal max-w-sm mb-10 leading-relaxed">
            Create your administrative credentials to manage the App Name. Access is restricted to verified district authority staff.
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

        {/* Bottom spacing anchor */}
        <div className="relative z-10 hidden md:block"></div>
      </div>

      {/* Right Registration Section */}
      <div className="md:w-7/12 lg:w-[60%] flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#003882] tracking-tight">
              Administrative Registration
            </h2>
            <p className="text-slate-500 text-sm mt-2 font-normal">
              Enter your authorization code and personal details to begin.
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

          {/* Success Alert */}
          {success && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-emerald-800">{success}</p>
            </div>
          )}

          {/* Registration Form */}
          <form className="space-y-5" onSubmit={handleRegister}>
            {/* Row 1: Full Name & Barangay ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name Field */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-2">
                  FULL NAME
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
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-[#EEF2F6] focus:bg-white border border-transparent focus:border-[#003882] focus:ring-1 focus:ring-[#003882] rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                    placeholder="Juan De La Cruz"
                  />
                </div>
              </div>

              {/* Barangay ID Field */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-2">
                  BARANGAY ID
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={barangayId}
                    onChange={(e) => setBarangayId(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-[#EEF2F6] focus:bg-white border border-transparent focus:border-[#003882] focus:ring-1 focus:ring-[#003882] rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                    placeholder="e.g. 1"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Email Field */}
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-2">
                EMAIL
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#EEF2F6] focus:bg-white border border-transparent focus:border-[#003882] focus:ring-1 focus:ring-[#003882] rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                  placeholder="juandelacruz@gmail.com"
                />
              </div>
            </div>

            {/* Row 3: Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password Field */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-2">
                  PASSWORD
                </label>
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
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-2">
                  CONFIRM PASSWORD
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-[#EEF2F6] focus:bg-white border border-transparent focus:border-[#003882] focus:ring-1 focus:ring-[#003882] rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Affirmation Checkbox */}
            <div className="flex items-start pt-1">
              <input
                id="affirmation"
                type="checkbox"
                checked={affirmation}
                onChange={(e) => setAffirmation(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#003882] focus:ring-[#003882] cursor-pointer shrink-0"
              />
              <label htmlFor="affirmation" className="ml-2.5 text-xs text-slate-600 leading-relaxed cursor-pointer select-none">
                I affirm that I am an authorized employee of the district authority and agree to the institutional protocols.
              </label>
            </div>

            {/* Row 5: Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-[#003882] hover:bg-[#002D6B] active:bg-[#002254] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#003882]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75"
              >
                <span>{loading ? 'Creating Account...' : 'Create Admin Account'}</span>
                {!loading && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
            </div>

            {/* Row 6: Divider */}
            <div className="border-t border-slate-200/80 my-6"></div>

            {/* Row 7: Login Link */}
            <div className="text-center">
              <p className="text-xs text-slate-500 font-medium">
                Already have an admin account?{' '}
                <Link to="/login" className="font-bold text-[#003882] hover:underline transition-colors">
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
