import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { axiosPrivate } from '../../api/axios';
import { getSafeApiErrorMessage } from '../../api/error-message';
import { InlineErrorState } from '../../components/ui/InlineErrorState';
import { NewDocumentRequestModal } from '../../components/citizen-documents/NewDocumentRequestModal';
import { DOCUMENT_TYPES } from '../../components/citizen-documents/documentTypes';
import {
    FileText,
    Plus,
    Download,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    FileCheck2,
    Trash2,
} from 'lucide-react';

interface DocumentRequest {
    id: number;
    document_type: string;
    purpose: string;
    status: string;
    fee_amount?: number | string | null;
    payment_method?: string;
    payment_reference?: string;
    payment_status?: string;
    payment_review_note?: string;
    payment_recipient?: number | null;
    payment_recipient_name_snapshot?: string | null;
    payment_recipient_identifier_snapshot?: string | null;
    payment_instructions_snapshot?: string | null;
    admin_notes?: string;
    created_at: string;
}

interface PaymentRecipient {
    id: number;
    provider: string;
    provider_label: string;
    display_name: string;
    recipient_name: string;
    recipient_identifier: string;
    instructions: string;
}

export const CitizenDocuments: React.FC = () => {
    const [requests, setRequests] = useState<DocumentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [paymentReference, setPaymentReference] = useState<Record<number, string>>({});
    const [selectedRecipientId, setSelectedRecipientId] = useState<Record<number, string>>({});
    const [paymentRecipients, setPaymentRecipients] = useState<PaymentRecipient[]>([]);
    const [submittingPaymentId, setSubmittingPaymentId] = useState<number | null>(null);

    // Form State
    const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0]);
    const [purpose, setPurpose] = useState('');

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await axiosPrivate.get('/document-requests/');
            const data = res.data.results || res.data;
            setRequests(Array.isArray(data) ? data : []);
            setLoadError(false);
        } catch {
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        axiosPrivate.get('/payment-recipients/')
            .then((response) => {
                const data = response.data.results || response.data;
                setPaymentRecipients(Array.isArray(data) ? data : []);
            })
            .catch(() => setPaymentRecipients([]));
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
        } catch (err) {
            toast.error(getSafeApiErrorMessage(
                err,
                "We couldn't submit your document request. Check your connection and try again.",
            ));
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
        } catch (err) {
            toast.error(getSafeApiErrorMessage(
                err,
                "We couldn't cancel your request. Check your connection and try again.",
            ));
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

    const handleSubmitPaymentReference = async (id: number) => {
        const reference = paymentReference[id]?.trim();
        const recipientId = Number(selectedRecipientId[id]);
        if (!recipientId) {
            toast.error('Select an e-payment recipient configured by your barangay.');
            return;
        }
        if (!reference) {
            toast.error('Enter the transfer reference.');
            return;
        }

        setSubmittingPaymentId(id);
        try {
            const response = await axiosPrivate.post(
                `/document-requests/${id}/payment-reference/`,
                { payment_recipient_id: recipientId, payment_reference: reference },
            );
            setRequests((current) => current.map((request) =>
                request.id === id ? { ...request, ...response.data } : request,
            ));
            setPaymentReference((current) => ({ ...current, [id]: '' }));
            toast.success('Transfer reference sent to barangay staff for manual verification.');
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Could not submit the payment reference.');
        } finally {
            setSubmittingPaymentId(null);
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
            ) : loadError ? (
                <InlineErrorState
                    message="We couldn't load your document requests."
                    onRetry={() => void fetchRequests()}
                    retrying={loading}
                />
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
                                                {Number(req.fee_amount ?? 0) > 0 && (
                                                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                                                        <p>Assessment: ₱{Number(req.fee_amount).toFixed(2)}</p>
                                                        <p>Payment: {(req.payment_status || 'UNPAID').replace(/_/g, ' ').toLowerCase()}</p>
                                                        {req.payment_review_note && <p className="text-rose-700">Staff note: {req.payment_review_note}</p>}
                                                        {req.status.toUpperCase() === 'READY_FOR_PICKUP' &&
                                                            req.payment_method !== 'CASH' &&
                                                            ['UNPAID', 'REJECTED'].includes(req.payment_status || 'UNPAID') && (
                                                                <form
                                                                    className="mt-2 space-y-2"
                                                                    onSubmit={(event) => {
                                                                        event.preventDefault();
                                                                        void handleSubmitPaymentReference(req.id);
                                                                    }}
                                                                >
                                                                    <p>Select an official recipient configured by your barangay, follow its instructions, and enter your transfer reference. Staff verify the transfer manually.</p>
                                                                    {paymentRecipients.length === 0 ? (
                                                                        <p role="status" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Your barangay has not configured an e-payment recipient. Contact the barangay hall or pay in person.</p>
                                                                    ) : (
                                                                        <>
                                                                            <label className="block text-xs font-semibold text-slate-700">
                                                                                Payment recipient
                                                                                <select required aria-label={`Payment recipient for request ${req.id}`} value={selectedRecipientId[req.id] || ''} onChange={(event) => setSelectedRecipientId((current) => ({ ...current, [req.id]: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs">
                                                                                    <option value="">Select a recipient</option>
                                                                                    {paymentRecipients.map((recipient) => <option key={recipient.id} value={recipient.id}>{recipient.display_name} · {recipient.provider_label}</option>)}
                                                                                </select>
                                                                            </label>
                                                                            {(() => {
                                                                                const recipient = paymentRecipients.find((item) => item.id === Number(selectedRecipientId[req.id]));
                                                                                return recipient ? <div className="rounded-lg bg-white p-3 text-xs text-slate-700"><p className="font-bold">{recipient.recipient_name}</p><p>{recipient.recipient_identifier}</p>{recipient.instructions && <p className="mt-1">{recipient.instructions}</p>}</div> : null;
                                                                            })()}
                                                                            <input required maxLength={100} aria-label={`Transfer reference for request ${req.id}`} value={paymentReference[req.id] ?? ''} onChange={(event) => setPaymentReference((current) => ({ ...current, [req.id]: event.target.value }))} placeholder="Transfer reference" className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs" />
                                                                            <button type="submit" disabled={submittingPaymentId === req.id} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                                                                                {submittingPaymentId === req.id ? 'Submitting…' : 'Submit transfer reference'}
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </form>
                                                            )}
                                                    </div>
                                                )}
                                                {req.admin_notes && (
                                                    <p className="text-[11px] text-slate-500 mt-1 italic">
                                                        Note: {req.admin_notes}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {isAvailableForDownload ? (
                                                    <div className="flex flex-col items-end gap-2">
                                                        {req.status.toUpperCase() === 'READY_FOR_PICKUP' &&
                                                            req.payment_status === 'PENDING_VERIFICATION' && (
                                                                <span className="text-xs font-medium text-amber-700">Waiting for payment verification</span>
                                                            )}
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
                                                    </div>
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

            {isModalOpen && (
                <NewDocumentRequestModal
                    documentType={documentType}
                    purpose={purpose}
                    submitting={submitting}
                    onDocumentTypeChange={setDocumentType}
                    onPurposeChange={setPurpose}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleCreateRequest}
                />
            )}
        </div>
    );
};
