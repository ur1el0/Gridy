import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Settings, LogOut } from 'lucide-react';

import dashboardIcon from '../../assets/sidebar-icons/dashboard.png';
import queueIcon from '../../assets/sidebar-icons/queue.png';
import documentsIcon from '../../assets/sidebar-icons/documents.png';
import scheduleIcon from '../../assets/sidebar-icons/schedule.png';
import residentsIcon from '../../assets/sidebar-icons/residents.png';
import announcementsIcon from '../../assets/sidebar-icons/announcements.png';
import mainLogoSvg from '../../assets/MainLogo.svg';

interface NavItem {
  name: string;
  path: string;
  icon: string;
  isDashboard?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: dashboardIcon, isDashboard: true },
  { name: 'Queue', path: '/queue', icon: queueIcon },
  { name: 'Documents', path: '/documents', icon: documentsIcon },
  { name: 'Schedule', path: '/schedule', icon: scheduleIcon },
  { name: 'Residents', path: '/residents', icon: residentsIcon },
  { name: 'Announcements', path: '/announcements', icon: announcementsIcon },
];

export const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-64 bg-[#F8FAFD] border-r border-[#E2E8F0]/80 h-screen flex flex-col justify-between select-none shrink-0">
      {/* Top Brand / Logo Section */}
      <div>
        <div className="h-20 flex items-center px-6 gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0d1c38] flex items-center justify-center p-1.5 shadow-sm shrink-0">
            <img src={mainLogoSvg} alt="Gridy Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[19px] font-bold tracking-tight text-[#0f172a] leading-tight font-sans">
              Gridy
            </span>
            <span className="text-[9.5px] font-bold tracking-[0.14em] text-[#64748b] uppercase leading-tight mt-0.5">
              BARANGAY AUTHORITY
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-4 py-2">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 group ${
                      isActive
                        ? 'bg-[#E3EDFD] text-[#0047BA] font-bold shadow-xs'
                        : 'text-[#475569] font-medium hover:bg-slate-200/50 hover:text-[#0f172a]'
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      <img
                        src={item.icon}
                        alt={`${item.name} icon`}
                        className={`w-5 h-5 object-contain transition-all duration-150 ${
                          item.isDashboard
                            ? isActive
                              ? 'filter-none'
                              : 'grayscale contrast-50 opacity-70 group-hover:opacity-100 group-hover:grayscale-0'
                            : isActive
                            ? '[filter:invert(22%)_sepia(88%)_saturate(3000%)_hue-rotate(215deg)_brightness(88%)_contrast(102%)]'
                            : 'opacity-75 group-hover:opacity-100'
                        }`}
                      />
                    </div>
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Bottom Section: Settings & Logout */}
      <div className="px-4 pb-6 space-y-1.5">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 group ${
              isActive
                ? 'bg-[#E3EDFD] text-[#0047BA] font-bold shadow-xs'
                : 'text-[#475569] hover:bg-slate-200/50 hover:text-[#0f172a]'
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
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-[#DC2626] hover:bg-red-50 hover:text-red-700 transition-all duration-150 text-left cursor-pointer group"
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
