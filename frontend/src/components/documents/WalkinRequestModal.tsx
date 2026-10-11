import React, { useId } from 'react';
import { useModalFocus } from '../../hooks/useModalFocus';

export interface WalkinRequestModalProps {
    onClose: () => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    walkinName: string;
    setWalkinName: (name: string) => void;
    walkinPurok: string;
    setWalkinPurok: (purok: string) => void;
    newDocType: string;
    setNewDocType: (type: string) => void;
    newPurpose: string;
    setNewPurpose: (purpose: string) => void;
    isSubmitting: boolean;
}

export const WalkinRequestModal: React.FC<WalkinRequestModalProps> = ({
    onClose,
    onSubmit,
    walkinName,
    setWalkinName,
    walkinPurok,
    setWalkinPurok,
    newDocType,
    setNewDocType,
    newPurpose,
    setNewPurpose,
    isSubmitting,
}) => {
    const walkinDialogTitleId = useId();
    const walkinDialogRef = useModalFocus<HTMLDivElement>(true, onClose);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div
                ref={walkinDialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={walkinDialogTitleId}
                tabIndex={-1}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95"
            >
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 id={walkinDialogTitleId} className="text-base font-bold text-slate-900">Create Walk-in Request</h3>
                        <p className="text-xs text-slate-500">Record an in-person resident's document request for staff review.</p>
                    </div>
                    <button
                        onClick={onClose}
                        type="button"
                        aria-label="Close walk-in request dialog"
                        className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                    >
                        <span className="text-2xl leading-none">&times;</span>
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-4 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="walkin-resident-name" className="block text-xs font-bold text-slate-700 mb-1">Resident Full Name *</label>
                            <input
                                id="walkin-resident-name"
                                type="text"
                                required
                                value={walkinName}
                                onChange={(e) => setWalkinName(e.target.value)}
                                placeholder="e.g. Maria Santos"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                        <div>
                            <label htmlFor="walkin-purok" className="block text-xs font-bold text-slate-700 mb-1">Purok / Zone</label>
                            <input
                                id="walkin-purok"
                                type="text"
                                value={walkinPurok}
                                onChange={(e) => setWalkinPurok(e.target.value)}
                                placeholder="e.g. Purok Maligaya"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="walkin-document-type" className="block text-xs font-bold text-slate-700 mb-1">Document Type</label>
                        <select
                            id="walkin-document-type"
                            value={newDocType}
                            onChange={(e) => setNewDocType(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                        >
                            <option value="Barangay Clearance">Barangay Clearance</option>
                            <option value="Certificate of Indigency">Certificate of Indigency</option>
                            <option value="First Time Job Seeker Certificate">
                                First Time Job Seeker Certificate
                            </option>
                            <option value="Business Permit">Business Permit</option>
                            <option value="Proof of Residency">Proof of Residency</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="walkin-purpose" className="block text-xs font-bold text-slate-700 mb-1">Purpose Statement *</label>
                        <textarea
                            id="walkin-purpose"
                            required
                            value={newPurpose}
                            onChange={(e) => setNewPurpose(e.target.value)}
                            rows={2}
                            placeholder="e.g. Employment requirement, Bank account opening, Scholarship..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                        />
                    </div>

                    <div className="pt-3 flex justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary-hover rounded-xl transition-all shadow-sm disabled:opacity-70 cursor-pointer"
                        >
                            {isSubmitting ? 'Submitting...' : 'Record Walk-in Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
