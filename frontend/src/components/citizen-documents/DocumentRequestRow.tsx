import React from 'react';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Download,
    FileText,
    Loader2,
    Trash2,
} from 'lucide-react';
import { PaymentReferenceForm } from './PaymentReferenceForm';
import type { DocumentRequest, PaymentRecipient } from './types';

interface DocumentRequestRowProps {
    request: DocumentRequest;
    recipients: PaymentRecipient[];
    selectedRecipientId: string;
    paymentReference: string;
    submittingPayment: boolean;
    downloading: boolean;
    cancelling: boolean;
    onRecipientChange: (value: string) => void;
    onPaymentReferenceChange: (value: string) => void;
    onSubmitPaymentReference: () => void;
    onDownloadPdf: () => void;
    onCancel: () => void;
}

const RequestStatusBadge: React.FC<{ status: string }> = ({ status }) => {
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

export const DocumentRequestRow: React.FC<DocumentRequestRowProps> = ({
    request,
    recipients,
    selectedRecipientId,
    paymentReference,
    submittingPayment,
    downloading,
    cancelling,
    onRecipientChange,
    onPaymentReferenceChange,
    onSubmitPaymentReference,
    onDownloadPdf,
    onCancel,
}) => {
    const isAvailableForDownload = ['READY_FOR_PICKUP', 'RELEASED'].includes(
        request.status.toUpperCase(),
    );

    return (
        <tr className="hover:bg-slate-50/70 transition-colors">
            <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-text" />
                {request.document_type}
            </td>
            <td className="py-4 px-6 text-slate-600">
                {request.purpose || '—'}
            </td>
            <td className="py-4 px-6 text-slate-500 text-xs">
                {new Date(request.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                })}
            </td>
            <td className="py-4 px-6">
                <RequestStatusBadge status={request.status} />
                {Number(request.fee_amount ?? 0) > 0 && (
                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                        <p>Assessment: ₱{Number(request.fee_amount).toFixed(2)}</p>
                        <p>Payment: {(request.payment_status || 'UNPAID').replace(/_/g, ' ').toLowerCase()}</p>
                        {request.payment_review_note && (
                            <p className="text-rose-700">Staff note: {request.payment_review_note}</p>
                        )}
                        {request.status.toUpperCase() === 'READY_FOR_PICKUP' &&
                            request.payment_method !== 'CASH' &&
                            ['UNPAID', 'REJECTED'].includes(request.payment_status || 'UNPAID') && (
                                <PaymentReferenceForm
                                    requestId={request.id}
                                    recipients={recipients}
                                    selectedRecipientId={selectedRecipientId}
                                    paymentReference={paymentReference}
                                    submitting={submittingPayment}
                                    onRecipientChange={onRecipientChange}
                                    onPaymentReferenceChange={onPaymentReferenceChange}
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        onSubmitPaymentReference();
                                    }}
                                />
                            )}
                    </div>
                )}
                {request.admin_notes && (
                    <p className="text-[11px] text-slate-500 mt-1 italic">
                        Note: {request.admin_notes}
                    </p>
                )}
            </td>
            <td className="py-4 px-6 text-right">
                {isAvailableForDownload ? (
                    <div className="flex flex-col items-end gap-2">
                        {request.status.toUpperCase() === 'READY_FOR_PICKUP' &&
                            request.payment_status === 'PENDING_VERIFICATION' && (
                                <span className="text-xs font-medium text-amber-700">Waiting for payment verification</span>
                            )}
                        <button
                            onClick={onDownloadPdf}
                            disabled={downloading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 transition-all cursor-pointer"
                        >
                            {downloading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Download className="w-3.5 h-3.5" />
                            )}
                            <span>Download PDF</span>
                        </button>
                    </div>
                ) : request.status.toUpperCase() === 'PENDING' ? (
                    <button
                        onClick={onCancel}
                        disabled={cancelling}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold border border-rose-200 transition-all cursor-pointer"
                        aria-label={`Cancel clearance request #${request.id}`}
                    >
                        {cancelling ? (
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
};
