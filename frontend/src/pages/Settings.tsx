import React, { useState } from 'react';
import { Bell, Shield, Moon, Monitor, Key, Smartphone } from 'lucide-react';
import { ChangePasswordModal } from '../components/modals/ChangePasswordModal';

export const Settings: React.FC = () => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">System Settings</h1>
        <p className="text-[#64748b] text-sm mt-1">Manage your dashboard preferences and security.</p>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
        
        {/* Appearance Section */}
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Appearance</h2>
              <p className="text-xs text-slate-500">Customize how Gridy looks on your device.</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">Dark Mode</span>
            </div>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`w-11 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
              <p className="text-xs text-slate-500">Control when and how you are alerted.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Push Notifications (Queue Alerts)</span>
              </div>
              <button 
                onClick={() => setPushAlerts(!pushAlerts)}
                className={`w-11 h-6 rounded-full transition-colors relative ${pushAlerts ? 'bg-orange-500' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${pushAlerts ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-700">Email Summaries</span>
                <span className="text-[10px] text-slate-400">Receive daily queue and request reports</span>
              </div>
              <button 
                onClick={() => setEmailAlerts(!emailAlerts)}
                className={`w-11 h-6 rounded-full transition-colors relative ${emailAlerts ? 'bg-orange-500' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${emailAlerts ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Security</h2>
              <p className="text-xs text-slate-500">Protect your administrative account.</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Key className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">Change Password</span>
            </div>
            <button 
              onClick={() => setIsPasswordModalOpen(true)} 
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
            >
              Update
            </button>

          </div>
        </div>
      </div>
      {/* Render the Modal here */}
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
        onSuccess={() => {
          setIsPasswordModalOpen(false);
          alert("Password updated successfully!");
        }} 
      />
    </div>
  );
};

