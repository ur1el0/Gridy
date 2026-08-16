import { useState, useEffect } from "react";
import { axiosPrivate } from "../api/axios";
import { CheckCircle, Clock } from "lucide-react";

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

    useEffect(() => {
        const fetchPendingResidents = async () => {
            try {
                const response = await axiosPrivate.get('/auth/pending-residents/');
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
            await axiosPrivate.patch(`/auth/verify-resident/${id}/`);
            setPendingResidents((prev) => prev.filter((r) => r.id !== id));
        } catch (error) {
            console.error("Failed to verify resident", error);
            alert("Error verifying resident.");
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
            <div className="p-6 border-b border-border bg-surface flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Resident Verification</h1>
                    <p className="text-sm text-slate-500 mt-1">Review and approve new resident registrations.</p>
                </div>
                <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {pendingResidents.length} Pending
                </div>
            </div>

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
                        {pendingResidents.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                    No pending verifications at this time.
                                </td>
                            </tr>
                        ) : (
                            pendingResidents.map((resident) => (
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
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleApprove(resident.id)}
                                            className="inline-flex items-center gap-2 bg-[#0047BA] hover:bg-[#00368D] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Approve
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
