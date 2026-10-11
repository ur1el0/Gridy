import React from 'react';
import { XCircle } from 'lucide-react';
import { useModalFocus } from '../../hooks/useModalFocus';
import type { Resident } from './types';

interface RejectionConfirmationModalProps {
    resident: Resident;
    rejectionReason: string;
    onReasonChange: (reason: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
    isRejecting: boolean;
}

export const RejectionConfirmationModal: React.FC<RejectionConfirmationModalProps> = ({
    resident,
    rejectionReason,
    onReasonChange,
    onConfirm,
    onCancel,
    isRejecting,
}) => {
    const dialogRef = useModalFocus<HTMLDivElement>(true, () => {
        if (!isRejecting) onCancel();
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="resident-rejection-title"
                tabIndex={-1}
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-border"
            >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 mx-auto">
                    <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 id="resident-rejection-title" className="text-lg font-bold text-center text-slate-800 mb-2">
                    Reject Application?
                </h3>
                <p className="text-sm text-center text-slate-500 mb-4">
                    Are you sure you want to reject the application for <span className="font-semibold text-slate-700">{resident.full_name}</span>? This will permanently delete the resident account and remove the application from the queue.
                </p>

                <div className="mb-6">
                    <label htmlFor="resident-rejection-reason" className="block text-sm font-semibold text-slate-700 mb-1">
                        Reason for rejection <span aria-hidden="true">*</span>
                    </label>
                    <textarea
                        id="resident-rejection-reason"
                        value={rejectionReason}
                        onChange={(event) => onReasonChange(event.target.value)}
                        maxLength={1000}
                        rows={4}
                        required
                        aria-describedby="resident-rejection-reason-help"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <p id="resident-rejection-reason-help" className="mt-1 text-xs text-slate-500">
                        Required. This reason will be recorded in the audit trail.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isRejecting}
                        className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isRejecting}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isRejecting ? 'Submitting…' : 'Confirm Rejection'}
                    </button>
                </div>
            </div>
        </div>
    );
};
