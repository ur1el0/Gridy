import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  PlusSquare, 
  FileText, 
  Calendar, 
  Users, 
  Megaphone, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  HelpCircle,
  Grid
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userInitial = user?.full_name 
    ? user.full_name.charAt(0).toUpperCase() 
    : (user?.username?.charAt(0).toUpperCase() || 'J');
    
  const userName = user?.full_name || user?.username || 'Admin Juan';

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Queue', path: '/queue', icon: PlusSquare },
    { label: 'Documents', path: '/documents', icon: FileText },
    { label: 'Schedule', path: '/schedule', icon: Calendar },
    { label: 'Residents', path: '/residents', icon: Users },
    { label: 'Announcements', path: '/announcements', icon: Megaphone },
  ];

  return (
    <div className="flex h-screen bg-background text-slate-900 font-sans">
      <aside className="w-64 bg-surface border-r border-border shadow-sm flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary">Gridy Admin</h1>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-md transition-colors ${
                    isActive ? "bg-primary text-white" : "hover:bg-primary/10 hover:text-primary"
                  }`
                }
              >
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/documents" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-md transition-colors ${
                    isActive ? "bg-primary text-white" : "hover:bg-primary/10 hover:text-primary"
                  }`
                }
              >
                Document Requests
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/reports" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-md transition-colors ${
                    isActive ? "bg-primary text-white" : "hover:bg-primary/10 hover:text-primary"
                  }`
                }
              >
                Issue Reports
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/announcements" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-md transition-colors ${
                    isActive ? "bg-primary text-white" : "hover:bg-primary/10 hover:text-primary"
                  }`
                }
              >
                Announcements
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/activities" 
                className={({ isActive }) => 
                  `block px-4 py-2 rounded-md transition-colors ${
                    isActive ? "bg-primary text-white" : "hover:bg-primary/10 hover:text-primary"
                  }`
                }
              >
                Activity Schedules
              </NavLink>
            </li>

          </ul>
        </nav>
        
        <div className="p-4 border-t border-border">
           <button 
             onClick={logout}
             className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors font-medium"
           >
             Sign Out
           </button>
        </div>
      </aside>

      {/* Main Right Content Section */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-20 bg-[#F0F4FA] flex items-center justify-between px-8 shrink-0">
          {/* Search Input Box */}
          <div className="relative flex items-center w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search for documents or residents..."
              className="w-full bg-[#E2E8F4] text-slate-800 placeholder-slate-400 text-sm font-medium pl-11 pr-4 py-2.5 rounded-full border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-[#0047BA]/30 transition-all"
            />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-5">
            <button className="p-2 text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors relative" title="Notifications">
              <Bell className="w-5 h-5 stroke-[2]" />
            </button>
            
            <button className="p-2 text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors" title="Help & Info">
              <HelpCircle className="w-5 h-5 stroke-[2]" />
            </button>

            <div className="h-6 w-[1px] bg-slate-300/80 mx-1"></div>

            {/* Profile Section */}
            <div className="flex items-center gap-3 cursor-pointer">
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
            © 2026 Gridy Management Suite
          </footer>
        </main>
      </div>
    </div>
  );
};