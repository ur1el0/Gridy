import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResidentsManagement } from './ResidentsManagement';
import ResidentVerification from './ResidentVerification';
import { axiosPrivate } from '../../api/axios';
import { Users, UserCheck } from 'lucide-react';

export const ResidentsHub: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState<'directory' | 'verifications'>(
        tabParam === 'verifications' ? 'verifications' : 'directory'
    );
    const [pendingCount, setPendingCount] = useState<number>(0);

    // Sync tab state when URL search param changes
    useEffect(() => {
        if (tabParam === 'verifications') {
            setActiveTab('verifications');
        } else if (tabParam === 'directory') {
            setActiveTab('directory');
        }
    }, [tabParam]);

    // Fetch pending count for tab badge
    const fetchPendingCount = async () => {
        try {
            const res = await axiosPrivate.get('/auth/pending-residents/');
            const count = res.data.results ? res.data.results.length : res.data.length;
            setPendingCount(count);
        } catch (err) {
            console.error('Failed to fetch pending verifications count:', err);
        }
    };

    useEffect(() => {
        fetchPendingCount();
    }, [activeTab]);

    const handleTabChange = (tab: 'directory' | 'verifications') => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Residents & Community Center</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Manage the official resident registry, review PhilSys verifications, and import census rosters.
                </p>
            </div>

            <div className="border-b border-slate-200 bg-white px-2 rounded-xl shadow-2xs">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        type="button"
                        onClick={() => handleTabChange('directory')}
                        className={`flex items-center gap-2 whitespace-nowrap py-4 px-2 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                            activeTab === 'directory'
                                ? 'border-primary text-primary-text font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>Residents Directory & RBI</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange('verifications')}
                        className={`flex items-center gap-2 whitespace-nowrap py-4 px-2 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                            activeTab === 'verifications'
                                ? 'border-primary text-primary-text font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        <UserCheck className="w-4 h-4" />
                        <span>Resident Verifications</span>
                        {pendingCount > 0 && (
                            <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                </nav>
            </div>

            <div className="mt-4">
                {activeTab === 'directory' ? <ResidentsManagement /> : <ResidentVerification />}
            </div>
        </div>
    );
};