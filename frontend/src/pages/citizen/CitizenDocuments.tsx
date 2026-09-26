import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { axiosPrivate } from '../../api/axios';
import { 
    FileText, 
    Plus, 
    Download, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    X, 
    Loader2,
    FileCheck2,
    Trash2,
} from 'lucide-react';

interface DocumentRequest {
    id: number;
    document_type: string;
    purpose: string;
    status: string;
    admin_notes?: string;
    created_at: string;
}

const DOCUMENT_TYPES = [
    'Barangay Clearance',
    'Certificate of Indigency',
    'Certificate of Residency',
    'Barangay Business Clearance',
];

export const CitizenDocuments: React.FC = () => {
    const [requests, setRequests] = useState<DocumentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [cancellingId, setCancellingId] = useState<number | null>(null);

    // Form State
    const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0]);
    const [purpose, setPurpose] = useState('');

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await axiosPrivate.get('/document-requests/');
            const data = res.data.results || res.data;
            setRequests(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Failed to load your document requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleCreateRequest = async (e: React.SubmitEvent<HTMLElement>) => {
        e.preventDefault();
        if (!purpose.trim()) {
            toast.error('Please specify a valid purpose for this certificate.');
            return;
        }

        try {
            setSubmitting(true);
            await axiosPrivate.post('/document-requests/', {
                document_type: documentType,
                purpose: purpose.trim(),
            });
            toast.success('Document request filed successfully!');
            setIsModalOpen(false);
            setPurpose('');
            fetchRequests();
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to submit request.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelRequest = async (id: number) => {
        if (!window.confirm('Are you sure you want to cancel this pending clearance application?')) {
            return;
        }

        try {
            setCancellingId(id);
            await axiosPrivate.delete(`/document-requests/${id}/`);
            setRequests((prev) => prev.filter((r) => r.id !== id));
            toast.success('Document request cancelled.');
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to cancel request.';
            toast.error(msg);
        } finally {
            setCancellingId(null);
        }
    };

    const handleDownloadPdf = async (id: number, docType: string) => {
        try {
            setDownloadingId(id);
            const res = await axiosPrivate.get(`/document-requests/${id}/generate-pdf/`, {
                responseType: 'blob',
            });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${docType.replace(/\s+/g, '_')}_${id}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
            toast.success('Certificate downloaded.');
        } catch{
            toast.error('Could not generate PDF. Please contact the barangay hall.');
        } finally {
            setDownloadingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" /> Pending Review
                    </span>
                );
            case 'PROCESSING':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing
                    </span>
                );
            case 'READY_FOR_PICKUP':
            case 'RELEASED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready / Released
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5" /> Rejected
                    </span>
                );
            default:
                return (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        Barangay Clearances & Certificates
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Request official barangay documents, monitor live processing status, and download authenticated certificates.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold shadow-xs transition-all cursor-pointer shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>Request New Clearance</span>
                </button>
            </div>

            {/* Requests List */}
            {loading ? (
                <div className="bg-white rounded-2xl p-12 border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-text mb-2" />
                    <p className="text-sm">Retrieving your certificate records...</p>
                </div>
            ) : requests.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-sky-50 text-primary-text flex items-center justify-center mb-3">
                        <FileCheck2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">No active document requests</h3>
                    <p className="text-sm text-slate-500 max-w-sm mt-1">
                        You haven't filed any clearance applications yet. Click the button below to submit a new request.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-all cursor-pointer"
                    >
                        Request Clearance
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-[#F8FAFD] border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <tr>
                                    <th className="py-4 px-6">Document Type</th>
                                    <th className="py-4 px-6">Declared Purpose</th>
                                    <th className="py-4 px-6">Date Requested</th>
                                    <th className="py-4 px-6">Current Status</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.map((req) => {
                                    const isAvailableForDownload = ['READY_FOR_PICKUP', 'RELEASED'].includes(req.status.toUpperCase());
                                    return (
                                        <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-primary-text" />
                                                {req.document_type}
                                            </td>
                                            <td className="py-4 px-6 text-slate-600">
                                                {req.purpose || '—'}
                                            </td>
                                            <td className="py-4 px-6 text-slate-500 text-xs">
                                                {new Date(req.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </td>
                                            <td className="py-4 px-6">
                                                {getStatusBadge(req.status)}
                                                {req.admin_notes && (
                                                    <p className="text-[11px] text-slate-500 mt-1 italic">
                                                        Note: {req.admin_notes}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {isAvailableForDownload ? (
                                                    <button
                                                        onClick={() => handleDownloadPdf(req.id, req.document_type)}
                                                        disabled={downloadingId === req.id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 transition-all cursor-pointer"
                                                    >
                                                        {downloadingId === req.id ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <Download className="w-3.5 h-3.5" />
                                                        )}
                                                        <span>Download PDF</span>
                                                    </button>
                                                ) : req.status.toUpperCase() === 'PENDING' ? (
                                                    <button
                                                        onClick={() => handleCancelRequest(req.id)}
                                                        disabled={cancellingId === req.id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold border border-rose-200 transition-all cursor-pointer"
                                                        aria-label={`Cancel clearance request #${req.id}`}
                                                    >
                                                        {cancellingId === req.id ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        )}
                                                        <span>Cancel</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-slate-400">Available after approval</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* New Request Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <h3 className="text-lg font-extrabold text-slate-900">
                                Request Official Clearance
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRequest} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Document Type
                                </label>
                                <select
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFD] text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    {DOCUMENT_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Purpose Statement
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Local Employment, Scholarship, Postal ID"
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFD] text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Required by law. This will be printed on your official barangay certificate.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>{submitting ? 'Submitting...' : 'Submit Application'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};