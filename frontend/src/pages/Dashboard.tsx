import React, { useEffect, useState } from 'react';

import { axiosPrivate } from '../api/axios';
import { useAuth } from '../context/AuthContext';


interface DashboardSummary {
    total_residents: number;
    document_requests: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        released: number;
    };
    issue_reports: {
        total: number;
        pending: number;
        in_progress: number;
        resolved: number;
        urgency_breakdown: {
            low: number;
            medium: number;
            high: number;
            urgent: number;
        };
    };
    queue_activity: {
        total_today: number;
        serving_now: string | null;
        waiting_count: number;
    };
}

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchData = async () => {
            try {
                const [, summaryRes] = await Promise.all([
                    axiosPrivate.get('/auth/me/', { signal: controller.signal }),
                    axiosPrivate.get('/dashboard/summary/', { signal: controller.signal })
                ]);
                
                if (isMounted) {
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
                        {summaryData?.document_requests ? summaryData.document_requests.pending : '--'}
                    </p>
                </div>
                <div className="bg-surface shadow rounded-lg p-6 border-t-4 border-yellow-500">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Active Issues</h3>
                    <p className="text-3xl font-bold mt-2">
                         {summaryData?.issue_reports ? (summaryData.issue_reports.pending + summaryData.issue_reports.in_progress) : '--'}
                    </p>
                </div>
                <div className="bg-surface shadow rounded-lg p-6 border-t-4 border-green-500">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Total Documents Released</h3>
                    <p className="text-3xl font-bold mt-2 text-green-600">
                        {summaryData?.document_requests ? summaryData.document_requests.released : '--'}
                    </p>
                </div>
            </div>

        </div>
    );
};
