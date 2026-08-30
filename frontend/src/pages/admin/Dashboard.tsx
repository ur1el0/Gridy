import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../../api/axios';
import { Users, FileText, Hourglass } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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
        scenario_breakdown: {
            peace_and_order: number;
            public_health: number;
            infrastructure: number;
            environment: number;
            other: number;
        };
        time_of_day: {
            night_time: number;
            day_time: number;
        }
    };
    queue_activity: {
        total_today: number;
        serving_now: string | null;
        waiting_count: number;
    };
    demographics?: {
        purok_distribution: Record<string, number>
        age_demographics: {
            youth: number;
            young_adult: number;
            adult: number;
            senior: number;
        };
    };
}

interface ActivityItem {
    id: number;
    title: string;
    description: string;
    location: string;
    event_datetime: string;
    created_at: string;
}


const COLORS = ['#0047BA', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const MetricCardSkeleton = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]/80 flex flex-col justify-between animate-pulse">
        <div>
            <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
            <div className="h-3 w-32 bg-slate-200 rounded mt-5"></div>
            <div className="h-8 w-16 bg-slate-200 rounded mt-3"></div>
        </div>
    </div>
);

const ChartSkeleton = ({ title }: { title: string }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]/80 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded mb-6"></div>
        <div className="h-[250px] w-full bg-slate-100 rounded-xl flex items-end justify-between px-4 pb-4">
            <div className="w-12 h-[60%] bg-slate-200 rounded-t-sm"></div>
            <div className="w-12 h-[80%] bg-slate-200 rounded-t-sm"></div>
            <div className="w-12 h-[40%] bg-slate-200 rounded-t-sm"></div>
            <div className="w-12 h-[100%] bg-slate-200 rounded-t-sm"></div>
            <div className="w-12 h-[30%] bg-slate-200 rounded-t-sm"></div>
        </div>
    </div>
);

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchData = async () => {
            try {
                const [summaryRes, activitiesRes] = await Promise.allSettled([
                    axiosPrivate.get('/dashboard/summary/', { signal: controller.signal }),
                    axiosPrivate.get('/activities/', { signal: controller.signal })
                ]);
                
                if (isMounted) {
                    if (summaryRes.status === 'fulfilled') {
                        setSummaryData(summaryRes.value.data);
                    }
                    if (activitiesRes.status === 'fulfilled') {
                        const data = activitiesRes.value.data;
                        setActivities(data.results || data || []);
                    }
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

    const purokData = summaryData?.demographics?.purok_distribution 
        ? Object.entries(summaryData.demographics.purok_distribution).map(([name, value]) => ({
            name,
            value
        }))
        : []

    const ageData = summaryData?.demographics?.age_demographics
        ? [
            { name: 'Youth (<18)', count: summaryData.demographics.age_demographics.youth },
            { name: 'Young Adult', count: summaryData.demographics.age_demographics.young_adult },
            { name: 'Adult', count: summaryData.demographics.age_demographics.adult },
            { name: 'Senior (60+)', count: summaryData.demographics.age_demographics.senior },
        ]
        : []

    const scenarioData = summaryData?.issue_reports?.scenario_breakdown ? [
        { name: 'Peace & Order', count: summaryData.issue_reports.scenario_breakdown.peace_and_order},
        { name: 'Public Health', count: summaryData.issue_reports.scenario_breakdown.public_health},
        { name: 'Infrastructure', count: summaryData.issue_reports.scenario_breakdown.infrastructure},
        { name: 'Environment', count: summaryData.issue_reports.scenario_breakdown.environment},
    ]
    : []

    return (
        <div className="space-y-6">
            {/* Header / Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-[28px] font-extrabold text-[#0f172a] tracking-tight">
                        Administrative Overview
                    </h1>
                    <p className="text-[#64748b] text-sm mt-1">
                        Real-time status of Barangay Ibabang Dupay services and community records.
                    </p>
                </div>
                <button 
                    onClick={() => navigate('/reports')}
                    className="bg-[#0047BA] hover:bg-[#003882] active:bg-[#002D6B] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer w-fit shrink-0"
                >
                    <span className="text-base font-bold leading-none">+</span>
                    <span>View Report Issue</span>
                </button>
            </div>

            {/* Top Metric Cards Row (3 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                    <>
                        <MetricCardSkeleton />
                        <MetricCardSkeleton />
                        <MetricCardSkeleton />
                    </>
                ) : (
                    <>
                        {/* Card 1: Total Registered Residents */}
                        <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E2E8F0]/80 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-[#E3EDFD] text-[#0047BA] flex items-center justify-center">
                                    <Users className="w-5 h-5" />
                                </div>
                                <h3 className="text-[#64748b] text-xs font-semibold uppercase tracking-wider mt-4">
                                    Total Registered Residents
                                </h3>
                                <p className="text-3xl font-extrabold text-[#0f172a] mt-1">
                                    {summaryData?.total_residents?.toLocaleString() ?? '--'}                        
                                </p>
                            </div>
                        </div>

                        {/* Card 2: Pending Requests */}
                        <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E2E8F0]/80 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-[#FEECE8] text-[#E05638] flex items-center justify-center">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <h3 className="text-[#64748b] text-xs font-semibold uppercase tracking-wider mt-4">
                                    Pending Requests
                                </h3>
                                <p className="text-3xl font-extrabold text-[#0f172a] mt-1">
                                    {summaryData !== null ? summaryData.document_requests.pending : '--'}
                                </p>
                            </div>
                        </div>

                        {/* Card 3: Active Issues */}
                        <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E2E8F0]/80 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                                    <Hourglass className="w-5 h-5" />
                                </div>
                                <h3 className="text-[#64748b] text-xs font-semibold uppercase tracking-wider mt-4">
                                    Active Issues (In Progress)
                                </h3>
                                <p className="text-3xl font-extrabold text-[#0f172a] mt-1">
                                    {summaryData !== null ? summaryData.issue_reports.in_progress : '--'}
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
            
            {/* Scenario Breakdown Row */}
            {loading ? (
                <ChartSkeleton title="Local Incident Scenarios" />
            ) : (
                <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E2E8F0]/80 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                    <h2 className="text-base font-bold text-[#0f172a] mb-6">Local Incident Scenarios</h2>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scenarioData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip cursor={{fill: 'rgba(239,68,68,0.05)'}} />
                                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Demographics Row (2 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Purok Distribution Pie Chart */}
                <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E2E8F0]/80">
                    <h2 className="text-base font-bold text-[#0f172a] mb-6">Purok Distribution</h2>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={purokData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {purokData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip cursor={{fill: 'transparent'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Age Demographics Bar Chart */}
                <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E2E8F0]/80">
                    <h2 className="text-base font-bold text-[#0f172a] mb-6">Age Demographics</h2>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip cursor={{fill: 'rgba(0,71,186,0.05)'}} />
                                <Bar dataKey="count" fill="#0047BA" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Today's Appointments Table & Hall Photo */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left: Today's Appointments Table Card */}
                <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-xs border border-[#E2E8F0]/80 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base lg:text-lg font-bold text-[#0f172a]">
                                Today's Appointments
                            </h2>
                            <NavLink 
                                to="/communications" 
                                className="text-xs lg:text-sm font-semibold text-[#0047BA] hover:underline"
                            >
                                View All Schedule
                            </NavLink>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[#EDF3FA]/70 text-[#64748b] text-[11px] font-bold uppercase tracking-wider">
                                        <th className="py-2.5 px-4 rounded-l-lg">TIME / DATE</th>
                                        <th className="py-2.5 px-4">EVENT</th>
                                        <th className="py-2.5 px-4">LOCATION</th>
                                        <th className="py-2.5 px-4 rounded-r-lg">STATUS</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-100">
                                    {activities.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-sm text-slate-400 font-medium">
                                                No appointments or activities scheduled.
                                            </td>
                                        </tr>
                                    ) : (
                                        activities.slice(0, 5).map((act) => {
                                            const dateObj = new Date(act.event_datetime);
                                            const isValidDate = !isNaN(dateObj.getTime());
                                            const timeFormatted = isValidDate
                                                ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : act.event_datetime;
                                            const dateFormatted = isValidDate
                                                ? dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })
                                                : '';
                                            const isUpcoming = isValidDate ? dateObj.getTime() >= Date.now() : true;
                                            const initial = act.title ? act.title.charAt(0).toUpperCase() : 'A';

                                            return (
                                                <tr key={act.id} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="py-3.5 px-4 font-semibold text-[#0f172a] whitespace-nowrap">
                                                        <div>{timeFormatted}</div>
                                                        {dateFormatted && (
                                                            <div className="text-xs text-slate-400 font-normal">{dateFormatted}</div>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-full bg-[#DDE9FD] text-[#0047BA] font-bold text-xs flex items-center justify-center shrink-0">
                                                                {initial}
                                                            </div>
                                                            <span className="font-bold text-[#0f172a]">{act.title}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-[#475569] font-medium whitespace-nowrap">
                                                        {act.location || '--'}
                                                    </td>
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                                                                isUpcoming
                                                                    ? 'bg-[#E3EDFD] text-[#0047BA]'
                                                                    : 'bg-[#EDF2F7] text-[#64748b]'
                                                            }`}
                                                        >
                                                            {isUpcoming ? 'Upcoming' : 'Completed'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: Barangay Hall Photo Card */}
                <div className="lg:col-span-5 rounded-2xl overflow-hidden shadow-xs border border-[#E2E8F0]/80 bg-white">
                    <img 
                        src="/barangay-hall.png" 
                        alt="Barangay Ibabang Dupay Hall" 
                        className="w-full h-full min-h-[260px] object-cover"
                    />
                </div>
            </div>
        </div>
    );
};

