import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../../api/axios';
import { useAuth } from '../../context/auth-context';
import { AppointmentsTable } from '../../components/admin-dashboard/AppointmentsTable';
import { DemographicsCharts } from '../../components/admin-dashboard/DemographicsCharts';
import { MetricCards } from '../../components/admin-dashboard/MetricCards';
import { ScenarioBreakdownChart } from '../../components/admin-dashboard/ScenarioBreakdownChart';
import type { ActivityItem, DashboardSummary } from '../../components/admin-dashboard/types';
import { InlineErrorState } from '../../components/ui/InlineErrorState';

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);
    const [summaryLoadError, setSummaryLoadError] = useState(false);
    const [isRetryingSummary, setIsRetryingSummary] = useState(false);
    const [isLoadingActivities, setIsLoadingActivities] = useState(true);
    const [activitiesLoadError, setActivitiesLoadError] = useState(false);
    const [isRetryingActivities, setIsRetryingActivities] = useState(false);
    const summaryRequestController = useRef<AbortController | null>(null);
    const activitiesRequestController = useRef<AbortController | null>(null);

    const fetchSummary = useCallback(async (isRetry = false) => {
        summaryRequestController.current?.abort();
        const controller = new AbortController();
        summaryRequestController.current = controller;
        if (isRetry) setIsRetryingSummary(true);

        try {
            const response = await axiosPrivate.get('/dashboard/summary/', { signal: controller.signal });
            setSummaryData(response.data);
            setSummaryLoadError(false);
        } catch {
            if (!controller.signal.aborted) setSummaryLoadError(true);
        } finally {
            if (summaryRequestController.current === controller) {
                summaryRequestController.current = null;
                setIsLoadingSummary(false);
                setIsRetryingSummary(false);
            }
        }
    }, []);

    const fetchActivities = useCallback(async (isRetry = false) => {
        activitiesRequestController.current?.abort();
        const controller = new AbortController();
        activitiesRequestController.current = controller;
        if (isRetry) setIsRetryingActivities(true);

        try {
            const response = await axiosPrivate.get('/activities/', { signal: controller.signal });
            const data = response.data;
            setActivities(data.results || data || []);
            setActivitiesLoadError(false);
        } catch {
            if (!controller.signal.aborted) setActivitiesLoadError(true);
        } finally {
            if (activitiesRequestController.current === controller) {
                activitiesRequestController.current = null;
                setIsLoadingActivities(false);
                setIsRetryingActivities(false);
            }
        }
    }, []);

    useEffect(() => {
        if (user?.role === 'DILG_ADMIN') {
            navigate('/dilg-analytics', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        if (user?.role === 'DILG_ADMIN') return;

        void fetchSummary();
        void fetchActivities();

        return () => {
            summaryRequestController.current?.abort();
            activitiesRequestController.current?.abort();
            summaryRequestController.current = null;
            activitiesRequestController.current = null;
        };
    }, [user?.role, fetchSummary, fetchActivities]);

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

            {summaryLoadError && summaryData === null ? (
                <InlineErrorState
                    message="We couldn't load dashboard summary."
                    onRetry={() => { void fetchSummary(true); }}
                    retrying={isRetryingSummary}
                />
            ) : (
                <>
                    {summaryLoadError && (
                        <InlineErrorState
                            message="We couldn't refresh dashboard summary."
                            onRetry={() => { void fetchSummary(true); }}
                            retrying={isRetryingSummary}
                        />
                    )}
                    <MetricCards loading={isLoadingSummary} summary={summaryData} />
                    <ScenarioBreakdownChart loading={isLoadingSummary} data={scenarioData} />
                    {!isLoadingSummary && <DemographicsCharts purokData={purokData} ageData={ageData} />}
                </>
            )}
            <AppointmentsTable
                activities={activities}
                loading={isLoadingActivities}
                loadError={activitiesLoadError}
                onRetry={() => { void fetchActivities(true); }}
                retrying={isRetryingActivities}
            />
        </div>
    );
};
