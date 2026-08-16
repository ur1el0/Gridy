import React, { useEffect, useState} from "react";
import { axiosPrivate } from "../api/axios";
import { Users, MonitorPlay, CheckCircle } from "lucide-react";

interface QueueTicket {
    ticket_id: number;
    ticket_number: string;
    service_type: string;
    status: string;
    created_at: string;
}

export const LiveQueue: React.FC = () => {
    const [tickets, setTickets] = useState<QueueTicket[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)

    // Function to grab tickets from backend
    const fetchTickets = async () => {
        try {
            const response = await axiosPrivate.get('/tickets/')
            setTickets(response.data.results || response.data)
        } catch (err) {
            setError('Failed to load queue tickets.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Poll the server every 5 seconds
    useEffect(() => {
        fetchTickets()
        const interval = setInterval(fetchTickets, 5000)

        // Cleanup interval on unmount
        return () => clearInterval(interval)
    }, [])

    // Function to move a ticket forward or mark it complete
    const handleStatusUpdate = async (ticketId: number, newStatus: string) => {
        setIsUpdating(true)
        try {
            await axiosPrivate.patch(`/tickets/${ticketId}/`, { status: newStatus })
            fetchTickets()
        } catch (err) {
            console.error("Failed to update ticket", err)
            alert("Failed to update ticket status. Please check permissions")
        } finally {
            setIsUpdating(false)
        }
    }

    if (loading && tickets.length === 0) return <div className="p-8 text-slate-600">Loading live queue...</div>
    if (error) return <div className="p-8 text-red-600">{error}</div>

    // Filter out lists for UI
    const servingTickets = tickets.filter(t => t.status.toUpperCase() === 'SERVING')
    const waitingTickets = tickets.filter(t => t.status.toUpperCase() === 'WAITING')

        return (
        <div className="space-y-6 relative p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <MonitorPlay className="w-6 h-6 text-primary" /> Live Queue Dashboard
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Real-time tracking of resident service tickets</p>
                </div>
                <button 
                    onClick={fetchTickets}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                >
                    Refresh Now
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Currently Serving Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface shadow-sm border border-border rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px] bg-gradient-to-br from-blue-50 to-white">
                        <h3 className="text-lg font-semibold text-slate-700 uppercase tracking-wider mb-4">Now Serving</h3>
                        {servingTickets.length > 0 ? (
                            <div className="text-center w-full">
                                <div className="text-6xl font-black text-blue-600 mb-2">{servingTickets[0].ticket_number}</div>
                                <div className="text-lg font-medium text-slate-600 mb-6">{servingTickets[0].service_type}</div>
                                <div className="flex gap-2 justify-center">
                                    <button 
                                        onClick={() => handleStatusUpdate(servingTickets[0].ticket_id, 'COMPLETED')}
                                        disabled={isUpdating}
                                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        <CheckCircle className="w-5 h-5" /> Complete
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-slate-400">
                                <MonitorPlay className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">No one currently being served</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Waiting Queue Panel */}
                <div className="lg:col-span-2">
                    <div className="bg-surface shadow-sm border border-border rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-slate-50 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-yellow-600" /> Waiting List ({waitingTickets.length})
                            </h3>
                        </div>
                        
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-white">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ticket Number</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Service Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time Waited</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-border">
                                {waitingTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">The queue is currently empty.</td>
                                    </tr>
                                ) : (
                                    waitingTickets.map((ticket) => (
                                        <tr key={ticket.ticket_id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-lg text-slate-900 font-bold">{ticket.ticket_number}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{ticket.service_type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {new Date(ticket.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button 
                                                    onClick={() => handleStatusUpdate(ticket.ticket_id, 'SERVING')}
                                                    disabled={isUpdating || servingTickets.length > 0}
                                                    className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md transition-colors mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Call Next
                                                </button>
                                                <button 
                                                    onClick={() => handleStatusUpdate(ticket.ticket_id, 'CANCELLED')}
                                                    disabled={isUpdating}
                                                    className="text-slate-400 hover:text-red-600 px-3 py-1 rounded-md transition-colors disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}