import toast from 'react-hot-toast';
import { useState, useEffect, useMemo } from "react";
import { axiosPrivate } from "../../api/axios";
import { 
    CheckCircle, 
    Clock, 
    Search, 
    Filter, 
    XCircle, 
    Eye, 
    FileText, 
    ShieldCheck, 
    ExternalLink,
    Receipt,
    IdCard,
    X
} from "lucide-react";

interface Resident {
    id: number;
    username?: string;
    email?: string;
    full_name: string;
    birth_date: string;
    voter_status: boolean;
    contact_number: string;
    purok: string | null;
    is_verified: boolean;
    guardian: number | null;
    philsys_id_number?: string | null;
    philsys_id_photo?: string | null;
    secondary_id_type?: string | null;
    secondary_id_photo?: string | null;
    utility_billing_type?: string | null;
    utility_billing_photo?: string | null;
}

export default function ResidentVerification() {
    const [pendingResidents, setPendingResidents] = useState<Resident[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [filterPurok, setFilterPurok] = useState("All");
    
    // Inspection and Rejection Modals
    const [residentToInspect, setResidentToInspect] = useState<Resident | null>(null);
    const [residentToReject, setResidentToReject] = useState<Resident | null>(null);

    const availablePuroks = useMemo(() => {
        const puroks = pendingResidents
            .map(r => r.purok)
            .filter((p): p is string => p !== null && p !== undefined);
        return ["All", ...new Set(puroks)].sort();
    }, [pendingResidents]);

    const filteredResidents = useMemo(() => {
        return pendingResidents.filter(resident => {
            const matchesSearch = resident.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (resident.philsys_id_number && resident.philsys_id_number.includes(searchQuery));
            const matchesPurok = filterPurok === "All" || resident.purok === filterPurok;
            return matchesSearch && matchesPurok;
        });
    }, [pendingResidents, searchQuery, filterPurok]);

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
            if (residentToInspect?.id === id) {
                setResidentToInspect(null);
            }
            toast.success('Resident successfully verified.');
        } catch (error) {
            console.error("Failed to verify resident", error);
            toast.error('Error verifying resident.');
        }
    };

    const handleReject = async () => {
        if (!residentToReject) return;
        try {
            await axiosPrivate.delete(`auth/reject-resident/${residentToReject.id}/`);
            setPendingResidents((prev) => prev.filter((r) => r.id !== residentToReject.id));
            if (residentToInspect?.id === residentToReject.id) {
                setResidentToInspect(null);
            }
            setResidentToReject(null);
            toast.success('Registration application rejected.');
        } catch (error) {
            console.error("Failed to reject resident", error);
            toast.error('Error rejecting resident.');
        }
    };

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
                    <p className="text-sm text-slate-500 mt-1">Review PhilSys national identity credentials and utility residency proofs.</p>
                </div>
                <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {filteredResidents.length} Pending Verification
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="p-4 bg-slate-50 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search by name or PhilSys ID..."
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
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-border">Applicant</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-border">PhilSys Number</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-border">Purok</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-border">Submitted Proofs</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-border text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredResidents.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    No pending verifications match your filters.
                                </td>
                            </tr>
                        ) : (
                            filteredResidents.map((resident) => (
                                <tr key={resident.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-800">{resident.full_name}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">DOB: {resident.birth_date}</div>
                                        {resident.guardian && (
                                            <div className="mt-1 inline-flex items-center text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                Minor (Guardian: CID-{resident.guardian})
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {resident.philsys_id_number ? (
                                            <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                                                {resident.philsys_id_number}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Not Provided</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                            {resident.purok ? `Purok ${resident.purok}` : 'Unassigned'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {resident.philsys_id_photo && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                                                    <IdCard className="w-3 h-3" /> PhilSys ID
                                                </span>
                                            )}
                                            {resident.utility_billing_photo && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                                                    <Receipt className="w-3 h-3" /> Billing Proof
                                                </span>
                                            )}
                                            {resident.secondary_id_photo && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md">
                                                    <FileText className="w-3 h-3" /> Secondary ID
                                                </span>
                                            )}
                                            {!resident.philsys_id_photo && !resident.utility_billing_photo && (
                                                <span className="text-xs text-slate-400 italic">No attachments</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setResidentToInspect(resident)}
                                                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95"
                                                title="Inspect submitted documents"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Inspect
                                            </button>
                                            <button 
                                                onClick={() => handleApprove(resident.id)}
                                                className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow active:scale-95"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => setResidentToReject(resident)}
                                                className="inline-flex items-center gap-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                                Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Verification Dossier / Inspection Modal */}
            {residentToInspect && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-border bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{residentToInspect.full_name}</h3>
                                    <p className="text-xs text-slate-500">Applicant Dossier & Verification Proofs</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setResidentToInspect(null)}
                                className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Summary Metadata Card */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                                <div>
                                    <span className="text-slate-400 font-medium block">Date of Birth</span>
                                    <span className="font-semibold text-slate-700 mt-0.5 block">{residentToInspect.birth_date}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium block">Purok</span>
                                    <span className="font-semibold text-slate-700 mt-0.5 block">{residentToInspect.purok ? `Purok ${residentToInspect.purok}` : 'Unassigned'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium block">Contact Number</span>
                                    <span className="font-semibold text-slate-700 mt-0.5 block">{residentToInspect.contact_number || 'None'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium block">PhilSys ID Number</span>
                                    <span className="font-mono font-semibold text-slate-700 mt-0.5 block">{residentToInspect.philsys_id_number || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Uploaded Documents Grid */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Submitted Proof of Identity & Residency</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* 1. PhilSys ID Photo */}
                                    <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                    <IdCard className="w-3.5 h-3.5 text-blue-600" />
                                                    PhilSys National ID
                                                </span>
                                            </div>
                                            {residentToInspect.philsys_id_photo ? (
                                                <a 
                                                    href={residentToInspect.philsys_id_photo} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="group relative block rounded-lg overflow-hidden border border-slate-200 bg-white"
                                                >
                                                    <img 
                                                        src={residentToInspect.philsys_id_photo} 
                                                        alt="PhilSys ID" 
                                                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform" 
                                                    />
                                                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                                                        <ExternalLink className="w-3 h-3" /> Open
                                                    </span>
                                                </a>
                                            ) : (
                                                <div className="h-40 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400 italic bg-white">
                                                    No photo uploaded
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Utility Billing Proof */}
                                    <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                                                    Utility Proof {residentToInspect.utility_billing_type && `(${residentToInspect.utility_billing_type})`}
                                                </span>
                                            </div>
                                            {residentToInspect.utility_billing_photo ? (
                                                <a 
                                                    href={residentToInspect.utility_billing_photo} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="group relative block rounded-lg overflow-hidden border border-slate-200 bg-white"
                                                >
                                                    <img 
                                                        src={residentToInspect.utility_billing_photo} 
                                                        alt="Utility Billing" 
                                                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform" 
                                                    />
                                                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                                                        <ExternalLink className="w-3 h-3" /> Open
                                                    </span>
                                                </a>
                                            ) : (
                                                <div className="h-40 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400 italic bg-white">
                                                    No bill uploaded
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. Secondary ID */}
                                    <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                                                    Secondary ID {residentToInspect.secondary_id_type && `(${residentToInspect.secondary_id_type})`}
                                                </span>
                                            </div>
                                            {residentToInspect.secondary_id_photo ? (
                                                <a 
                                                    href={residentToInspect.secondary_id_photo} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="group relative block rounded-lg overflow-hidden border border-slate-200 bg-white"
                                                >
                                                    <img 
                                                        src={residentToInspect.secondary_id_photo} 
                                                        alt="Secondary ID" 
                                                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform" 
                                                    />
                                                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                                                        <ExternalLink className="w-3 h-3" /> Open
                                                    </span>
                                                </a>
                                            ) : (
                                                <div className="h-40 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400 italic bg-white">
                                                    None (Optional)
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="p-4 bg-slate-50 border-t border-border flex items-center justify-between">
                            <button
                                onClick={() => setResidentToInspect(null)}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                            >
                                Close Dossier
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const res = residentToInspect;
                                        setResidentToInspect(null);
                                        setResidentToReject(res);
                                    }}
                                    className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors"
                                >
                                    Reject Application
                                </button>
                                <button
                                    onClick={() => handleApprove(residentToInspect.id)}
                                    className="px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg text-xs font-bold transition-colors shadow-sm"
                                >
                                    Approve Registration
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                            Are you sure you want to reject the application for <span className="font-semibold text-slate-700">{residentToReject.full_name}</span>? This will permanently remove their application from the queue.
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