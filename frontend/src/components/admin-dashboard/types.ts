export interface DashboardSummary {
    total_residents: number;
    document_requests: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        released: number;
        total_revenue?: number;
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
        };
    };
    queue_activity: {
        total_today: number;
        serving_now: string | null;
        waiting_count: number;
    };
    demographics?: {
        purok_distribution: Record<string, number>;
        age_demographics: {
            youth: number;
            young_adult: number;
            adult: number;
            senior: number;
        };
    };
}

export interface ActivityItem {
    id: number;
    title: string;
    description: string;
    location: string;
    event_datetime: string;
    created_at: string;
}

export interface NamedValue {
    name: string;
    value: number;
}

export interface NamedCount {
    name: string;
    count: number;
}
