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
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#E2E8F0]/80 flex flex-col justify-between min-h-[120px]">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-xl bg-[#E3EDFD] text-[#0047BA] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[#64748b] text-[11px] font-bold uppercase tracking-wider ml-2.5">
            Total Waiting
          </span>
        </div>
        <div className="mt-3 flex items-baseline">
          <span className="text-3xl font-extrabold text-[#0f172a]">
            {loading ? '--' : totalWaitingCount}
          </span>
          <span className="text-sm font-medium text-[#64748b] ml-2">Residents</span>
        </div>
      </div>

      {/* Stat Card 2: AVG. WAIT TIME */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#E2E8F0]/80 flex flex-col justify-between min-h-[120px]">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[#64748b] text-[11px] font-bold uppercase tracking-wider ml-2.5">
            Avg. Wait Time
          </span>
        </div>
        <div className="mt-3 flex items-baseline">
          <span className="text-3xl font-extrabold text-[#0f172a]">
            {loading ? '--' : avgWaitMinutes}
          </span>
          <span className="text-sm font-medium text-[#64748b] ml-2">Minutes</span>
        </div>
      </div>

      {/* Stat Card 3: SERVED TODAY */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#E2E8F0]/80 flex flex-col justify-between min-h-[120px]">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-xl bg-[#E8F8EE] text-[#16A34A] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-[#64748b] text-[11px] font-bold uppercase tracking-wider ml-2.5">
            Served Today
          </span>
        </div>
        <div className="mt-3 flex items-baseline">
          <span className="text-3xl font-extrabold text-[#0f172a]">
            {loading ? '--' : servedTodayCount}
          </span>
          <span className="text-sm font-medium text-[#64748b] ml-2">Processed</span>
        </div>
      </div>

      {/* Stat Card 4: PEAK HOUR */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#E2E8F0]/80 flex flex-col justify-between min-h-[120px]">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-xl bg-[#F1F5F9] text-[#64748b] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[#64748b] text-[11px] font-bold uppercase tracking-wider ml-2.5">
            Peak Hour
          </span>
        </div>
        <div className="mt-3 flex items-baseline">
          <span className="text-2xl font-extrabold text-[#0f172a]">
            {loading ? '--' : peakHourText}
          </span>
        </div>
      </div>
    </div>
  );
};

