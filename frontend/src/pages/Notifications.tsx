import React from 'react';
import { Bell, CheckCircle, Clock, AlertTriangle, FileText, Users, Trash2 } from 'lucide-react';

export const Notifications: React.FC = () => {
  // Mock data for our UI presentation
  const mockNotifications = [
    {
      id: 1,
      type: 'queue',
      title: 'High Traffic Alert',
      message: 'The Live Queue currently has over 20 residents waiting. Please open an additional window if possible.',
      time: '10 minutes ago',
      read: false,
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      id: 2,
      type: 'document',
      title: 'New Walk-in Request',
      message: 'Maria Clara submitted a manual request for a Certificate of Indigency.',
      time: '1 hour ago',
      read: false,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      id: 3,
      type: 'system',
      title: 'System Update Completed',
      message: 'Gridy backend services were successfully restarted and cache was cleared.',
      time: 'Yesterday',
      read: true,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      id: 4,
      type: 'alert',
      title: 'Failed Resident Verification',
      message: 'An uploaded ID for Juan Dela Cruz could not be verified automatically. Manual review required.',
      time: 'Yesterday',
      read: true,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">Notifications Center</h1>
          <p className="text-[#64748b] text-sm mt-1">Stay updated on queue spikes, document requests, and system alerts.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors">
            Mark all as read
          </button>
          <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Clear all">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
        
        {mockNotifications.map((notif) => {
          const Icon = notif.icon;
          return (
            <div 
              key={notif.id} 
              className={`p-5 flex items-start gap-4 transition-colors hover:bg-slate-50 ${!notif.read ? 'bg-blue-50/30' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.bg} ${notif.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className={`text-sm font-bold truncate ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>
                    {notif.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {notif.time}
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {notif.message}
                </p>
              </div>
              
              {!notif.read && (
                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 mt-1.5"></div>
              )}
            </div>
          );
        })}
        
        {mockNotifications.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-bold">You're all caught up!</h3>
            <p className="text-slate-500 text-sm mt-1">There are no new notifications at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};
