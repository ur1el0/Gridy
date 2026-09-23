import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { axiosPublic } from '../../api/axios';
// Updated line 4:
import { Shield, FileCheck2, Clock, Users, KeyRound, Upload, IdCard, X } from 'lucide-react';
export const Register: React.FC = () => {
    const [isAdminMode, setIsAdminMode] = useState(false);

    // Common fields
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Resident-specific fields
    const [username, setUsername] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [guardianId, setGuardianId] = useState('');

    // Verification proofs state
    const [philsysIdNumber, setPhilsysIdNumber] = useState('');
    const [philsysPhoto, setPhilsysPhoto] = useState<File | null>(null);
    const [utilityBillingType, setUtilityBillingType] = useState('Electric Bill');
    const [utilityBillingPhoto, setUtilityBillingPhoto] = useState<File | null>(null);
    const [secondaryIdType, setSecondaryIdType] = useState('');
    const [secondaryIdPhoto, setSecondaryIdPhoto] = useState<File | null>(null);

    // Admin-specific fields
    const [barangayId, setBarangayId] = useState('');
    const [affirmation, setAffirmation] = useState(false);
    const [dataPrivacyConsent, setDataPrivacyConsent] = useState(false);
    const [passkey, setPasskey] = useState('');


    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // Dynamically calculate if applicant is under 18
    const isMinor = React.useMemo(() => {
        if (!birthDate) return false;
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age < 18;
    }, [birthDate]);

    const handleRegister = async (e: React.SubmitEvent<HTMLElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (isAdminMode && !affirmation) {
            setError('You must affirm that you are an authorized barangay official or personnel.');
            return;
        }

        setLoading(true);

        try {
            if (isAdminMode) {
                // Official Personnel Registration Pipeline
                const payload: Record<string, any> = {
                    full_name: fullName.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    confirm_password: confirmPassword,
                    affirmation,
                    passkey,
                };

                if (barangayId.trim()) {
                    const parsedId = parseInt(barangayId.trim(), 10);
                    if (!isNaN(parsedId)) {
                        payload.barangay_id = parsedId;
                    }
                }

                await axiosPublic.post('/auth/register/admin/', payload);
                setSuccess('Official account registered successfully! Redirecting to login...');
            } else {
                // Resident Registration Pipeline (Multipart FormData)
                const formData = new FormData();
                formData.append('full_name', fullName.trim());
                formData.append('username', username.trim());
                formData.append('email', email.trim().toLowerCase());
                formData.append('password', password);
                formData.append('birth_date', birthDate);
                formData.append('voter_status', 'false');

                if (contactNumber.trim()) {
                    formData.append('contact_number', contactNumber.trim());
                }
                if (guardianId.trim()) {
                    formData.append('guardian_id', guardianId.trim());
                }
                if (barangayId.trim()) {
                    const parsedId = parseInt(barangayId.trim(), 10);
                    if (!isNaN(parsedId)) {
                        formData.append('barangay_id', String(parsedId));
                    }
                }

                // PhilSys Identity
                if (philsysIdNumber.trim()) {
                    formData.append('philsys_id_number', philsysIdNumber.trim());
                }
                if (philsysPhoto) {
                    formData.append('philsys_id_photo', philsysPhoto);
                }

                // Utility Proof of Residency
                if (utilityBillingType.trim()) {
                    formData.append('utility_billing_type', utilityBillingType.trim());
                }
                if (utilityBillingPhoto) {
                    formData.append('utility_billing_photo', utilityBillingPhoto);
                }

                // Secondary Valid ID (Optional)
                if (secondaryIdType.trim()) {
                    formData.append('secondary_id_type', secondaryIdType.trim());
                }
                if (secondaryIdPhoto) {
                    formData.append('secondary_id_photo', secondaryIdPhoto);
                }

                await axiosPublic.post('/auth/register/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setSuccess('Resident account created successfully! Redirecting to login...');
            }

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
                } else if (data.username) {
                    setError(Array.isArray(data.username) ? data.username[0] : data.username);
                } else if (data.email) {
                    setError(Array.isArray(data.email) ? data.email[0] : data.email);
                } else if (data.password) {
                    setError(Array.isArray(data.password) ? data.password[0] : data.password);
                } else if (data.birth_date) {
                    setError(Array.isArray(data.birth_date) ? data.birth_date[0] : data.birth_date);
                } else if (data.contact_number) {
                    setError(Array.isArray(data.contact_number) ? data.contact_number[0] : data.contact_number);
                } else if (data.guardian_id) {
                    setError(Array.isArray(data.guardian_id) ? data.guardian_id[0] : data.guardian_id);
                } else {
                    const firstKey = Object.keys(data)[0];
                    setError(Array.isArray(data[firstKey]) ? data[firstKey][0] : String(data[firstKey]));
                }
            } else {
                setError('Registration failed. Please verify submitted details and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#F6F8FC] font-sans">
            {/* Left Sidebar Banner */}
            <div
                className={`w-full md:w-5/12 lg:w-[40%] text-white p-5 md:p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden md:min-h-screen transition-all duration-500 ${
                    isAdminMode
                        ? 'bg-gradient-to-b from-[#091B35] via-[#0F2D59] to-[#001128]'
                        : 'bg-gradient-to-b from-[#0284C7] via-[#0369A1] to-[#075985]'
                }`}
            >
                {/* Decorative Wave Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 500 800" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M-100 200 C 100 400, 300 100, 600 300 C 900 500, 700 800, 1000 700" stroke="white" strokeWidth="2" fill="none" />
                        <path d="M-50 400 C 150 600, 350 300, 650 500 C 950 700, 750 1000, 1050 900" stroke="white" strokeWidth="2" fill="none" />
                        <path d="M-150 0 C 50 200, 250 -100, 550 100 C 850 300, 650 600, 950 500" stroke="white" strokeWidth="2" fill="none" />
                    </svg>
                </div>

                {/* Top Logo & Mode Switch Pill */}
                <div className="relative z-10 flex items-center justify-between">
                    <span className="font-black text-2xl tracking-wider text-white uppercase">
                        GRIDY
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            setError('');
                            setSuccess('');
                            setIsAdminMode((prev) => !prev);
                        }}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 select-none ${
                            isAdminMode
                                ? 'bg-amber-400 text-slate-900 shadow-sm hover:bg-amber-300'
                                : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                        }`}
                        title="Tap to switch registration type"
                    >
                        <span>{isAdminMode ? 'Staff Registration' : 'Resident Registration'}</span>
                        <span className="text-[11px] opacity-75 font-bold">⇄</span>
                    </button>
                </div>

                {/* Middle Content (Hidden on mobile, visible on desktop) */}
                <div className="relative z-10 mt-10 md:mt-14 mb-auto hidden md:block">
                    <h1 className="text-4xl lg:text-[2.75rem] font-extrabold text-white tracking-tight leading-[1.15] mb-4">
                        {isAdminMode ? (
                            <>
                                Register as<br />
                                Authorized<br />
                                Personnel
                            </>
                        ) : (
                            <>
                                Resident<br />
                                Account<br />
                                Registration
                            </>
                        )}
                    </h1>
                    <p className="text-blue-100/75 text-sm lg:text-base font-normal max-w-sm mb-10 leading-relaxed">
                        {isAdminMode
                            ? 'Create your administrative credentials to manage the Gridy Barangay System. Access is restricted to authorized barangay personnel.'
                            : 'Register your resident account to request clearances, access community services, and track lobby queues.'}
                    </p>

                    <div className="space-y-4">
                        {isAdminMode ? (
                            <>
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white shrink-0">
                                        <Shield className="w-5 h-5 text-amber-300" />
                                    </div>
                                    <span className="text-[11px] lg:text-xs font-semibold tracking-wider text-blue-100/90 uppercase">
                                        CREDENTIALS VERIFICATION
                                    </span>
                                </div>
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white shrink-0">
                                        <KeyRound className="w-5 h-5 text-amber-300" />
                                    </div>
                                    <span className="text-[11px] lg:text-xs font-semibold tracking-wider text-blue-100/90 uppercase">
                                        ADMIN ACCESS TIERS
                                    </span>
                                </div>
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white shrink-0">
                                        <FileCheck2 className="w-5 h-5 text-amber-300" />
                                    </div>
                                    <span className="text-[11px] lg:text-xs font-semibold tracking-wider text-blue-100/90 uppercase">
                                        SECURITY AUDIT COMPLIANCE
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white shrink-0">
                                        <FileCheck2 className="w-5 h-5 text-sky-200" />
                                    </div>
                                    <span className="text-[11px] lg:text-xs font-semibold tracking-wider text-blue-100/90 uppercase">
                                        OFFICIAL CLEARANCES ACCESS
                                    </span>
                                </div>
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white shrink-0">
                                        <Clock className="w-5 h-5 text-sky-200" />
                                    </div>
                                    <span className="text-[11px] lg:text-xs font-semibold tracking-wider text-blue-100/90 uppercase">
                                        REAL-TIME QUEUE TICKETING
                                    </span>
                                </div>
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white shrink-0">
                                        <Users className="w-5 h-5 text-sky-200" />
                                    </div>
                                    <span className="text-[11px] lg:text-xs font-semibold tracking-wider text-blue-100/90 uppercase">
                                        COMMUNITY PROGRAM UPDATES
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Registration Form */}
            <div className="w-full md:w-7/12 lg:w-[60%] flex flex-col justify-center items-center px-6 py-8 sm:p-12 lg:p-16 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                isAdminMode ? 'bg-amber-100 text-amber-900' : 'bg-sky-100 text-sky-900'
                            }`}>
                                {isAdminMode ? 'Authorized Staff' : 'Resident'}
                            </span>
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            {isAdminMode ? 'Administrative Registration' : 'Resident Registration'}
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">
                            {isAdminMode
                                ? 'Enter your staff authorization details to create an official account.'
                                : 'Complete your registration details to access barangay services.'}
                        </p>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="mb-5 bg-red-50/90 border border-red-200 rounded-xl p-3.5 flex items-center gap-3">
                            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium text-red-700">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3">
                            <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-sm font-medium text-emerald-700">{success}</p>
                        </div>
                    )}

                    {/* Registration Form */}
                    <form className="space-y-4" onSubmit={handleRegister}>
                        {/* Full Name */}
                        <div>
                            <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                                FULL NAME
                            </label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-3 bg-[#EEF2F6] focus:bg-white border border-transparent focus:border-[#0284C7] rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                                placeholder="Juan Dela Cruz"
                            />
                        </div>

                        {/* Resident Mode: Username */}
                        {!isAdminMode && (
                            <div>
                                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                                    USERNAME
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#EEF2F6] focus:bg-white border border-transparent focus:border-[#0284C7] rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                                    placeholder="juandelacruz"
                                />
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                                EMAIL ADDRESS
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-[#EEF2F6] focus:bg-white border border-transparent focus:border-[#0284C7] rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                                placeholder="juan@example.com"
                            />
                        </div>

                        {/* Resident Mode: Contact Number */}
                        {!isAdminMode && (
                            <div>
                                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                                    CONTACT NUMBER
                                </label>
                                <input
                                    type="tel"
                                    value={contactNumber}
                                    onChange={(e) => setContactNumber(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#EEF2F6] focus:bg-white border border-transparent focus:border-[#0284C7] rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                                    placeholder="0917 123 4567"
                                />
                            </div>
                        )}

                        {/* Resident Mode: Date of Birth */}
                        {!isAdminMode && (
                            <div>
                                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                                    DATE OF BIRTH
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#EEF2F6] focus:bg-white border border-transparent focus:border-[#0284C7] rounded-xl text-sm font-medium text-slate-900 outline-none transition-all"
                                />
                            </div>
                        )}

                        {/* Resident Mode: Identity & Residency Verification Proofs */}
                        {!isAdminMode && (
                            <div className="space-y-4 pt-2 border-t border-slate-200">
                                <div className="flex items-center gap-2">
                                    <IdCard className="w-4 h-4 text-[#0284C7]" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Identity & Residency Verification
                                    </h4>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed -mt-2">
                                    Provide your Philippine National ID (PhilSys) and a household utility bill to verify local residency.
                                </p>

                                {/* 1. PhilSys ID Number & Photo */}
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-bold tracking-wider text-slate-600 uppercase mb-1">
                                            PHILSYS NATIONAL ID NUMBER
                                        </label>
                                        <input
                                            type="text"
                                            value={philsysIdNumber}
                                            onChange={(e) => setPhilsysIdNumber(e.target.value)}
                                            placeholder="e.g. 1234-5678-9012-3456"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-[#0284C7] rounded-lg text-xs font-mono text-slate-900 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold tracking-wider text-slate-600 uppercase mb-1">
                                            UPLOAD PHILSYS ID CARD PHOTO
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed border-slate-300 hover:border-[#0284C7] rounded-lg text-xs text-slate-600 hover:text-[#0284C7] transition-all">
                                                <Upload className="w-3.5 h-3.5" />
                                                <span className="truncate">{philsysPhoto ? philsysPhoto.name : 'Choose ID photo...'}</span>
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    className="hidden" 
                                                    onChange={(e) => setPhilsysPhoto(e.target.files?.[0] || null)} 
                                                />
                                            </label>
                                            {philsysPhoto && (
                                                <button
                                                    type="button"
                                                    onClick={() => setPhilsysPhoto(null)}
                                                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                                    title="Remove attachment"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Utility Billing Residency Proof */}
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-bold tracking-wider text-slate-600 uppercase mb-1">
                                                BILLING STATEMENT TYPE
                                            </label>
                                            <select
                                                value={utilityBillingType}
                                                onChange={(e) => setUtilityBillingType(e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-[#0284C7] rounded-lg text-xs text-slate-800 outline-none transition-all cursor-pointer"
                                            >
                                                <option value="Electric Bill">Electric Bill (Meralco/Quezelco)</option>
                                                <option value="Water Bill">Water Bill (PrimeWater/Maynilad)</option>
                                                <option value="Internet / Telco Bill">Internet / Telco Bill</option>
                                                <option value="Lease Agreement">Residential Lease Contract</option>
                                                <option value="Other Utility">Other Billing Statement</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold tracking-wider text-slate-600 uppercase mb-1">
                                                UPLOAD BILLING RECEIPT
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed border-slate-300 hover:border-[#0284C7] rounded-lg text-xs text-slate-600 hover:text-[#0284C7] transition-all">
                                                    <Upload className="w-3.5 h-3.5" />
                                                    <span className="truncate">{utilityBillingPhoto ? utilityBillingPhoto.name : 'Choose bill photo...'}</span>
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        className="hidden" 
                                                        onChange={(e) => setUtilityBillingPhoto(e.target.files?.[0] || null)} 
                                                    />
                                                </label>
                                                {utilityBillingPhoto && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setUtilityBillingPhoto(null)}
                                                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                                        title="Remove attachment"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Optional Secondary Valid ID */}
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-bold tracking-wider text-slate-600 uppercase mb-1">
                                                SECONDARY VALID ID (OPTIONAL)
                                            </label>
                                            <select
                                                value={secondaryIdType}
                                                onChange={(e) => setSecondaryIdType(e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-[#0284C7] rounded-lg text-xs text-slate-800 outline-none transition-all cursor-pointer"
                                            >
                                                <option value="">None / Not Applicable</option>
                                                <option value="Passport">Philippine Passport</option>
                                                <option value="Driver's License">Driver's License (LTO)</option>
                                                <option value="UMID">UMID (SSS / GSIS)</option>
                                                <option value="Postal ID">Postal ID (PHLPost)</option>
                                                <option value="PRC ID">PRC ID</option>
                                                <option value="Senior / PWD ID">Senior Citizen / PWD ID</option>
                                                <option value="Student ID">Student ID</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold tracking-wider text-slate-600 uppercase mb-1">
                                                UPLOAD SECONDARY ID
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed rounded-lg text-xs transition-all ${
                                                    secondaryIdType ? 'cursor-pointer border-slate-300 hover:border-[#0284C7] text-slate-600 hover:text-[#0284C7]' : 'cursor-not-allowed border-slate-200 text-slate-300'
                                                }`}>
                                                    <Upload className="w-3.5 h-3.5" />
                                                    <span className="truncate">{secondaryIdPhoto ? secondaryIdPhoto.name : 'Choose secondary ID...'}</span>
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        disabled={!secondaryIdType}
                                                        className="hidden" 
                                                        onChange={(e) => setSecondaryIdPhoto(e.target.files?.[0] || null)} 
                                                    />
                                                </label>
                                                {secondaryIdPhoto && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSecondaryIdPhoto(null)}
                                                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                                        title="Remove attachment"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Minor Guardian Constraint Box (Appears dynamically if age < 18) */}
                        {!isAdminMode && isMinor && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 animate-fadeIn">
                                <div className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase tracking-wider">
                                    <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>Parent / Legal Guardian Verification Required</span>
                                </div>
                                <p className="text-[11px] text-amber-800 leading-relaxed">
                                    Applicants under 18 must link their registration to an already registered parent or legal guardian's account.
                                </p>
                                <div>
                                    <label className="block text-[10px] font-extrabold tracking-wider text-amber-900 uppercase mb-1">
                                        GUARDIAN'S REGISTERED USERNAME *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={guardianId}
                                        onChange={(e) => setGuardianId(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-white border border-amber-300 focus:border-amber-500 rounded-lg text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                                        placeholder="e.g. resident_dupay"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Universal Barangay Selection Dropdown */}
                        <div>
                            <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                                LOCAL BARANGAY JURISDICTION
                            </label>
                            <select
                                required
                                value={barangayId}
                                onChange={(e) => setBarangayId(e.target.value)}
                                className="w-full px-4 py-3 bg-[#EEF2F6] focus:bg-white border border-transparent focus:border-[#0284C7] rounded-xl text-sm font-medium text-slate-900 outline-none transition-all cursor-pointer"
                            >
                                <option value="">Select your Barangay</option>
                                <option value="2">Barangay Ibabang Dupay (Lucena City)</option>
                                <option value="3">Barangay Daungan (Pagbilao, Quezon)</option>
                            </select>
                        </div>

                        {/* Admin Mode: Barangay ID */}
                        {isAdminMode && (
                            <div>
                                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                                    BARANGAY ID (OPTIONAL)
                                </label>
                                <input
                                    type="text"
                                    value={barangayId}
                                    onChange={(e) => setBarangayId(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#EEF2F6] focus:bg-white border border-transparent focus:border-[#0284C7] rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                                    placeholder="e.g. 1"
                                />
                            </div>
                        )}

                        {/* Passwords */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                                    PASSWORD
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#EEF2F6] focus:bg-white border border-transparent focus:border-[#0284C7] rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                                    CONFIRM PASSWORD
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#EEF2F6] focus:bg-white border border-transparent focus:border-[#0284C7] rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Resident Mode: Data Privacy Consent */}
                        {!isAdminMode && (
                            <div className="pt-1">
                                <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        required
                                        checked={dataPrivacyConsent}
                                        onChange={(e) => setDataPrivacyConsent(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 text-[#0284C7] rounded focus:ring-0 border-slate-300 cursor-pointer shrink-0"
                                    />
                                    <span className="text-xs text-slate-600 leading-relaxed">
                                        I consent to provide my personal data as a resident for barangay verification, in accordance with the <strong>RA 10173 Data Privacy Act</strong>.
                                    </span>
                                </label>
                            </div>
                        )}
                        
                        {/* Admin Passkey Requirement */}
                        {isAdminMode && (
                            <div>
                                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5 items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    LGU ADMINISTRATIVE PASSKEY
                                </label>
                                <input
                                    type="password"
                                    required={isAdminMode}
                                    value={passkey}
                                    onChange={(e) => setPasskey(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#EEF2F6] focus:bg-white border border-transparent focus:border-[#091B35] focus:ring-1 focus:ring-[#091B35] rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                                    placeholder="Enter secure LGU passkey"
                                />
                            </div>
                        )}

                        {/* Admin Affirmation Checkbox */}
                        {isAdminMode && (
                            <div className="pt-1">
                                <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={affirmation}
                                        onChange={(e) => setAffirmation(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 text-[#091B35] rounded focus:ring-0 border-slate-300 cursor-pointer shrink-0"
                                    />
                                    <span className="text-xs text-slate-600 leading-relaxed">
                                        I affirm that I am an authorized barangay official or personnel and agree to official LGU protocols.
                                    </span>
                                </label>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading || (!isAdminMode && !dataPrivacyConsent) || (isAdminMode && (!affirmation || !passkey))}
                                className={`w-full py-3.5 px-6 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed ${
                                    isAdminMode
                                        ? 'bg-[#091B35] hover:bg-[#0F2D59] shadow-[#091B35]/20'
                                        : 'bg-[#0284C7] hover:bg-[#0369A1] shadow-[#0284C7]/25'
                                }`}
                            >
                                <span>
                                    {loading
                                        ? 'Creating Account...'
                                        : isAdminMode
                                        ? 'Create Admin Account'
                                        : 'Create Resident Account'}
                                </span>
                            </button>
                        </div>

                        {/* Mode Switch Link */}
                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setError('');
                                    setSuccess('');
                                    setIsAdminMode((prev) => !prev);
                                }}
                                className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                                {isAdminMode ? (
                                    <span>Registering as a Resident? <span className="text-[#0284C7] font-bold underline">Switch to Resident Sign Up</span></span>
                                ) : (
                                    <span>Barangay Personnel? <span className="text-slate-900 font-bold underline">Switch to Official Registration</span></span>
                                )}
                            </button>
                        </div>

                        {/* Back to Login */}
                        <div className="text-center pt-1">
                            <p className="text-xs text-slate-500 font-medium">
                                Already have an account?{' '}
                                <Link to="/login" className="font-bold text-slate-900 hover:text-[#0284C7] hover:underline transition-colors">
                                    Log in here
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};