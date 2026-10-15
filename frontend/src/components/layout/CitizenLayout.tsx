import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import { 
    FileText, 
    ListOrdered, 
    Radio, 
    LogOut, 
    ShieldCheck, 
    Building2,
    HandHeart,
    Sparkles,
} from 'lucide-react';
import kapitBayanSymbol from '../../assets/kapitbayan/symbol.png';
import { PublicNavigatorDrawer } from '../navigator/PublicNavigatorDrawer';

export const CitizenLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isNavigatorOpen, setIsNavigatorOpen] = React.useState(false);
    const navigatorEnabled = import.meta.env.VITE_PUBLIC_NAVIGATOR_ENABLED === 'true';

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const displayName = user?.full_name || user?.username || 'Resident';
    const barangayName = user?.barangay?.name || 'Barangay Ibabang Dupay';

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
            isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-primary-foreground opacity-75 hover:opacity-100 hover:bg-white/10'
        }`;

    return (
        <div className="min-h-screen flex flex-col bg-[#F8FAFD] text-slate-900 font-sans antialiased">
            {/* Top Citizen Navigation Bar */}
            <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Left: Brand & Barangay Badge */}
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center p-2 shadow-inner shrink-0">
                                <img src={kapitBayanSymbol} alt="" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold tracking-tight text-primary-foreground leading-none">
                                        KapitBayan
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary-foreground text-primary">
                                        Resident Portal
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-primary-foreground opacity-80 font-medium mt-1">
                                    <Building2 className="w-3.5 h-3.5 text-primary-foreground" />
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
                            <NavLink to="/portal/aid" className={navLinkClass}>
                                <HandHeart className="w-4 h-4" />
                                <span>Assistance</span>
                            </NavLink>
                        </nav>

                        {/* Right: Resident Profile Pill & Logout */}
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2.5 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full">
                                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-xs font-bold text-primary-foreground leading-tight">
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
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-primary-foreground hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer"
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
                    <NavLink to="/portal/aid" className={navLinkClass}>
                        <HandHeart className="w-4 h-4" />
                        <span className="text-xs">Aid</span>
                    </NavLink>
                </div>
            </header>

            {/* Main Content Viewport */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>

            {navigatorEnabled && (
                <>
                    {/* Floating "Ask Barangay" Launcher Button */}
                    <button
                        type="button"
                        onClick={() => setIsNavigatorOpen(true)}
                        aria-haspopup="dialog"
                        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 min-h-[44px] rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary/95 transition-all border border-white/20 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                        <Sparkles className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" aria-hidden="true" />
                        <span className="text-sm font-bold tracking-tight">Ask Barangay</span>
                    </button>

                    {/* Public Information AI Navigator Drawer */}
                    <PublicNavigatorDrawer
                        isOpen={isNavigatorOpen}
                        onClose={() => setIsNavigatorOpen(false)}
                    />
                </>
            )}

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white/60 py-4 text-center text-xs text-slate-500">
                Republic of the Philippines • Barangay Information and Service Management System • KapitBayan
            </footer>
        </div>
    );
};
