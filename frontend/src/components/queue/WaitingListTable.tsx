import React from 'react';
import { RotateCcw, SlidersHorizontal, MoreVertical } from 'lucide-react';
import type { QueueTicket } from '../../pages/LiveQueue';

interface WaitingListTableProps {
  waitingTickets: QueueTicket[];
  isUpdating: boolean;
  fetchTickets: () => void;
  handleServeSpecific: (ticketId: number) => void;
  handleCancelTicket: (ticketId: number) => void;
}

export const WaitingListTable: React.FC<WaitingListTableProps> = ({
  waitingTickets,
  isUpdating,
  fetchTickets,
  handleServeSpecific,
  handleCancelTicket
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E2E8F0]/80 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base lg:text-lg font-bold text-[#0f172a]">
            Waiting List
          </h2>
          <div className="flex items-center gap-2 text-slate-400">
            <button
              onClick={() => { fetchTickets(); alert('Queue Refreshed!'); }}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh Queue"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
            </button>
            <button onClick={() => alert('Filter options coming soon!')} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Filter">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            </button>
            <button onClick={() => alert('Additional options coming soon!')} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="More">
              <MoreVertical className="w-4 h-4 text-slate-500" />
            </button> 
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#EDF3FA]/70 text-[#64748b] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-4 rounded-l-lg">NAME</th>
                <th className="py-2.5 px-4">QUEUE #</th>
                <th className="py-2.5 px-4">SERVICE REQUIRED</th>
                <th className="py-2.5 px-4">STATUS</th>
                <th className="py-2.5 px-4 text-right rounded-r-lg">ACTION</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {waitingTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-400 font-medium">
                    No residents currently in the waiting list.
                  </td>
                </tr>
              ) : (
                waitingTickets.map((ticket) => {
                  const name = ticket.resident_name || 'Walk-in Resident';
                  const initial = name.charAt(0).toUpperCase();

                  return (
                    <tr key={ticket.ticket_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#DDE9FD] text-[#0047BA] font-bold text-xs flex items-center justify-center shrink-0">
                            {initial}
                          </div>
                          <span className="font-bold text-[#0f172a]">{name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#0047BA] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{ticket.ticket_number}</span>
                          {ticket.is_priority && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide">
                              Priority
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#475569] font-medium whitespace-nowrap">
                        {ticket.service_type}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EDF2F7] text-[#64748b] inline-block">
                          Waiting
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleServeSpecific(ticket.ticket_id)}
                            disabled={isUpdating}
                            className="text-xs font-bold text-[#0047BA] bg-[#E3EDFD] hover:bg-[#D4E4FD] px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Call
                          </button>
                          <button
                            onClick={() => handleCancelTicket(ticket.ticket_id)}
                            disabled={isUpdating}
                            className="text-xs font-medium text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {waitingTickets.length > 0 && (
        <div className="pt-4 border-t border-slate-100 text-center">
          <span className="text-xs font-bold text-[#0047BA]">
            Total Waiting Residents: {waitingTickets.length}
          </span>
        </div>
      )}
    </div>
  );
};

