import React from 'react';

interface ActiveTicketViewProps {
  servingTicket: any | null;
}

export const ActiveTicketView: React.FC<ActiveTicketViewProps> = ({ servingTicket }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E2E8F0]/80 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[#64748b] text-xs font-semibold uppercase tracking-wider">
            Ticket Number
          </span>
          <span className="bg-[#E8F8EE] text-[#16A34A] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
            NOW SERVING
          </span>
        </div>

        <div className="my-5">
          <h2 className="text-5xl lg:text-6xl font-black text-[#0047BA] tracking-tight">
            {servingTicket ? servingTicket.ticket_number : '--'}
          </h2>
        </div>
      </div>

      <div className="bg-[#F0F4FA] rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-sm shrink-0">
          {servingTicket?.resident_name
            ? servingTicket.resident_name.charAt(0).toUpperCase()
            : servingTicket
            ? 'R'
            : '-'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] text-[#64748b] font-medium leading-none uppercase">
            {servingTicket ? servingTicket.service_type : 'Status'}
          </div>
          <div className="text-sm font-bold text-[#0f172a] truncate mt-0.5">
            {servingTicket ? (servingTicket.resident_name || 'Walk-in Resident') : 'No resident currently being served'}
          </div>
        </div>
      </div>
    </div>
  );
};

