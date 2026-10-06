import React from 'react';
import { Users, Clock, CheckCircle2 } from 'lucide-react';

interface QueueMetricsProps {
    loading: boolean;
    totalWaitingCount: number;
    avgWaitMinutes: number;
    servedTodayCount: number;
    peakHourText: string;
}

export const QueueMetrics: React.FC<QueueMetricsProps> = ({
    loading,
    totalWaitingCount,
    avgWaitMinutes,
    servedTodayCount,
    peakHourText
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Stat Card 1: TOTAL WAITING */}
            <div className="bg-surface rounded-large p-5 shadow-xs border border-border/80 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-medium bg-primary/10 text-primary-text flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                    </div>
                    <span className="text-neutral-muted text-[11px] font-bold uppercase tracking-wider ml-2.5">
                        Total Waiting
                    </span>
                </div>
                <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-extrabold text-neutral-primary">
                        {loading ? '--' : totalWaitingCount}
                    </span>
                    <span className="text-sm font-medium text-neutral-muted ml-2">Residents</span>
                </div>
            </div>

            {/* Stat Card 2: AVG. WAIT TIME */}
            <div className="bg-surface rounded-large p-5 shadow-xs border border-border/80 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-medium bg-feedback-warning-soft text-feedback-warning flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-neutral-muted text-[11px] font-bold uppercase tracking-wider ml-2.5">
                        Avg. Wait Time
                    </span>
                </div>
                <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-extrabold text-neutral-primary">
                        {loading ? '--' : avgWaitMinutes}
                    </span>
                    <span className="text-sm font-medium text-neutral-muted ml-2">Minutes</span>
                </div>
            </div>

            {/* Stat Card 3: SERVED TODAY */}
            <div className="bg-surface rounded-large p-5 shadow-xs border border-border/80 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-medium bg-feedback-success-soft text-feedback-success-strong flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-neutral-muted text-[11px] font-bold uppercase tracking-wider ml-2.5">
                        Served Today
                    </span>
                </div>
                <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-extrabold text-neutral-primary">
                        {loading ? '--' : servedTodayCount}
                    </span>
                    <span className="text-sm font-medium text-neutral-muted ml-2">Processed</span>
                </div>
            </div>

            {/* Stat Card 4: PEAK HOUR */}
            <div className="bg-surface rounded-large p-5 shadow-xs border border-border/80 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-medium bg-surface-subtle text-neutral-muted flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-neutral-muted text-[11px] font-bold uppercase tracking-wider ml-2.5">
                        Peak Hour
                    </span>
                </div>
                <div className="mt-3 flex items-baseline">
                    <span className="text-2xl font-extrabold text-neutral-primary">
                        {loading ? '--' : peakHourText}
                    </span>
                </div>
            </div>
        </div>
    );
};
