import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../../api/axios';
import { useAuth } from '../../context/auth-context';
import { AppointmentsTable } from '../../components/admin-dashboard/AppointmentsTable';
import { DemographicsCharts } from '../../components/admin-dashboard/DemographicsCharts';
import { MetricCards } from '../../components/admin-dashboard/MetricCards';
import { ScenarioBreakdownChart } from '../../components/admin-dashboard/ScenarioBreakdownChart';
import type { ActivityItem, DashboardSummary } from '../../components/admin-dashboard/types';

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.role === 'DILG_ADMIN') {
            navigate('/dilg-analytics', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        if (user?.role === 'DILG_ADMIN') return;

        let isMounted = true;
        const controller = new AbortController();

        const fetchData = async () => {
            try {
                const [summaryRes, activitiesRes] = await Promise.allSettled([
                    axiosPrivate.get('/dashboard/summary/', { signal: controller.signal }),
                    axiosPrivate.get('/activities/', { signal: controller.signal }),
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
    }, [user?.role]);

    const purokData = summaryData?.demographics?.purok_distribution
        ? Object.entries(summaryData.demographics.purok_distribution).map(([name, value]) => ({
            name,
            value,
        }))
        : [];

    const ageData = summaryData?.demographics?.age_demographics
        ? [
            { name: 'Youth (<18)', count: summaryData.demographics.age_demographics.youth },
            { name: 'Young Adult', count: summaryData.demographics.age_demographics.young_adult },
            { name: 'Adult', count: summaryData.demographics.age_demographics.adult },
            { name: 'Senior (60+)', count: summaryData.demographics.age_demographics.senior },
        ]
        : [];

    const scenarioData = summaryData?.issue_reports?.scenario_breakdown
        ? [
            { name: 'Peace & Order', count: summaryData.issue_reports.scenario_breakdown.peace_and_order },
            { name: 'Public Health', count: summaryData.issue_reports.scenario_breakdown.public_health },
            { name: 'Infrastructure', count: summaryData.issue_reports.scenario_breakdown.infrastructure },
            { name: 'Environment', count: summaryData.issue_reports.scenario_breakdown.environment },
            { name: 'Other', count: summaryData.issue_reports.scenario_breakdown.other || 0 },
        ]
        : [];

    if (user?.role === 'DILG_ADMIN') {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-[28px] font-extrabold text-neutral-primary tracking-tight">
                        Administrative Overview
                    </h1>
                    <p className="text-neutral-muted text-sm mt-1">
                        Real-time status of {user?.barangay?.name ? `Barangay ${user.barangay.name}` : 'your Barangay'} services and community records.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/reports')}
                    className="bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-foreground px-5 py-2.5 rounded-medium text-sm font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer w-fit shrink-0"
                >
                    <span>View Report Issue</span>
                </button>
            </div>

            <MetricCards loading={loading} summary={summaryData} />
            <ScenarioBreakdownChart loading={loading} data={scenarioData} />
            <DemographicsCharts purokData={purokData} ageData={ageData} />
            <AppointmentsTable activities={activities} />
        </div>
    );
};
