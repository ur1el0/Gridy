import React, { useEffect, useState, useMemo } from 'react';
import { axiosPrivate } from '../api/axios';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  SkipForward, 
  CheckCircle, 
  Bell, 
  SlidersHorizontal, 
  MoreVertical, 
  History, 
  Plus, 
  X,
  RotateCcw,
  Search,
  ChevronsUpDown
} from 'lucide-react';

interface QueueTicket {
  ticket_id: number;
  ticket_number: string;
  resident_name?: string;
  service_type: string;
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

  // Auto-refresh interval every 5s
  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000);
    return () => clearInterval(interval);
  }, []);

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
        {/* Left Column: Now Serving Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-xs border border-[#E2E8F0]/80 flex flex-col justify-between">
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

        {/* Right Column: 2x2 Grid of Stat Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              showNotification(`Alerted Ticket ${servingTicket.ticket_number}!`);
            } else {
              showNotification('No active ticket to notify.');
            }
          }}
          className="w-14 h-[52px] bg-[#FEECE8] hover:bg-[#FCD8D0] text-[#E05638] rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs"
          title="Notify / Recall Current Ticket"
        >
          <Bell className="w-5 h-5 stroke-[2]" />
        </button>
      </div>

      {/* Bottom Section: Waiting List Table + Photo Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Waiting List Table Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-xs border border-[#E2E8F0]/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base lg:text-lg font-bold text-[#0f172a]">
                Waiting List
              </h2>
              <div className="flex items-center gap-2 text-slate-400">
                <button
                  onClick={fetchTickets}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Refresh Queue"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                </button>
                <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Filter">
                  <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                </button>
                <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="More">
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
                            {ticket.ticket_number}
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

        {/* Right Column: Community Queue Photo Card */}
        <div className="lg:col-span-5 rounded-2xl overflow-hidden shadow-xs border border-[#E2E8F0]/80 bg-white">
          <img
            src="/barangay-queue.jpg"
            alt="Barangay Community Assistance Queue"
            className="w-full h-full min-h-[300px] object-cover"
          />
        </div>
      </div>

      {/* Modal: Manual Queue Entry */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-[480px] w-full p-8 relative animate-fade-in text-left">
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseManualModal}
              className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="pr-6">
              <h2 className="text-[22px] font-bold text-[#0f172a] tracking-tight">
                Manual Queue Entry
              </h2>
              <p className="text-[13px] text-[#64748b] mt-1 leading-snug">
                Manually register a resident into the current live queue system.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateManualTicket} className="space-y-4 mt-6">
              {/* Field 1: Search Resident */}
              <div>
                <label className="block text-sm font-bold text-[#0f172a] mb-2">
                  Search Resident
                </label>
                <div className="relative flex items-center">
                  <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchResident}
                    onChange={(e) => setSearchResident(e.target.value)}
                    placeholder="Search by name or Resident ID..."
                    className="w-full pl-11 pr-4 py-3 bg-[#EEF2FF]/60 hover:bg-[#EEF2FF] focus:bg-[#EEF2FF] border border-transparent focus:border-[#0047BA]/20 rounded-xl text-sm text-[#0f172a] placeholder-[#94a3b8] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Field 2: Service Required */}
              <div>
                <label className="block text-sm font-bold text-[#0f172a] mb-2">
                  Service Required
                </label>
                <div className="relative">
                  <select
                    value={serviceRequired}
                    onChange={(e) => setServiceRequired(e.target.value)}
                    required
                    className={`w-full appearance-none pl-4 pr-10 py-3 bg-[#EEF2FF]/60 hover:bg-[#EEF2FF] focus:bg-[#EEF2FF] border border-transparent focus:border-[#0047BA]/20 rounded-xl text-sm font-medium outline-none transition-all cursor-pointer ${
                      serviceRequired ? 'text-[#0f172a]' : 'text-[#94a3b8]'
                    }`}
                  >
                    <option value="" disabled className="text-slate-400">
                      Select a service category
                    </option>
                    <option value="Barangay Clearance" className="text-slate-800">Barangay Clearance</option>
                    <option value="Cedula / Community Tax" className="text-slate-800">Cedula / Community Tax</option>
                    <option value="Certificate of Indigency" className="text-slate-800">Certificate of Indigency</option>
                    <option value="Business Permit Endorsement" className="text-slate-800">Business Permit Endorsement</option>
                    <option value="Barangay ID Issuance" className="text-slate-800">Barangay ID Issuance</option>
                    <option value="Complaint Filing / Mediation" className="text-slate-800">Complaint Filing / Mediation</option>
                    <option value="General Public Assistance" className="text-slate-800">General Public Assistance</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronsUpDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Field 3: Priority Status */}
              <div>
                <label className="block text-sm font-bold text-[#0f172a] mb-2">
                  Priority Status
                </label>
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setPriorityStatus('regular')}
                    className={`py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer text-center ${
                      priorityStatus === 'regular'
                        ? 'bg-[#DCE7FF] text-[#0047BA]'
                        : 'bg-[#EEF2FF]/60 text-[#334155] hover:bg-[#EEF2FF]'
                    }`}
                  >
                    Regular
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriorityStatus('priority')}
                    className={`py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                      priorityStatus === 'priority'
                        ? 'bg-[#DCE7FF] text-[#0047BA]'
                        : 'bg-[#EEF2FF]/60 text-[#334155] hover:bg-[#EEF2FF]'
                    }`}
                  >
                    <span className="font-bold">!</span>
                    <span>Priority/Senior/PWD</span>
                  </button>
                </div>
              </div>

              {/* Field 4: Notes */}
              <div>
                <label className="block text-sm font-bold text-[#0f172a] mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional details or special requests..."
                  className="w-full py-3 px-4 bg-[#EEF2FF]/60 hover:bg-[#EEF2FF] focus:bg-[#EEF2FF] border border-transparent focus:border-[#0047BA]/20 rounded-xl text-sm text-[#0f172a] placeholder-[#94a3b8] outline-none transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={handleCloseManualModal}
                  className="text-sm font-bold text-[#334155] hover:text-[#0f172a] px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew || !serviceRequired}
                  className="bg-[#0052CC] hover:bg-[#0047BA] active:bg-[#003882] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-700/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingNew ? 'Adding...' : 'Add to Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
