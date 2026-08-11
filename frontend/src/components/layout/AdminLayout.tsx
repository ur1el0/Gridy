import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();

  // Get the first inital of the user for the avatar, default to 'U'
  const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : (user?.username?.charAt(0).toUpperCase() || 'U');

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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-surface border-b border-border shadow-sm flex items-center justify-between px-6">
          <div className="text-lg font-medium text-slate-700">Admin Portal</div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{user?.full_name || user?.username}</span>
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              {userInitial}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-8">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};