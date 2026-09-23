import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    FileText, 
    ListOrdered, 
    Radio, 
    LogOut, 
    ShieldCheck, 
    Building2
} from 'lucide-react';
import mainLogoSvg from '../../assets/MainLogo.svg';

export const CitizenLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const displayName = user?.full_name || user?.username || 'Resident';
    const barangayName = user?.barangay?.name || 'Barangay Ibabang Dupay';

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
            isActive
                ? 'bg-[#0284C7] text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
        }`;

    return (
        <div className="min-h-screen flex flex-col bg-[#F8FAFD] text-slate-900 font-sans antialiased">
            {/* Top Citizen Navigation Bar */}
            <header className="bg-[#091B35] text-white sticky top-0 z-50 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Left: Brand & Barangay Badge */}
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center p-2 shadow-inner shrink-0">
                                <img src={mainLogoSvg} alt="Gridy Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold tracking-tight text-white leading-none">
                                        Gridy
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#0284C7] text-white">
                                        Resident Portal
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mt-1">
                                    <Building2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                                    <span>{barangayName}</span>
                                </div>
                            </div>
                        </div>

                        {/* Center: Main Navigation Tabs */}
                        <nav className="hidden md:flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                            <NavLink to="/portal/documents" className={navLinkClass}>
                                <FileText className="w-4 h-4" />
                                <span>Documents & Clearances</span>
                            </NavLink>

                            <NavLink to="/portal/queue" className={navLinkClass}>
                                <ListOrdered className="w-4 h-4" />
                                <span>Live Queue Ticker</span>
                            </NavLink>

                            <NavLink to="/portal/bulletin" className={navLinkClass}>
                                <Radio className="w-4 h-4" />
                                <span>Community Bulletin</span>
                            </NavLink>
                        </nav>

                        {/* Right: Resident Profile Pill & Logout */}
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2.5 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full">
                                <div className="w-7 h-7 rounded-full bg-[#0284C7] flex items-center justify-center text-white text-xs font-bold">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-xs font-bold text-white leading-tight">
                                        {displayName}
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                                        <ShieldCheck className="w-3 h-3" />
                                        Verified Resident
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                title="Log Out"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Log Out</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Row (for smaller screens & kiosks) */}
                <div className="md:hidden border-t border-white/10 px-4 py-2 flex justify-around">
                    <NavLink to="/portal/documents" className={navLinkClass}>
                        <FileText className="w-4 h-4" />
                        <span className="text-xs">Documents</span>
                    </NavLink>
                    <NavLink to="/portal/queue" className={navLinkClass}>
                        <ListOrdered className="w-4 h-4" />
                        <span className="text-xs">Queue</span>
                    </NavLink>
                    <NavLink to="/portal/bulletin" className={navLinkClass}>
                        <Radio className="w-4 h-4" />
                        <span className="text-xs">Bulletin</span>
                    </NavLink>
                </div>
            </header>

            {/* Main Content Viewport */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white/60 py-4 text-center text-xs text-slate-500">
                Republic of the Philippines • Barangay Information and Service Management System • Gridy
            </footer>
        </div>
    );
};