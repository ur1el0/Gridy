import toast from 'react-hot-toast';
import { useState, useEffect, useMemo } from "react";
import { axiosPrivate } from "../../api/axios";
import { CheckCircle, Clock, Search, Filter, XCircle } from "lucide-react";

interface Resident {
    id: number;
    full_name: string;
    birth_date: string;
    voter_status: boolean;
    contact_number: string;
    purok: string | null;
    is_verified: boolean;
    guardian: number | null;
}

export default function ResidentVerification() {
    const [pendingResidents, setPendingResidents] = useState<Resident[]>([]);
    const [loading, setLoading] = useState(true);
    // Serach and Filter State
    const [searchQuery, setSearchQuery] = useState("")
    const [filterPurok, setFilterPurok] = useState("All")
    // Modal State
    const [residentToReject, setResidentToReject] = useState<Resident | null>(null)

    const availablePuroks = useMemo(() => {
        const puroks = pendingResidents
            .map(r => r.purok)
            .filter((p): p is string => p !== null && p !== undefined)
        return ["All", ...new Set(puroks)].sort()
    }, [pendingResidents])

    const filteredResidents = useMemo(() => {
        return pendingResidents.filter(resident => {
            const matchesSearch = resident.full_name.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesPurok = filterPurok === "All" || resident.purok === filterPurok
            return matchesSearch && matchesPurok
        })
    }, [pendingResidents, searchQuery, filterPurok])

    useEffect(() => {
        const fetchPendingResidents = async () => {
            try {
                const response = await axiosPrivate.get('auth/pending-residents/');
                setPendingResidents(response.data.results || response.data);
            } catch (error) {
                console.error("Failed to fetch residents", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPendingResidents();
    }, []);

    const handleApprove = async (id: number) => {
        try {
            await axiosPrivate.patch(`auth/verify-resident/${id}/`);
            setPendingResidents((prev) => prev.filter((r) => r.id !== id));
        } catch (error) {
            console.error("Failed to verify resident", error);
            toast.error('Error verifying resident.');
        }
    };

    const handleReject = async () => {
        if (!residentToReject) return
        try {
            await axiosPrivate.delete(`auth/reject-resident/${residentToReject.id}/`)
            setPendingResidents((prev => prev.filter((r) => r.id !== residentToReject.id)))
            setResidentToReject(null)
        } catch (error) {
            console.error("Failed to reject resident", error)
            toast.error('Error rejecting resident.')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border bg-surface flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Resident Verification</h1>
                    <p className="text-sm text-slate-500 mt-1">Review and approve new resident registrations.</p>
                </div>
                <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {filteredResidents.length} Pending
                </div>
            </div>

            {/* NEW: Search & Filter Bar */}
            <div className="p-4 bg-slate-50 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search by resident name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select 
                        value={filterPurok}
                        onChange={(e) => setFilterPurok(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
                    >
                        {availablePuroks.map(purok => (
                            <option key={purok} value={purok}>
                                {purok === "All" ? "All Puroks" : `Purok ${purok}`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F8FAFD] sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-border">Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-border">Purok</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-border">Contact</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-border text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredResidents.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                    No pending verifications match your filters.
                                </td>
                            </tr>
                        ) : (
                            filteredResidents.map((resident) => (
                                <tr key={resident.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-800">{resident.full_name}</div>
                                        <div className="text-xs text-slate-500 mt-1">DOB: {resident.birth_date}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                            {resident.purok ? `Purok ${resident.purok}` : 'Unassigned'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {resident.contact_number || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleApprove(resident.id)}
                                            className="inline-flex items-center gap-2 bg-[#0047BA] hover:bg-[#00368D] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Approve
                                        </button>
                                        <button 
                                            onClick={() => setResidentToReject(resident)}
                                            className="inline-flex items-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
                        {/* Rejection Confirmation Modal */}
            {residentToReject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-border">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 mx-auto">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-center text-slate-800 mb-2">
                            Reject Application?
                        </h3>
                        <p className="text-sm text-center text-slate-500 mb-6">
                            Are you sure you want to reject the application for <span className="font-semibold text-slate-700">{residentToReject.full_name}</span>? This will permanently delete their account and cannot be undone.
                        </p>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setResidentToReject(null)}
                                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleReject}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}