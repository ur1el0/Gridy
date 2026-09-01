import React, { useState } from 'react';
import { Announcements } from './Announcements';
import { Activities } from './Activities';
import { HotlineManagement } from '../admin/HotlineManagement';

export const Communications: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'announcements' | 'activities' | 'hotlines'>('announcements');

  const tabs = [
    { key: 'announcements', label: 'Announcements' },
    { key: 'activities', label: 'Activity Schedules' },
    { key: 'hotlines', label: 'Emergency Hotlines' },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Communications Center</h2>
        <p className="text-sm text-slate-500 mt-1">Broadcast announcements, schedule events, and manage emergency contacts.</p>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-[#0047BA] text-[#0047BA]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === 'announcements' && <Announcements />}
        {activeTab === 'activities' && <Activities />}
        {activeTab === 'hotlines' && <HotlineManagement />}
      </div>
    </div>
  );
};