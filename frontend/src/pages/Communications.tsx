import React, { useState } from 'react';
import { Announcements } from './Announcements';
import { Activities } from './Activities';

export const Communications: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'announcements' | 'activities'>('announcements');

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Communications Center</h2>
        <p className="text-sm text-slate-500 mt-1">Broadcast announcements and schedule community events.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'announcements'
                ? 'border-[#0047BA] text-[#0047BA]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Announcements
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'activities'
                ? 'border-[#0047BA] text-[#0047BA]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Activity Schedules
          </button>
        </nav>
      </div>

      {/* Render the Active Tab */}
      <div className="mt-4">
        {activeTab === 'announcements' ? <Announcements /> : <Activities />}
      </div>
    </div>
  );
};
