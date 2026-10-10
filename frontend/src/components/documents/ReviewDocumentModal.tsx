import { useId, useState, useEffect } from 'react';
import type { DocumentRequest } from '../../pages/services/DocumentRequests';
import { isFeeExemptDocumentType } from '../../utils/documentFees';
import { useModalFocus } from '../../hooks/useModalFocus';

interface ReviewDocumentModalProps {
    selectedRequest: DocumentRequest | null;
    closeModal: () => void;
    getStatusBadge: (status: string) => string;
    handleStatusUpdate: (newStatus: string, orNumber?: string, feeAmount?: string, paymentMethod?: string) => void;
    handlePaymentReview: (status: 'VERIFIED' | 'REJECTED', note: string) => void;
    isUpdating: boolean;
    handleDownloadPDF: () => void;
}

export const ReviewDocumentModal = ({
    selectedRequest,
    closeModal,
    getStatusBadge,
    handleStatusUpdate,
    handlePaymentReview,
    isUpdating,
    handleDownloadPDF,
}: ReviewDocumentModalProps) => {
    const [orNumber, setOrNumber] = useState('');
    const [feeAmount, setFeeAmount] = useState('50.00');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentReviewNote, setPaymentReviewNote] = useState('');
    const isFeeExempt = isFeeExemptDocumentType(selectedRequest?.document_type);
    const dialogTitleId = useId();
    const dialogRef = useModalFocus<HTMLDivElement>(Boolean(selectedRequest), closeModal);

    useEffect(() => {
        if (selectedRequest) {
            setOrNumber(selectedRequest.or_number || '');
            setPaymentMethod(selectedRequest.payment_method || '');
            setPaymentReviewNote('');
            setFeeAmount(
                isFeeExemptDocumentType(selectedRequest.document_type)
                    ? '0.00'
                    : String(selectedRequest.fee_amount ?? '50.00'),
            );
        }
    }, [selectedRequest]);

    if (!selectedRequest) return null;

    const onUpdate = (status: string) => {
        handleStatusUpdate(
            status,
            orNumber.trim(),
            isFeeExempt ? '0.00' : feeAmount.trim(),
            paymentMethod,
        );
    };

    return (
        <div className="fixed inset-0 overflow-hidden z-50">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={closeModal} />
                
                <div className="fixed inset-y-0 right-0 max-w-lg w-full flex">
                    <div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={dialogTitleId}
                        tabIndex={-1}
                        className="w-full h-full bg-white shadow-2xl flex flex-col"
                    >
                        
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3">
                                <h3 id={dialogTitleId} className="text-lg font-bold text-slate-900">Request #{selectedRequest.id}</h3>
                                {selectedRequest.is_walkin && (
                                    <span className="px-2.5 py-0.5 text-xs font-extrabold uppercase bg-amber-100 text-amber-800 rounded-md border border-amber-200">
                                        Walk-in Resident
                                    </span>
                                )}
                            </div>
                            <button 
                                onClick={closeModal} 
                                className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 transition-colors"
                                aria-label="Close details"
                            >
                                <span className="text-2xl leading-none">&times;</span>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
                            <div>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Applicant Name</h4>
                                <p className="mt-1 text-base font-bold text-slate-900">
                                    {selectedRequest.requester_name || selectedRequest.walkin_name || 'Resident'}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Purok / Zone</h4>
                                <p className="mt-1 text-sm font-semibold text-slate-700">
                                    {selectedRequest.purok || selectedRequest.walkin_purok || 'N/A'}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Document Type</h4>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRequest.document_type}</p>
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Purpose Statement</h4>
                                <p className="mt-1 text-sm text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                                    {selectedRequest.purpose || 'For legal and general identification purposes.'}
                                </p>
                            </div>

                            {/* Official Assessment / Treasury Slip Inputs */}
                            <div className="p-4 bg-sky-50/70 rounded-xl border border-sky-100 space-y-3">
                                <h4 className="text-xs font-extrabold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                                    Official Assessment & Treasury
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">O.R. Number</label>
                                        <input 
                                            type="text"
                                            value={orNumber}
                                            onChange={(e) => setOrNumber(e.target.value)}
                                            placeholder="e.g. OR-89104"
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Fee Amount (PHP)</label>
                                        <input 
                                            type="number"
                                            step="0.01"
                                            value={isFeeExempt ? '0.00' : feeAmount}
                                            disabled={isFeeExempt}
                                            onChange={(e) => setFeeAmount(e.target.value)}
                                            placeholder="50.00"
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                        {isFeeExempt && (
                                            <p role="status" className="mt-1 text-xs text-emerald-700">
                                                This document is fee-exempt. The amount is locked at ₱0.00.
                                            </p>
                                        )}
                                    </div>
                                    {!isFeeExempt && (
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Payment method</label>
                                            <select
                                                value={paymentMethod}
                                                onChange={(event) => setPaymentMethod(event.target.value)}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                            >
                                                <option value="">Select when paid</option>
                                                <option value="CASH">Cash at barangay hall</option>
                                                <option value="GCASH">GCash transfer</option>
                                                <option value="MAYA">Maya transfer</option>
                                                <option value="BANK">Bank transfer</option>
                                                <option value="OTHER">Other e-payment</option>
                                            </select>
                                            <p className="mt-1 text-xs text-slate-600">Cash remains available. Every electronic transfer reference is checked manually by barangay staff; KapitBayan does not process money.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedRequest.payment_reference && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">{selectedRequest.payment_method || 'Electronic'} transfer reference</h4>
                                    <p className="font-mono text-sm text-slate-900">{selectedRequest.payment_reference}</p>
                                    {selectedRequest.payment_recipient_name_snapshot && <p className="text-sm text-slate-700">Recipient: {selectedRequest.payment_recipient_name_snapshot} · {selectedRequest.payment_recipient_identifier_snapshot}</p>}
                                    {selectedRequest.payment_instructions_snapshot && <p className="text-xs text-slate-600">{selectedRequest.payment_instructions_snapshot}</p>}
                                    <p className="text-xs text-slate-600">Payment status: {(selectedRequest.payment_status || '').replace(/_/g, ' ').toLowerCase()}</p>
                                    {selectedRequest.payment_review_note && <p className="text-sm text-rose-800">Staff note: {selectedRequest.payment_review_note}</p>}
                                    {selectedRequest.payment_status === 'PENDING_VERIFICATION' && (
                                        <div className="space-y-2 border-t border-amber-200 pt-3">
                                            <label className="block text-xs font-semibold text-slate-700">
                                                Note (required when rejecting)
                                                <textarea
                                                    rows={2}
                                                    maxLength={500}
                                                    value={paymentReviewNote}
                                                    onChange={(event) => setPaymentReviewNote(event.target.value)}
                                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                />
                                            </label>
                                            <div className="flex gap-2">
                                                <button onClick={() => handlePaymentReview('VERIFIED', paymentReviewNote)} disabled={isUpdating} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Verify transfer</button>
                                                <button onClick={() => handlePaymentReview('REJECTED', paymentReviewNote)} disabled={isUpdating || !paymentReviewNote.trim()} className="rounded-lg bg-rose-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Reject reference</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Status</h4>
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getStatusBadge(selectedRequest.status)}`}>
                                    {selectedRequest.status.replace(/_/g, ' ')}
                                </span>
                            </div>
                        </div>

                        {/* Modal Footer / Actions */}
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                            <div>
                                {['processing', 'ready_for_pickup', 'released'].includes(selectedRequest.status.toLowerCase()) && (
                                    <button
                                        onClick={handleDownloadPDF}
                                        className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-xl transition-all"
                                    >
                                        Download PDF
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={closeModal} 
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                                >
                                    Close
                                </button>
                                
                                {selectedRequest.status.toLowerCase() === 'pending' && (
                                    <>
                                        <button 
                                            onClick={() => onUpdate('REJECTED')}
                                            disabled={isUpdating}
                                            className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-all shadow-sm"
                                        >
                                            Reject
                                        </button>
                                        <button 
                                            onClick={() => onUpdate('PROCESSING')}
                                            disabled={isUpdating}
                                            className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary-hover disabled:opacity-50 rounded-xl transition-all shadow-sm"
                                        >
                                            Approve & Process
                                        </button>
                                    </>
                                )}

                                {selectedRequest.status.toLowerCase() === 'processing' && (
                                    <button 
                                        onClick={() => onUpdate('READY_FOR_PICKUP')}
                                        disabled={isUpdating}
                                        className="px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl transition-all shadow-sm"
                                    >
                                        Mark Ready for Pickup
                                    </button>
                                )}

                                {selectedRequest.status.toLowerCase() === 'ready_for_pickup' && (
                                    <button 
                                        onClick={() => onUpdate('RELEASED')}
                                        disabled={isUpdating}
                                        className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-sm"
                                    >
                                        Release to Resident
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
