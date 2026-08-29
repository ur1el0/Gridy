import _useWebSocket from 'react-use-websocket';
const useWebSocket = (_useWebSocket as any).default || _useWebSocket;
import React, { useEffect, useState, useMemo } from 'react';
import { axiosPrivate } from '../../api/axios';
import { History, Plus, X, SkipForward, CheckCircle, Bell } from 'lucide-react';

import { QueueMetrics } from '../../components/queue/QueueMetrics';
import { ActiveTicketView } from '../../components/queue/ActiveTicketView';
import { WaitingListTable } from '../../components/queue/WaitingListTable';
import { NewTicketModal } from '../../components/queue/NewTicketModal';

export interface QueueTicket {
  ticket_id: number;
  ticket_number: string;
  resident_name?: string;
  service_type: string;
  priority_status?: string
  is_priority?: boolean
  status: string;
  created_at: string;
  updated_at?: string;
}

export const LiveQueue: React.FC = () => {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Modals & Form state
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [searchResident, setSearchResident] = useState<string>('');
  const [serviceRequired, setServiceRequired] = useState<string>('');
  const [priorityStatus, setPriorityStatus] = useState<'regular' | 'priority'>('regular');
  const [notes, setNotes] = useState<string>('');
  const [isSubmittingNew, setIsSubmittingNew] = useState<boolean>(false);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  // Fetch tickets from backend
  const fetchTickets = async () => {
    try {
      const response = await axiosPrivate.get('/tickets/');
      setTickets(response.data.results || response.data || []);
      setError('');
    } catch (err) {
      console.error('Failed to load queue tickets:', err);
      setError('Failed to load queue tickets.');
    } finally {
      setLoading(false);
    }
  };

  const SOCKET_URL = 'ws://127.0.0.1:8000/ws/queue/'
  
  useWebSocket(SOCKET_URL, {
    onOpen: () => console.log('WebSocket connection established!'),
    onMessage: (event: any) => {
      console.log('Real-time queue update received:', event.data);
      // Data changed on the backend! Instantly sync our UI.
      fetchTickets();
    },
    shouldReconnect: () => true, // Auto-reconnect if server drops
  })

  useEffect(() => {
    fetchTickets()
  }, [])
  
  // Filtered lists
  const servingTicket = useMemo(() => {
    return tickets.find((t) => t.status.toUpperCase() === 'SERVING') || null;
  }, [tickets]);

  const waitingTickets = useMemo(() => {
    return tickets.filter((t) => t.status.toUpperCase() === 'WAITING');
  }, [tickets]);

  const completedTodayTickets = useMemo(() => {
    const todayStr = new Date().toDateString();
    return tickets.filter((t) => {
      const statusUpper = t.status.toUpperCase();
      const isCompleted = statusUpper === 'COMPLETED' || statusUpper === 'RESOLVED';
      const isToday = new Date(t.created_at).toDateString() === todayStr;
      return isCompleted && isToday;
    });
  }, [tickets]);

  // Dynamic calculations
  const totalWaitingCount = waitingTickets.length;
  const avgWaitMinutes = totalWaitingCount > 0 ? totalWaitingCount * 2 : 0;
  const servedTodayCount = completedTodayTickets.length;

  // Peak Hour calculation based on ticket creation times
  const peakHourText = useMemo(() => {
    if (tickets.length === 0) return '--';
    const hoursCount: { [hour: number]: number } = {};
    tickets.forEach((t) => {
      const d = new Date(t.created_at);
      if (!isNaN(d.getTime())) {
        const hour = d.getHours();
        hoursCount[hour] = (hoursCount[hour] || 0) + 1;
      }
    });
    const entries = Object.entries(hoursCount);
    if (entries.length === 0) return '--';
    entries.sort((a, b) => b[1] - a[1]);
    const topHour = parseInt(entries[0][0], 10);
    const period = topHour >= 12 ? 'PM' : 'AM';
    const displayHour = topHour % 12 === 0 ? 12 : topHour % 12;
    return `${displayHour}:00 ${period}`;
  }, [tickets]);

  // Handle Call Next / Advance Queue
  const handleNextQueue = async () => {
    if (waitingTickets.length === 0) return;
    setIsUpdating(true);
    try {
      // First try dedicated next endpoint, or fallback to sequential patch
      try {
        await axiosPrivate.post('/tickets/next/');
      } catch {
        if (servingTicket) {
          await axiosPrivate.patch(`/tickets/${servingTicket.ticket_id}/`, { status: 'COMPLETED' });
        }
        const nextInLine = waitingTickets[0];
        if (nextInLine) {
          await axiosPrivate.patch(`/tickets/${nextInLine.ticket_id}/`, { status: 'SERVING' });
        }
      }
      await fetchTickets();
      showNotification(`Now serving ticket ${waitingTickets[0]?.ticket_number || ''}`);
    } catch (err) {
      console.error('Failed to advance queue:', err);
      alert('Failed to advance queue.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Mark Current as Done
  const handleMarkAsDone = async () => {
    if (!servingTicket) return;
    setIsUpdating(true);
    try {
      await axiosPrivate.patch(`/tickets/${servingTicket.ticket_id}/`, { status: 'COMPLETED' });
      await fetchTickets();
      showNotification(`Ticket ${servingTicket.ticket_number} marked as completed.`);
    } catch (err) {
      console.error('Failed to complete ticket:', err);
      alert('Failed to complete ticket.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Manual Call for a specific ticket
  const handleServeSpecific = async (ticketId: number) => {
    setIsUpdating(true);
    try {
      if (servingTicket) {
        await axiosPrivate.patch(`/tickets/${servingTicket.ticket_id}/`, { status: 'COMPLETED' });
      }
      await axiosPrivate.patch(`/tickets/${ticketId}/`, { status: 'SERVING' });
      await fetchTickets();
    } catch (err) {
      console.error('Failed to call ticket:', err);
      alert('Failed to update ticket status.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Cancel Ticket
  const handleCancelTicket = async (ticketId: number) => {
    if (!window.confirm('Are you sure you want to cancel this ticket?')) return;
    setIsUpdating(true);
    try {
      await axiosPrivate.patch(`/tickets/${ticketId}/`, { status: 'CANCELLED' });
      await fetchTickets();
    } catch (err) {
      console.error('Failed to cancel ticket:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTicket = async (ticketId: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this queue record?")) return;
    try {
      await axiosPrivate.delete(`/tickets/${ticketId}/`);
      setTickets(prev => prev.filter(t => t.ticket_id !== ticketId));
      alert("Queue record deleted successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete queue record.");
    }
  };



  // Create Manual Ticket
  const handleCreateManualTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceRequired) {
      alert('Please select a service category.');
      return;
    }
    setIsSubmittingNew(true);
    try {
      // Remove the old serviceDisplay string hacking, and map all our new state variables
      await axiosPrivate.post('/tickets/', {
        walkin_name: searchResident,
        service_type: serviceRequired,
        priority_status: priorityStatus,
        is_priority: priorityStatus === 'priority',
        notes: notes,
        status: 'WAITING',
      })

      await fetchTickets();
      setIsManualModalOpen(false);
      setSearchResident('');
      setServiceRequired('');
      setPriorityStatus('regular');
      setNotes('');
      showNotification('New queue ticket issued successfully.');
    } catch (err) {
      console.error('Failed to create ticket:', err);
      alert('Failed to create manual ticket.');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleCloseManualModal = () => {
    setIsManualModalOpen(false);
    setSearchResident('');
    setServiceRequired('');
    setPriorityStatus('regular');
    setNotes('');
  };

  const showNotification = (msg: string) => {
    setNotificationBanner(msg);
    setTimeout(() => {
      setNotificationBanner(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header / Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-extrabold text-[#0f172a] tracking-tight">
            Live Queue Management
          </h1>
          <p className="text-[#64748b] text-sm mt-1">
            Real-time oversight of Barangay front-line services.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>Queue History</span>
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="bg-[#0047BA] hover:bg-[#003882] active:bg-[#002D6B] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Manual Entry</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notificationBanner && (
        <div className="bg-[#E3EDFD] border border-[#0047BA]/30 text-[#0047BA] px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <span>{notificationBanner}</span>
          <button onClick={() => setNotificationBanner(null)} className="text-blue-800 hover:text-blue-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Main Top Grid (Now Serving + 4 Stat Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5">
          <ActiveTicketView servingTicket={servingTicket} />
        </div>
        <div className="lg:col-span-7">
          <QueueMetrics 
            loading={loading}
            totalWaitingCount={totalWaitingCount}
            avgWaitMinutes={avgWaitMinutes}
            servedTodayCount={servedTodayCount}
            peakHourText={peakHourText}
          />
        </div>
      </div>

      {/* Action Control Bar (Middle Row) */}
      <div className="flex items-center gap-4">
        {/* Next Queue Button */}
        <button
          onClick={handleNextQueue}
          disabled={isUpdating || waitingTickets.length === 0}
          className="flex-1 bg-[#0047BA] hover:bg-[#003882] active:bg-[#002D6B] text-white py-3.5 px-6 rounded-2xl text-base font-bold shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SkipForward className="w-5 h-5 fill-current" />
          <span>{isUpdating ? 'Updating...' : 'Next Queue'}</span>
        </button>

        {/* Mark as Done Button */}
        <button
          onClick={handleMarkAsDone}
          disabled={isUpdating || !servingTicket}
          className="flex-1 bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[#0f172a] py-3.5 px-6 rounded-2xl text-base font-bold shadow-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-5 h-5 text-[#16A34A]" />
          <span>Mark as Done</span>
        </button>

        {/* Notify / Recall Button */}
        <button
          onClick={() => {
            if (servingTicket) {
              alert(`Paging ticket ${servingTicket.ticket_number}...`);
            }
          }}
          disabled={!servingTicket}
          className="flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 px-5 rounded-2xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send Notification Alert"
        >
          <Bell className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Section: Waiting List Table + Photo Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <WaitingListTable 
            waitingTickets={waitingTickets}
            isUpdating={isUpdating}
            fetchTickets={fetchTickets}
            handleServeSpecific={handleServeSpecific}
            handleCancelTicket={handleCancelTicket}
          />
        </div>
        <div className="lg:col-span-5 rounded-2xl overflow-hidden shadow-xs border border-[#E2E8F0]/80 bg-white">
          <img
            src="/barangay-queue.jpg"
            alt="Barangay Community Assistance Queue"
            className="w-full h-full min-h-[300px] object-cover"
          />
        </div>
      </div>

      {isManualModalOpen && (
        <NewTicketModal 
          handleCloseManualModal={handleCloseManualModal}
          handleCreateManualTicket={handleCreateManualTicket}
          searchResident={searchResident}
          setSearchResident={setSearchResident}
          serviceRequired={serviceRequired}
          setServiceRequired={setServiceRequired}
          priorityStatus={priorityStatus}
          setPriorityStatus={setPriorityStatus}
          notes={notes}
          setNotes={setNotes}
          isSubmittingNew={isSubmittingNew}
        />
      )}

      {/* Modal: Queue History */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 relative max-h-[85vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#0f172a]">Queue Activity History</h3>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto my-4 flex-1">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[#64748b] text-xs font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Ticket</th>
                    <th className="py-2.5 px-3">Resident / Service</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className='py-2.5 px-3 text-right'>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No ticket history available.
                      </td>
                    </tr>
                  ) : (
                    tickets.map((t) => (
                      <tr key={t.ticket_id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-[#0047BA]">{t.ticket_number}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{t.resident_name || 'Walk-in'}</div>
                          <div className="text-xs text-slate-500">{t.service_type}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              t.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : t.status === 'SERVING'
                                ? 'bg-blue-100 text-blue-800'
                                : t.status === 'WAITING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap"> {/* <-- ADD THIS CELL */}
                          <button 
                            onClick={() => handleDeleteTicket(t.ticket_id)}
                            className="text-red-600 hover:text-red-800 font-semibold text-xs transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    
    </div>
  );
};
