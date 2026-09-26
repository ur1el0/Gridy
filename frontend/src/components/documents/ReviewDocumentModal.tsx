import { useState, useEffect } from 'react';
import type { DocumentRequest } from '../../pages/services/DocumentRequests';

interface ReviewDocumentModalProps {
    selectedRequest: DocumentRequest | null;
    closeModal: () => void;
    getStatusBadge: (status: string) => string;
    handleStatusUpdate: (newStatus: string, orNumber?: string, feeAmount?: string) => void;
    isUpdating: boolean;
    handleDownloadPDF: () => void;
}

export const ReviewDocumentModal = ({
    selectedRequest,
    closeModal,
    getStatusBadge,
    handleStatusUpdate,
    isUpdating,
    handleDownloadPDF,
}: ReviewDocumentModalProps) => {
    const [orNumber, setOrNumber] = useState('');
    const [feeAmount, setFeeAmount] = useState('50.00');

    useEffect(() => {
        if (selectedRequest) {
            setOrNumber(selectedRequest.or_number || '');
            setFeeAmount(selectedRequest.fee_amount ? String(selectedRequest.fee_amount) : '50.00');
        }
    }, [selectedRequest]);

    if (!selectedRequest) return null;

    const onUpdate = (status: string) => {
        handleStatusUpdate(status, orNumber.trim(), feeAmount.trim());
    };

    return (
        <div className="fixed inset-0 overflow-hidden z-50">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={closeModal} />
                
                <div className="fixed inset-y-0 right-0 max-w-lg w-full flex">
                    <div className="w-full h-full bg-white shadow-2xl flex flex-col">
                        
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-slate-900">Request #{selectedRequest.id}</h3>
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
                                            value={feeAmount}
                                            onChange={(e) => setFeeAmount(e.target.value)}
                                            placeholder="50.00"
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        />
                                    </div>
                                </div>
                            </div>

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