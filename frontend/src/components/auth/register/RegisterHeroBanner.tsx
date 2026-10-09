import React from 'react';
import { Shield, FileCheck2, Clock, Users, KeyRound } from 'lucide-react';

interface RegisterHeroBannerProps {
    isAdminMode: boolean;
    onToggleMode: () => void;
}

export const RegisterHeroBanner: React.FC<RegisterHeroBannerProps> = ({
    isAdminMode,
    onToggleMode,
}) => {
    return (
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
                <span className="font-bold text-lg tracking-tight text-white sm:text-2xl">
                    KapitBayan
                </span>
                <button
                    type="button"
                    onClick={onToggleMode}
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
                        ? 'Create your administrative credentials to manage the KapitBayan Barangay System. Access is restricted to authorized barangay personnel.'
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
    );
};
