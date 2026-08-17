import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  ListOrdered, 
  FileText, 
  Radio, 
  Users 
} from 'lucide-react';
import mainLogoSvg from '../../assets/MainLogo.svg';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Queue', path: '/queue', icon: ListOrdered },
  { name: 'Documents', path: '/documents', icon: FileText },
  { name: 'Communications', path: '/communications', icon: Radio },
  { name: 'Residents', path: '/residents', icon: Users },
];

export const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-64 bg-[#F8FAFD] border-r border-[#E2E8F0] h-screen flex flex-col justify-between select-none shrink-0">
      <div>
        <div className="h-20 flex items-center px-6 gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#091b35] flex items-center justify-center p-1.5 shadow-sm shrink-0">
            <img src={mainLogoSvg} alt="Gridy Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[19px] font-bold tracking-tight text-[#0f172a] leading-tight font-sans">
              Gridy
            </span>
            <span className="text-[9px] font-bold tracking-[0.14em] text-[#64748b] uppercase leading-tight mt-0.5">
              BARANGAY AUTHORITY
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-3.5 py-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
                
              const Icon = item.icon;

              return (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group ${
                      isActive
                        ? 'bg-[#E3EDFD] text-[#0047BA] font-bold shadow-xs'
                        : 'text-[#475569] font-medium hover:bg-[#EEF3FA] hover:text-[#0f172a]'
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      <Icon className={`w-5 h-5 transition-colors duration-150 ${
                        isActive 
                          ? 'text-[#0047BA]' 
                          : 'text-[#64748b] group-hover:text-[#0f172a]'
                      }`} />
                    </div>
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="px-3.5 pb-6 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
              isActive
                ? 'bg-[#E3EDFD] text-[#0047BA] font-bold shadow-xs'
                : 'text-[#475569] hover:bg-[#EEF3FA] hover:text-[#0f172a]'
            }`
          }
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <Settings className="w-[19px] h-[19px] text-[#475569] group-hover:text-[#0f172a] transition-colors" />
          </div>
          <span>Settings</span>
        </NavLink>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#DC2626] hover:bg-red-50 hover:text-red-700 transition-all duration-150 text-left cursor-pointer group"
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <LogOut className="w-[19px] h-[19px] text-[#DC2626] group-hover:text-red-700 transition-colors" />
          </div>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
