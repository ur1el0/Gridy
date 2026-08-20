import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  Bell, 
  HelpCircle
} from 'lucide-react';
import { Sidebar } from './Sidebar';

export const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate()

  const userInitial = user?.full_name 
    ? user.full_name.charAt(0).toUpperCase() 
    : (user?.username?.charAt(0).toUpperCase() || 'J');
    
  const userName = user?.full_name || user?.username || 'Admin Juan';

  return (
    <div className="flex h-screen bg-[#F0F4FA] text-slate-900 font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Right Content Section */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-20 bg-transparent flex items-center justify-between px-8 shrink-0">
          {/* Search Input Box */}
          <div className="relative flex items-center w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search for documents or residents..."
              className="w-full bg-white/80 focus:bg-white text-slate-800 placeholder-slate-400 text-sm font-medium pl-11 pr-4 py-2.5 rounded-full border border-slate-200/80 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0047BA]/20 transition-all"
            />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/notifications')} className="p-2 text-blue-600 hover:bg-blue-50/80 rounded-full transition-colors relative" title="Notifications">
              <Bell className="w-5 h-5" />
            </button>
            
            <button onClick={() => navigate('/faqs')} className="p-2 text-blue-600 hover:bg-blue-50/80 rounded-full transition-colors" title="Help & Info">
              <HelpCircle className="w-5 h-5" />
            </button>

            <div onClick={() => navigate('/profile')} className="flex items-center gap-3 cursor-pointer pl-2">
              <span className="text-sm font-bold text-slate-800">{userName}</span>
              <div className="w-9 h-9 rounded-xl bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-sm shadow-xs border border-slate-200">
                {userInitial}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col justify-between">
          <div>
            <Outlet />
          </div>

          {/* Footer */}
          <footer className="pt-8 text-xs text-slate-400 font-medium">
            © 2026 Gridy Management Suite Management Suite
          </footer>
        </main>
      </div>
    </div>
  );
};
