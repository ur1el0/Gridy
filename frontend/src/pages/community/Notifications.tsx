import React, { useState } from 'react';
import { Bell, CheckCircle, Clock, AlertTriangle, FileText, Users, Trash2, CheckSquare, Square, Check } from 'lucide-react';

export const Notifications: React.FC = () => {
  // We moved the mock data into React State so we can actually modify it!
  const [notifications, setNotifications] = useState([
    {
      id: 1, type: 'queue', title: 'High Traffic Alert',
      message: 'The Live Queue currently has over 20 residents waiting. Please open an additional window if possible.',
      time: '10 minutes ago', read: false, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50'
    },
    {
      id: 2, type: 'document', title: 'New Walk-in Request',
      message: 'Maria Clara submitted a manual request for a Certificate of Indigency.',
      time: '1 hour ago', read: false, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50'
    },
    {
      id: 3, type: 'system', title: 'System Update Completed',
      message: 'Gridy backend services were successfully restarted and cache was cleared.',
      time: 'Yesterday', read: true, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50'
    },
    {
      id: 4, type: 'alert', title: 'Failed Resident Verification',
      message: 'An uploaded ID for Juan Dela Cruz could not be verified automatically. Manual review required.',
      time: 'Yesterday', read: true, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50'
    }
  ]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Selection Logic
  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length && notifications.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Action Logic
  const handleMarkAsRead = () => {
    setNotifications(prev => prev.map(n => {
      // If nothing is selected, mark ALL as read. Otherwise, only mark selected.
      if (selectedIds.length === 0 || selectedIds.includes(n.id)) {
        return { ...n, read: true };
      }
      return n;
    }));
    setSelectedIds([]); // Clear selection after action
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      // If nothing selected, clear all
      setNotifications([]);
    } else {
      // Clear only selected
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
      setSelectedIds([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">Notifications Center</h1>
          <p className="text-[#64748b] text-sm mt-1">Stay updated on queue spikes, document requests, and system alerts.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleMarkAsRead}
            disabled={notifications.length === 0}
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            {selectedIds.length > 0 ? `Mark (${selectedIds.length}) as read` : 'Mark all as read'}
          </button>
          <button 
            onClick={handleDelete}
            disabled={notifications.length === 0}
            className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {selectedIds.length > 0 ? `Delete (${selectedIds.length})` : 'Clear all'}
          </button>
        </div>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Bulk Selection Header */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
            <button onClick={handleSelectAll} className="text-slate-400 hover:text-blue-600 transition-colors">
              {selectedIds.length === notifications.length ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
            <span className="text-sm font-bold text-slate-700">Select All</span>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {notifications.map((notif) => {
            const Icon = notif.icon;
            const isSelected = selectedIds.includes(notif.id);
            
            return (
              <div 
                key={notif.id} 
                className={`p-4 flex items-start gap-4 transition-colors hover:bg-slate-50 cursor-pointer ${!notif.read ? 'bg-blue-50/30' : ''} ${isSelected ? 'bg-blue-50/50' : ''}`}
                onClick={() => toggleSelection(notif.id)}
              >
                {/* Checkbox */}
                <div className="mt-2.5">
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300" />
                  )}
                </div>

                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.bg} ${notif.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                {/* Content */}
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
                
                {/* Unread Dot */}
                {!notif.read && (
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 mt-1.5"></div>
                )}
              </div>
            );
          })}
        </div>
        
        {notifications.length === 0 && (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Bell className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl text-slate-900 font-bold mb-2">You're all caught up!</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
              There are no new notifications at this time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};