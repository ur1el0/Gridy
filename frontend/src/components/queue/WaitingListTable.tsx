import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { QueueTicket } from '../../pages/services/LiveQueue';

interface WaitingListTableProps {
    waitingTickets: QueueTicket[];
    canManagePriority: boolean;
    isUpdating: boolean;
    fetchTickets: () => void;
    handlePriorityChange: (
        ticketId: number,
        priorityStatus: 'regular' | 'priority',
        reason: string,
    ) => Promise<boolean>;
    handleCancelTicket: (ticketId: number) => void;
}

export const WaitingListTable: React.FC<WaitingListTableProps> = ({
    waitingTickets,
    canManagePriority,
    isUpdating,
    fetchTickets,
    handlePriorityChange,
    handleCancelTicket,
}) => {
    const [editingTicketId, setEditingTicketId] = useState<number | null>(null);
    const [priorityReason, setPriorityReason] = useState('');

    const closePriorityEditor = () => {
        setEditingTicketId(null);
        setPriorityReason('');
    };

    const submitPriorityChange = async (
        event: React.FormEvent<HTMLFormElement>,
        ticket: QueueTicket,
    ) => {
        event.preventDefault();
        const nextStatus = ticket.is_priority ? 'regular' : 'priority';
        const saved = await handlePriorityChange(
            ticket.ticket_id,
            nextStatus,
            priorityReason.trim(),
        );
        if (saved) closePriorityEditor();
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E2E8F0]/80 flex flex-col justify-between h-full">
            <div>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base lg:text-lg font-bold text-[#0f172a]">
                        Waiting List
                    </h2>
                    <button
                        type="button"
                        onClick={fetchTickets}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label="Refresh waiting list"
                    >
                        <RotateCcw className="w-4 h-4 text-slate-500" />
                    </button>
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
                                    const isEditing = editingTicketId === ticket.ticket_id;
                                    const nextStatus = ticket.is_priority ? 'regular' : 'priority';
                                    const priorityAction = ticket.is_priority
                                        ? 'Remove priority'
                                        : 'Grant priority';

                                    return (
                                        <React.Fragment key={ticket.ticket_id}>
                                            <tr className="hover:bg-slate-50/60 transition-colors">
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-primary/15 text-primary-text font-bold text-xs flex items-center justify-center shrink-0">
                                                            {initial}
                                                        </div>
                                                        <span className="font-bold text-[#0f172a]">{name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 font-bold text-primary-text whitespace-nowrap">
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
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                                        {canManagePriority && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingTicketId(ticket.ticket_id);
                                                                    setPriorityReason('');
                                                                }}
                                                                disabled={isUpdating || (editingTicketId !== null && !isEditing)}
                                                                aria-label={`${priorityAction} for ${ticket.ticket_number}`}
                                                                className="text-xs font-bold text-primary-text bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                            >
                                                                {priorityAction}
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCancelTicket(ticket.ticket_id)}
                                                            disabled={isUpdating}
                                                            aria-label={`Cancel ${ticket.ticket_number}`}
                                                            className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isEditing && canManagePriority && (
                                                <tr>
                                                    <td colSpan={5} className="px-4 pb-4">
                                                        <form
                                                            onSubmit={(event) => submitPriorityChange(event, ticket)}
                                                            className="rounded-xl bg-slate-50 p-4"
                                                        >
                                                            <label
                                                                htmlFor={`priority-reason-${ticket.ticket_id}`}
                                                                className="block text-sm font-semibold text-slate-900"
                                                            >
                                                                Reason for {nextStatus === 'priority' ? 'granting' : 'removing'} priority
                                                            </label>
                                                            <textarea
                                                                id={`priority-reason-${ticket.ticket_id}`}
                                                                value={priorityReason}
                                                                onChange={(event) => setPriorityReason(event.target.value)}
                                                                required
                                                                maxLength={500}
                                                                rows={2}
                                                                aria-describedby={`priority-reason-help-${ticket.ticket_id}`}
                                                                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                            />
                                                            <p
                                                                id={`priority-reason-help-${ticket.ticket_id}`}
                                                                className="mt-1 text-xs text-slate-600"
                                                            >
                                                                Record the eligibility review. Do not enter diagnoses or private health details.
                                                            </p>
                                                            <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                                                <button
                                                                    type="button"
                                                                    onClick={closePriorityEditor}
                                                                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    type="submit"
                                                                    disabled={isUpdating || !priorityReason.trim()}
                                                                    className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                                >
                                                                    {isUpdating ? 'Saving…' : 'Save priority change'}
                                                                </button>
                                                            </div>
                                                        </form>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {waitingTickets.length > 0 && (
                <div className="pt-4 border-t border-slate-100 text-center">
                    <span className="text-xs font-bold text-primary-text">
                        Total Waiting Residents: {waitingTickets.length}
                    </span>
                </div>
            )}
        </div>
    );
};
