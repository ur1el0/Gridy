import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { axiosPublic } from '../../api/axios';
import { Shield, FileCheck2, Clock, Users, KeyRound, IdCard, ChevronDown } from 'lucide-react';
import { TextField } from '../../components/ui/TextField';
import { FileUploadZone } from '../../components/ui/FileUploadZone';
import { Button } from '../../components/ui/Button';

interface PublicBarangay {
    id: number;
    name: string;
    municipality: string;
    province: string;
}

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
    const [isVerificationExpanded, setIsVerificationExpanded] = useState(false);
    const [philsysIdNumber, setPhilsysIdNumber] = useState('');
    const [philsysPhoto, setPhilsysPhoto] = useState<File | null>(null);
    const [utilityBillingType, setUtilityBillingType] = useState('Electric Bill');
    const [utilityBillingPhoto, setUtilityBillingPhoto] = useState<File | null>(null);
    const [secondaryIdType, setSecondaryIdType] = useState('');
    const [secondaryIdPhoto, setSecondaryIdPhoto] = useState<File | null>(null);

    // Admin-specific fields
    const [barangayId, setBarangayId] = useState('');
    const [barangays, setBarangays] = useState<PublicBarangay[]>([]);
    const [loadingBarangays, setLoadingBarangays] = useState(true);
    const [barangayDirectoryError, setBarangayDirectoryError] = useState('');
    const [affirmation, setAffirmation] = useState(false);
    const [dataPrivacyConsent, setDataPrivacyConsent] = useState(false);
    const [passkey, setPasskey] = useState('');


    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    React.useEffect(() => {
        let isMounted = true;
        axiosPublic.get('/auth/public/barangays/')
            .then((response) => {
                const data = response.data.results || response.data;
                if (isMounted) setBarangays(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (isMounted) setBarangayDirectoryError('Approved barangays could not be loaded. Please try again later.');
            })
            .finally(() => {
                if (isMounted) setLoadingBarangays(false);
            });
        return () => { isMounted = false; };
    }, []);

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
                    username: username.trim(),
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
                formData.append(
                    'privacy_consent',
                    dataPrivacyConsent ? 'true' : 'false',
                );
                formData.append('privacy_consent_version', 'resident-v1');

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
                        <TextField 
                            label="FULL NAME (AS IN ID)"
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Juan Dela Cruz"
                            isAdminMode={isAdminMode}
                        />

                        <TextField
                            label="USERNAME"
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={isAdminMode ? 'admin_captain' : 'juandelacruz'}
                            isAdminMode={isAdminMode}
                        />

                        <TextField
                            label="EMAIL ADDRESS"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="juan@example.com"
                            isAdminMode={isAdminMode}
                        />

                        {/* Resident Mode: Contact Number & Date of Birth */}
                        {!isAdminMode && (
                            <>
                                <TextField
                                    label="CONTACT NUMBER"
                                    type="tel"
                                    value={contactNumber}
                                    onChange={(e) => setContactNumber(e.target.value)}
                                    placeholder="0917 123 4567"
                                />
                                <TextField
                                    label="DATE OF BIRTH"
                                    type="date"
                                    required
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                />
                            </>
                        )}

                        {/* Resident Mode: Identity & Residency Verification Proofs */}
                        {!isAdminMode && (
                            <div className="border border-slate-200 rounded-xl bg-slate-50/70 overflow-hidden transition-all shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setIsVerificationExpanded((prev) => !prev)}
                                    className="w-full flex items-center justify-between p-3.5 cursor-pointer text-left hover:bg-slate-100/70 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <IdCard className="w-4 h-4 text-[#0284C7] shrink-0" />
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                                Identity & Residency Verification
                                            </h4>
                                            <p className="text-[11px] text-slate-500">
                                                {isVerificationExpanded
                                                    ? 'Tap to collapse verification documents'
                                                    : 'Tap to expand and upload PhilSys ID & residency proofs'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {(philsysPhoto || utilityBillingPhoto || secondaryIdPhoto || philsysIdNumber.trim()) && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                                                Proofs Attached
                                            </span>
                                        )}
                                        <ChevronDown className={"w-4 h-4 text-slate-400 transition-transform duration-200 " + (isVerificationExpanded ? "rotate-180" : "")} />
                                    </div>
                                </button>

                                {isVerificationExpanded && (
                                    <div className="p-3.5 pt-3 space-y-4 border-t border-slate-200 bg-white">
                                        <p className="text-[11px] text-slate-500 leading-relaxed">
                                            Provide your Philippine National ID (PhilSys) and a household utility bill to verify local residency.
                                        </p>

                                        {/* 1. PhilSys ID Number & Photo */}
                                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                                            <TextField
                                                label="PHILSYS NATIONAL ID NUMBER"
                                                type="text"
                                                value={philsysIdNumber}
                                                onChange={(e) => setPhilsysIdNumber(e.target.value)}
                                                placeholder="e.g. 1234-5678-9012-3456"
                                                className="font-mono"
                                            />
                                            <FileUploadZone
                                                label="UPLOAD PHILSYS ID CARD PHOTO"
                                                file={philsysPhoto}
                                                onFileChange={setPhilsysPhoto}
                                            />
                                        </div>

                                        {/* 2. Utility Billing Residency Proof */}
                                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                                            <div>
                                                <label className="block text-[10px] font-bold tracking-wider text-slate-600 uppercase mb-1">
                                                    SELECT PRIMARY RESIDENCY PROOF
                                                </label>
                                                <select
                                                    value={utilityBillingType}
                                                    onChange={(e) => setUtilityBillingType(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-[#0284C7] rounded-lg text-xs font-semibold text-slate-700 outline-none transition-all cursor-pointer"
                                                >
                                                    <option value="Electric Bill">Electric Bill (Meralco/Quezelco)</option>
                                                    <option value="Water Bill">Water Bill (PrimeWater/Maynilad)</option>
                                                    <option value="Internet / Telco Bill">Internet / Telco Bill</option>
                                                    <option value="Lease Agreement">Residential Lease Contract</option>
                                                </select>
                                            </div>
                                            <FileUploadZone
                                                label="UPLOAD RECENT UTILITY BILL (LAST 3 MONTHS)"
                                                file={utilityBillingPhoto}
                                                onFileChange={setUtilityBillingPhoto}
                                            />
                                        </div>

                                        {/* 3. Secondary ID Proof */}
                                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                                            <div>
                                                <label className="block text-[10px] font-bold tracking-wider text-slate-600 uppercase mb-1 flex items-center gap-2">
                                                    SECONDARY ID <span className="text-[9px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded uppercase">Optional</span>
                                                </label>
                                                <select
                                                    value={secondaryIdType}
                                                    onChange={(e) => {
                                                        setSecondaryIdType(e.target.value);
                                                        if (!e.target.value) setSecondaryIdPhoto(null);
                                                    }}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-[#0284C7] rounded-lg text-xs font-semibold text-slate-700 outline-none transition-all cursor-pointer"
                                                >
                                                    <option value="">None (I only have PhilSys ID)</option>
                                                    <option value="Voter ID">Voter's ID / Certification</option>
                                                    <option value="Driver License">Driver's License</option>
                                                    <option value="Passport">Passport</option>
                                                    <option value="Senior Citizen ID">Senior Citizen ID</option>
                                                    <option value="Student ID">Student ID (If Minor)</option>
                                                </select>
                                            </div>
                                            <FileUploadZone
                                                label="UPLOAD SECONDARY ID PHOTO"
                                                file={secondaryIdPhoto}
                                                onFileChange={setSecondaryIdPhoto}
                                                disabled={!secondaryIdType}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Minor Guardian Constraint Box */}
                        {!isAdminMode && isMinor && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 animate-fadeIn">
                                <div className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase tracking-wider">
                                    <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>Parent / Legal Guardian Verification Required</span>
                                </div>
                                <p className="text-[11px] text-amber-800 leading-relaxed">
                                    Applicants under 18 must link their registration to an already registered parent or legal guardian's account.
                                </p>
                                <TextField
                                    label="GUARDIAN'S REGISTERED USERNAME *"
                                    type="text"
                                    required
                                    value={guardianId}
                                    onChange={(e) => setGuardianId(e.target.value)}
                                    placeholder="e.g. resident_dupay"
                                />
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
                                disabled={loadingBarangays || barangays.length === 0}
                                onChange={(e) => setBarangayId(e.target.value)}
                                className={`w-full px-4 py-3 bg-[#EEF2F6] focus:bg-white border border-transparent rounded-xl text-sm font-medium text-slate-900 outline-none transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${isAdminMode ? 'focus:border-[#091B35] focus:ring-1 focus:ring-[#091B35]' : 'focus:border-[#0284C7]'}`}
                            >
                                <option value="">{loadingBarangays ? 'Loading approved barangays…' : 'Select your Barangay'}</option>
                                {barangays.map((barangay) => (
                                    <option key={barangay.id} value={barangay.id}>
                                        {barangay.name}{barangay.municipality ? ` (${barangay.municipality}${barangay.province ? `, ${barangay.province}` : ''})` : ''}
                                    </option>
                                ))}
                            </select>
                            {barangayDirectoryError && <p role="alert" className="mt-2 text-xs text-rose-700">{barangayDirectoryError}</p>}
                        </div>

                        {isAdminMode && (
                            <p className="text-xs text-slate-600">
                                Registering a new barangay? <Link to="/register/barangay" className="font-bold text-primary-text underline">Apply for DILG review</Link>.
                            </p>
                        )}

                        {/* Passwords */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <TextField
                                label="PASSWORD"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                isAdminMode={isAdminMode}
                            />
                            <TextField
                                label="CONFIRM PASSWORD"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                isAdminMode={isAdminMode}
                            />
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
                            <TextField
                                label="LGU ADMINISTRATIVE PASSKEY"
                                type="password"
                                required={isAdminMode}
                                value={passkey}
                                onChange={(e) => setPasskey(e.target.value)}
                                placeholder="Enter secure LGU passkey"
                                isAdminMode={isAdminMode}
                                icon={<KeyRound className="w-3.5 h-3.5 text-red-500" />}
                            />
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
                            <Button
                                type="submit"
                                isAdminMode={isAdminMode}
                                loading={loading}
                                loadingText={isAdminMode ? 'Creating Admin Account...' : 'Creating Resident Account...'}
                                disabled={
                                    loadingBarangays || barangays.length === 0 ||
                                    (!isAdminMode && !dataPrivacyConsent) ||
                                    (isAdminMode && (!affirmation || !passkey))
                                }
                            >
                                {isAdminMode ? 'Create Admin Account' : 'Create Resident Account'}
                            </Button>
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
