import React, { useEffect, useState } from 'react';
import { axiosPrivate } from '../api/axios';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState<any>(null);
    const [summaryData, setSummaryData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchData = async () => {
            try {
                const [profileRes, summaryRes] = await Promise.all([
                    axiosPrivate.get('/auth/me/', { signal: controller.signal }),
                    axiosPrivate.get('/dashboard/summary/', { signal: controller.signal })
                ]);
                
                if (isMounted) {
                    setProfileData(profileRes.data);
                    setSummaryData(summaryRes.data);
                    setLoading(false);
                }
            } catch (err: any) {
                if (err.name !== 'CanceledError') {
                    if (isMounted) {
                        setError('Failed to fetch dashboard data.');
                        setLoading(false);
                    }
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

    return(
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">Barangay Dashboard</h1>
            
            <div className="bg-surface shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-2">Welcome back, {user?.full_name || user?.username}!</h2>
                <p className="text-slate-600 mb-4">Role: <span className="font-medium text-primary">{user?.role}</span></p>
                
                {loading && <p className="text-slate-500 animate-pulse">Fetching live data...</p>}
                {error && <p className="text-red-500">{error}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface shadow rounded-lg p-6 border-t-4 border-blue-500">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Pending Documents</h3>
                    <p className="text-3xl font-bold mt-2">
                        {summaryData ? summaryData.doc_pending : '--'}
                    </p>
                </div>
                <div className="bg-surface shadow rounded-lg p-6 border-t-4 border-yellow-500">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Active Issues</h3>
                    <p className="text-3xl font-bold mt-2">
                         {summaryData ? (summaryData.issue_pending + summaryData.issue_in_progress) : '--'}
                    </p>
                </div>
                <div className="bg-surface shadow rounded-lg p-6 border-t-4 border-green-500">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Total Documents Released</h3>
                    <p className="text-3xl font-bold mt-2 text-green-600">
                        {summaryData ? summaryData.doc_released : '--'}
                    </p>
                </div>
            </div>

        </div>
    );
};
