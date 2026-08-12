import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Users, ClipboardList, Hourglass, Plus, Clock } from 'lucide-react';

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

interface DocumentRequestItem {
    request_id?: number;
    id?: number;
    requester_name?: string;
    document_type: string;
    status: string;
    created_at: string;
}

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
    const [recentRequests, setRecentRequests] = useState<DocumentRequestItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchDashboardData = async () => {
            try {
                const [summaryRes, docRes] = await Promise.all([
                    axiosPrivate.get('/dashboard/summary/', { signal: controller.signal }),
                    axiosPrivate.get('/document-requests/', { signal: controller.signal }).catch(() => ({ data: [] }))
                ]);
                
                if (isMounted) {
                    setSummaryData(summaryRes.data);
                    const docsList = docRes.data.results || docRes.data || [];
                    setRecentRequests(docsList.slice(0, 5));
                    setLoading(false);
                }
            } catch (err: any) {
                if (err.name !== 'CanceledError') {
                    if (isMounted) {
                        setError('Failed to fetch live dashboard data from backend.');
                        setLoading(false);
                    }
                }
            }
        };

        fetchDashboardData();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

    const getStatusStyle = (statusStr: string) => {
        switch (statusStr.toUpperCase()) {
            case 'PENDING':
                return 'bg-amber-100 text-amber-800';
            case 'APPROVED':
            case 'ONGOING':
                return 'bg-[#DCE7F9] text-[#0047BA]';
            case 'RELEASED':
                return 'bg-green-100 text-green-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    };

    const getInitials = (name?: string) => {
        if (!name) return 'R';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    const totalResidents = summaryData?.total_residents ?? 0;
    const pendingRequests = summaryData?.document_requests?.pending ?? 0;
    const urgentIssues = summaryData?.issue_reports?.urgency_breakdown?.urgent ?? 0;
    const activeQueueCount = summaryData?.queue_activity?.waiting_count ?? 0;
    const servingNow = summaryData?.queue_activity?.serving_now;

    return (
        <div className="space-y-6 pt-2">
            {/* Top Overview Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Administrative Overview</h1>
                    <p className="text-sm font-medium text-slate-500 mt-0.5">
                        Real-time status of Barangay Ibabang Dupay services and community records.
                    </p>
                </div>

                <button 
                    onClick={() => navigate('/reports')}
                    className="bg-[#0047BA] hover:bg-[#003693] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>View Report Issue</span>
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl">
                    {error}
                </div>
            )}

            {/* Top Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Card 1: Total Registered Residents */}
                <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70 flex flex-col justify-between h-44">
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0047BA] flex items-center justify-center mb-3">
                            <Users className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-500 tracking-normal">Total Registered Residents</h3>
                        <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                            {loading ? '--' : totalResidents.toLocaleString()}
                        </p>
                    </div>

                    <div className="flex items-center text-xs font-medium text-slate-500">
                        <span>Active community accounts</span>
                    </div>
                </div>

                {/* Card 2: Pending Requests */}
                <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70 flex flex-col justify-between h-44">
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                            <ClipboardList className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-500 tracking-normal">Pending Requests</h3>
                        <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                            {loading ? '--' : pendingRequests}
                        </p>
                    </div>

                    <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
                        ! {urgentIssues} Urgent
                    </p>
                </div>

                {/* Card 3: Active Queue */}
                <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70 flex flex-col justify-between h-44">
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">
                            <Hourglass className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-500 tracking-normal">Active Queue</h3>
                        <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                            {loading ? '--' : activeQueueCount}
                        </p>
                    </div>

                    <p className="text-xs font-medium text-slate-400">
                        {servingNow ? `Serving ticket: ${servingNow}` : 'No ticket serving'}
                    </p>
                </div>
            </div>

            {/* Bottom Row Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                {/* Left Table Section: Recent Document Requests / Appointments */}
                <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-bold text-slate-900">Recent Document Requests</h2>
                            <button 
                                onClick={() => navigate('/documents')}
                                className="text-xs font-bold text-[#0047BA] hover:underline cursor-pointer"
                            >
                                View All Documents
                            </button>
                        </div>

                        {/* Table Headers */}
                        <div className="bg-[#F0F4FA] rounded-xl px-4 py-2.5 grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            <div className="col-span-3">DATE / TIME</div>
                            <div className="col-span-4">RESIDENT NAME</div>
                            <div className="col-span-3">SERVICE TYPE</div>
                            <div className="col-span-2 text-right">STATUS</div>
                        </div>

                        {/* Table Rows */}
                        <div className="divide-y divide-slate-100">
                            {loading ? (
                                <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
                                    Loading live requests from database...
                                </div>
                            ) : recentRequests.length === 0 ? (
                                <div className="py-8 text-center text-xs text-slate-400">
                                    No document requests found in backend database.
                                </div>
                            ) : (
                                recentRequests.map((item, idx) => {
                                    const reqId = item.request_id || item.id || idx;
                                    const name = item.requester_name || 'Resident';
                                    const initials = getInitials(name);
                                    const dateStr = item.created_at 
                                        ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : '--:--';

                                    return (
                                        <div key={reqId} className="grid grid-cols-12 gap-2 items-center py-3.5 px-2 hover:bg-slate-50/60 rounded-lg transition-colors">
                                            <div className="col-span-3 text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{dateStr}</span>
                                            </div>
                                            <div className="col-span-4 flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                                    {initials}
                                                </div>
                                                <span className="text-xs font-semibold text-slate-800 truncate">{name}</span>
                                            </div>
                                            <div className="col-span-3 text-xs font-medium text-slate-600 truncate">
                                                {item.document_type}
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${getStatusStyle(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Image Section: Barangay Building Photo */}
                <div className="lg:col-span-5 rounded-2xl overflow-hidden shadow-xs border border-slate-200/70 bg-slate-900 min-h-[300px] relative">
                    <img 
                        src="/barangay-hall.png" 
                        alt="Barangay Ibabang Dupay Building" 
                        className="w-full h-full object-cover rounded-2xl min-h-[300px]"
                    />
                </div>
            </div>
        </div>
    );
};
