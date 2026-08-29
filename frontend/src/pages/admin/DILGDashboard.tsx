import { useEffect, useState } from 'react';
import { axiosPrivate } from '../../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Globe } from 'lucide-react';

interface AnalyticsData {
    barangay_name: string;
    residents: { total: number; verified: number };
    documents: { pending: number; released: number };
    queue: { priority: number; regular: number };
    scenarios: {
        peace_and_order: number
        public_health: number
        infrastructure: number
        environment: number
        other: number
    }
    night_time_incidents: number
}

export function DILGDashboard() {
    const [data, setData] = useState<AnalyticsData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await axiosPrivate.get('/dilg-analytics/');
                setData(response.data);
            } catch (error) {
                console.error("Failed to fetch DILG Analytics", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500 font-semibold animate-pulse">Loading Global Analytics...</div>;

    // Flatten our nested JSON into a simple format that Recharts understands
    const chartData = data.map(item => ({
        name: item.barangay_name,
        TotalResidents: item.residents.total,
        VerifiedResidents: item.residents.verified,
        PendingDocs: item.documents.pending,
        ReleasedDocs: item.documents.released,
        TotalQueue: item.queue.priority + item.queue.regular,
        PeaceAndOrder: item.scenarios.peace_and_order,
        PublicHealth: item.scenarios.public_health,
        Infrastructure: item.scenarios.infrastructure,
        NightTime: item.night_time_incidents
    }));

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3 tracking-tight">
                    <Globe className="w-8 h-8 text-blue-600" />
                    DILG Global Analytics
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Cross-barangay metrics and system overview.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart 1: Population Overview */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-700 mb-6">Population by Barangay</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Legend wrapperStyle={{paddingTop: '20px'}}/>
                                <Bar dataKey="TotalResidents" name="Total Residents" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="VerifiedResidents" name="Verified Residents" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Services Overview */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-700 mb-6">Service Load by Barangay</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Legend wrapperStyle={{paddingTop: '20px'}}/>
                                <Bar dataKey="PendingDocs" name="Pending Docs" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="TotalQueue" name="Total Queue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                {/* Chart 3: Incident Hotspots */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
                    <h2 className="text-lg font-bold text-slate-700 mb-6">Incident Hotspots & Scenarios</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Legend wrapperStyle={{paddingTop: '20px'}}/>
                                <Bar dataKey="PeaceAndOrder" name="Peace & Order" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="PublicHealth" name="Public Health" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="NightTime" name="Night-Time Incidents" fill="#1e1b4b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
