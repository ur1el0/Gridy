import { useId, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import {
    CheckCircle2,
    ImageIcon,
    Loader2,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import type { DocumentRequest } from '../../pages/services/DocumentRequests';
import { isFeeExemptDocumentType } from '../../utils/documentFees';
import { useModalFocus } from '../../hooks/useModalFocus';
import { usePrivateMediaUrl } from '../../hooks/usePrivateMediaUrl';

interface ReviewDocumentModalProps {
    selectedRequest: DocumentRequest | null;
    closeModal: () => void;
    getStatusBadge: (status: string) => string;
    handleStatusUpdate: (newStatus: string, orNumber?: string, feeAmount?: string, paymentMethod?: string) => void;
    handlePaymentReview: (status: 'VERIFIED' | 'REJECTED', note: string, orNumber?: string) => void;
    handleSaveOrNumber?: (orNumber: string) => Promise<void> | void;
    isUpdating: boolean;
    handleDownloadPDF: () => void;
}

function formatTransactionDate(isoString?: string | null): string {
    if (!isoString) return 'Not recorded';
    try {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return isoString;
    }
}

interface ReceiptViewerProps {
    proofUrl: string;
    reference?: string;
}

const ReceiptViewer = ({ proofUrl, reference }: ReceiptViewerProps) => {
    const { url, isLoading, hasError } = usePrivateMediaUrl(proofUrl);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-4 bg-slate-100 rounded-lg border border-slate-200">
                <Loader2 className="w-5 h-5 animate-spin text-slate-500 mr-2" />
                <span className="text-xs text-slate-600">Loading receipt proof...</span>
            </div>
        );
    }

    if (hasError || !url) {
        return (
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-700">
                Could not load private receipt image.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 max-h-48 flex items-center justify-center">
                <img
                    src={url}
                    alt={`Payment proof for ${reference || 'clearance'}`}
                    className="object-contain max-h-48 w-full cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => {
                        setZoomLevel(1);
                        setIsZoomed(true);
                    }}
                />
                <button
                    type="button"
                    onClick={() => {
                        setZoomLevel(1);
                        setIsZoomed(true);
                    }}
                    className="absolute bottom-2 right-2 px-2.5 py-1 text-xs font-semibold bg-slate-900/80 text-white rounded-md shadow-sm hover:bg-slate-900 transition-colors flex items-center gap-1"
                >
                    <ZoomIn className="w-3.5 h-3.5" />
                    Inspect Receipt
                </button>
            </div>

            {isZoomed && typeof document !== 'undefined' && createPortal(
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Inspect Payment Proof"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4"
                    onClick={() => setIsZoomed(false)}
                >
                    <div
                        className="relative max-w-3xl w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-slate-700" />
                                <h3 className="text-sm font-bold text-slate-900">
                                    Official Payment Receipt {reference ? `(${reference})` : ''}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                                    className="p-1 rounded text-slate-600 hover:bg-slate-200"
                                    aria-label="Zoom out"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-mono text-slate-600">{Math.round(zoomLevel * 100)}%</span>
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                                    className="p-1 rounded text-slate-600 hover:bg-slate-200"
                                    aria-label="Zoom in"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsZoomed(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1 ml-2"
                                    aria-label="Close receipt inspection"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/5">
                            <img
                                src={url}
                                alt="Zoomed payment receipt"
                                style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
                                className="max-w-full max-h-[70vh] object-contain origin-center"
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export const ReviewDocumentModal = ({
    selectedRequest,
    closeModal,
    getStatusBadge,
    handleStatusUpdate,
    handlePaymentReview,
    handleSaveOrNumber,
    isUpdating,
    handleDownloadPDF,
}: ReviewDocumentModalProps) => {
    const [orNumber, setOrNumber] = useState('');
    const [feeAmount, setFeeAmount] = useState('50.00');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentReviewNote, setPaymentReviewNote] = useState('');
    const isFeeExempt = isFeeExemptDocumentType(selectedRequest?.document_type) || Number(selectedRequest?.fee_amount) === 0;
    const dialogTitleId = useId();
    const dialogRef = useModalFocus<HTMLDivElement>(Boolean(selectedRequest), closeModal);

    useEffect(() => {
        if (selectedRequest) {
            setOrNumber(selectedRequest.or_number || '');
            setPaymentMethod(selectedRequest.payment_method || '');
            setPaymentReviewNote('');
            setFeeAmount(
                isFeeExemptDocumentType(selectedRequest.document_type) || Number(selectedRequest.fee_amount) === 0
                    ? '0.00'
                    : selectedRequest.fee_amount != null
                        ? Number(selectedRequest.fee_amount).toFixed(2)
                        : '50.00',
            );
        }
    }, [selectedRequest]);

    if (!selectedRequest) return null;

    const onUpdate = (status: string) => {
        handleStatusUpdate(
            status,
            orNumber.trim(),
            isFeeExempt ? '0.00' : feeAmount.trim(),
            isFeeExempt ? '' : paymentMethod,
        );
    };

    const handleRelease = () => {
        if (!isFeeExempt && Number(feeAmount) > 0 && !orNumber.trim()) {
            toast.error('Official Receipt (O.R.) number is required before releasing a paid document.');
            return;
        }
        onUpdate('RELEASED');
    };

    const onSaveOr = () => {
        if (handleSaveOrNumber) {
            handleSaveOrNumber(orNumber);
        } else {
            onUpdate(selectedRequest.status);
        }
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
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-extrabold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                                        Official Assessment & Treasury
                                    </h4>
                                    {selectedRequest.or_number && (
                                        <span className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded">
                                            O.R. #{selectedRequest.or_number}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-xs font-semibold text-slate-600">O.R. Number</label>
                                            {orNumber.trim() && (
                                                <button
                                                    type="button"
                                                    onClick={onSaveOr}
                                                    disabled={isUpdating}
                                                    className="text-[11px] font-bold text-primary hover:underline disabled:opacity-50 cursor-pointer"
                                                >
                                                    Save O.R.
                                                </button>
                                            )}
                                        </div>
                                        <input 
                                            type="text"
                                            value={orNumber}
                                            onChange={(e) => setOrNumber(e.target.value)}
                                            placeholder="e.g. OR-89104"
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        />
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            Official Receipt can be saved independently before document release.
                                        </p>
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
                                            <div role="status" className="mt-1.5 flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-100 border border-emerald-200 text-[11px] font-bold text-emerald-800">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                Fee Exempt (₱0.00) — RA 11261 / Indigency
                                            </div>
                                        )}
                                    </div>
                                    {!isFeeExempt && (
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method</label>
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
                                            {paymentMethod === 'CASH' ? (
                                                <p className="mt-1 text-xs text-sky-800 font-medium">
                                                    Cash payment will be settled in person at the Barangay Treasurer desk upon pickup. No electronic proof is required.
                                                </p>
                                            ) : (
                                                <p className="mt-1 text-xs text-slate-600">
                                                    Cash remains available. Every electronic transfer reference is checked manually by barangay staff; KapitBayan does not process money.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Electronic Payment Details Card */}
                            {Boolean(selectedRequest.payment_reference || selectedRequest.payment_proof_url) && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                                            {selectedRequest.payment_method || 'Electronic'} Transfer Details
                                        </h4>
                                        <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-amber-200 text-amber-900 uppercase">
                                            {selectedRequest.payment_method || 'E-Payment'}
                                        </span>
                                    </div>

                                    {/* Monospace Reference and Timestamp */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white/70 p-2.5 rounded-lg border border-amber-100">
                                        <div>
                                            <span className="text-slate-500 font-semibold block">Reference Number:</span>
                                            <span className="font-mono font-bold text-slate-900">{selectedRequest.payment_reference || 'None'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 font-semibold block">Transaction Date/Time:</span>
                                            <span className="text-slate-800 font-medium">
                                                {formatTransactionDate(selectedRequest.payment_transacted_at)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Recipient Snapshot */}
                                    {(selectedRequest.payment_recipient_name_snapshot || selectedRequest.payment_recipient_identifier_snapshot) && (
                                        <div className="text-xs text-slate-700 bg-white/50 p-2 rounded-lg border border-amber-100">
                                            <span className="font-semibold text-slate-500 block">Designated Barangay Recipient:</span>
                                            <span className="font-medium text-slate-900">
                                                {selectedRequest.payment_recipient_name_snapshot || 'Account'} · {selectedRequest.payment_recipient_identifier_snapshot || 'N/A'}
                                            </span>
                                            {selectedRequest.payment_instructions_snapshot && (
                                                <p className="mt-1 text-slate-600 italic text-[11px]">
                                                    {selectedRequest.payment_instructions_snapshot}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Staff Verification Instructions Banner */}
                                    <div className="p-2.5 bg-amber-100/60 rounded-lg text-xs text-amber-900 border border-amber-200/80 leading-relaxed">
                                        <span className="font-bold">Staff Verification Guidance:</span> Verify that the reference number, amount (₱{isFeeExempt ? '0.00' : (selectedRequest.fee_amount ?? feeAmount)}), and date/time match your official barangay receiving account before verifying.
                                    </div>

                                    {/* Receipt Proof Viewer */}
                                    {selectedRequest.payment_proof_url && (
                                        <div className="space-y-1.5">
                                            <span className="text-xs font-semibold text-slate-700 block">Resident's Uploaded Proof Screenshot:</span>
                                            <ReceiptViewer
                                                proofUrl={selectedRequest.payment_proof_url}
                                                reference={selectedRequest.payment_reference}
                                            />
                                        </div>
                                    )}

                                    {/* Payment Review Status & Note */}
                                    <div className="text-xs text-slate-600 flex items-center justify-between pt-1 border-t border-amber-200">
                                        <span>Payment Status: <strong className="text-slate-800">{(selectedRequest.payment_status || '').replace(/_/g, ' ').toLowerCase()}</strong></span>
                                    </div>

                                    {selectedRequest.payment_review_note && (
                                        <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                                            <strong>Staff Note:</strong> {selectedRequest.payment_review_note}
                                        </div>
                                    )}

                                    {/* Verification Controls when PENDING_VERIFICATION */}
                                    {selectedRequest.payment_status === 'PENDING_VERIFICATION' && (
                                        <div className="space-y-2 border-t border-amber-200 pt-3">
                                            <label className="block text-xs font-semibold text-slate-700">
                                                Rejection Reason Note <span className="text-rose-600 font-normal">(required only when rejecting)</span>
                                                <textarea
                                                    rows={2}
                                                    maxLength={500}
                                                    value={paymentReviewNote}
                                                    onChange={(event) => setPaymentReviewNote(event.target.value)}
                                                    placeholder="Explain why the reference/proof was rejected (e.g. amount mismatch, invalid screenshot)"
                                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handlePaymentReview('VERIFIED', paymentReviewNote, orNumber)}
                                                    disabled={isUpdating}
                                                    className="rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                                                >
                                                    Verify Transfer
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handlePaymentReview('REJECTED', paymentReviewNote)}
                                                    disabled={isUpdating || !paymentReviewNote.trim()}
                                                    className="rounded-lg bg-rose-700 hover:bg-rose-800 px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                                                >
                                                    Reject Reference
                                                </button>
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
                                        type="button"
                                        onClick={handleDownloadPDF}
                                        className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                                    >
                                        Download PDF
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    type="button"
                                    onClick={closeModal} 
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                                >
                                    Close
                                </button>
                                
                                {selectedRequest.status.toLowerCase() === 'pending' && (
                                    <>
                                        <button 
                                            type="button"
                                            onClick={() => onUpdate('REJECTED')}
                                            disabled={isUpdating}
                                            className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-all shadow-sm cursor-pointer"
                                        >
                                            Reject
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => onUpdate('PROCESSING')}
                                            disabled={isUpdating}
                                            className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary-hover disabled:opacity-50 rounded-xl transition-all shadow-sm cursor-pointer"
                                        >
                                            Approve & Process
                                        </button>
                                    </>
                                )}

                                {selectedRequest.status.toLowerCase() === 'processing' && (
                                    <button 
                                        type="button"
                                        onClick={() => onUpdate('READY_FOR_PICKUP')}
                                        disabled={isUpdating}
                                        className="px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl transition-all shadow-sm cursor-pointer"
                                    >
                                        Mark Ready for Pickup
                                    </button>
                                )}

                                {selectedRequest.status.toLowerCase() === 'ready_for_pickup' && (
                                    <button 
                                        type="button"
                                        onClick={handleRelease}
                                        disabled={isUpdating}
                                        className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-sm cursor-pointer"
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
