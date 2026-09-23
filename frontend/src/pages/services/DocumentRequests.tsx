import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import { axiosPrivate } from '../../api/axios';
import { DocumentTable } from '../../components/documents/DocumentTable';
import { ReviewDocumentModal } from '../../components/documents/ReviewDocumentModal';

export interface DocumentRequest {
    id: number;
    request_id?: number;
    requester_name?: string;
    purok?: string;
    is_walkin?: boolean;
    walkin_name?: string;
    walkin_purok?: string;
    document_type: string;
    purpose?: string;
    urgency_tag?: 'REGULAR' | 'URGENT';
    status: string;
    admin_notes?: string;
    or_number?: string;
    fee_amount?: number | string;
    created_at: string;
}

const TableSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
            <div className="h-8 w-48 bg-slate-200 rounded"></div>
            <div className="h-10 w-32 bg-slate-200 rounded-md"></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 h-12 border-b border-slate-200 w-full"></div>
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex h-16 border-b border-slate-100 items-center px-6 gap-4">
                    <div className="h-4 w-12 bg-slate-200 rounded"></div>
                    <div className="h-4 w-48 bg-slate-200 rounded"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                    <div className="h-4 w-24 bg-slate-200 rounded"></div>
                    <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                </div>
            ))}
        </div>
    </div>
);

export const DocumentRequests: React.FC = () => {
    const [requests, setRequests] = useState<DocumentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Walk-in Dialog State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [walkinName, setWalkinName] = useState('');
    const [walkinPurok, setWalkinPurok] = useState('');
    const [newDocType, setNewDocType] = useState('Barangay Clearance');
    const [newPurpose, setNewPurpose] = useState('');
    const [orNumber, setOrNumber] = useState('');
    const [feeAmount, setFeeAmount] = useState('50.00');
    const [initialStatus, setInitialStatus] = useState('RELEASED');

    const fetchRequests = async () => {
        try {
            const response = await axiosPrivate.get('/document-requests/');
            setRequests(response.data.results || response.data);
        } catch (err) {
            setError('Failed to load document requests.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': 
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'processing': 
                return 'bg-sky-100 text-sky-800 border-sky-200';
            case 'ready_for_pickup': 
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'released': 
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'rejected': 
                return 'bg-rose-100 text-rose-800 border-rose-200';
            default: 
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const openModal = (request: DocumentRequest) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRequest(null);
    };

    const handleStatusUpdate = async (newStatus: string, updatedOr?: string, updatedFee?: string) => {
        if (!selectedRequest) return;
        setIsUpdating(true);

        try {
            const response = await axiosPrivate.patch(`/document-requests/${selectedRequest.id}/validate/`, {
                status: newStatus,
                or_number: updatedOr,
                fee_amount: updatedFee
            });

            setRequests(prev => prev.map(req =>
                req.id === selectedRequest.id ? { ...req, ...response.data } : req
            ));
            toast.success(`Request marked as ${newStatus.replace(/_/g, ' ')}`);
            closeModal();
        } catch (err) {
            console.error("Failed to update status", err);
            toast.error('Failed to update status. Please check permissions or try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!selectedRequest) return;
        try {
            const response = await axiosPrivate.get(`/document-requests/${selectedRequest.id}/generate-pdf/`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${selectedRequest.document_type.replace(/ /g, '_')}_${selectedRequest.id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.success('Clearance certificate downloaded.');
        } catch (error) {
            console.error("Failed to download PDF", error);
            toast.error('Failed to generate PDF. Make sure the document is approved or released.');
        }
    };

    const handleDeleteRequest = async (id: number) => {
        const confirmed = window.confirm('Are you sure you want to delete this clearance request? This action cannot be undone.');
        if (!confirmed) return;

        try {
            await axiosPrivate.delete(`/document-requests/${id}/`);
            setRequests(prev => prev.filter(req => req.id !== id));
            toast.success('Clearance request deleted successfully.');
        } catch (err: any) {
            console.error('Failed to delete clearance request:', err);
            toast.error(err.response?.data?.detail || 'Failed to delete clearance request.');
        }
    };

    const handleCreateWalkinRequest = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!walkinName.trim()) {
            toast.error("Please enter the resident's full name.");
            return;
        }

        setIsSubmitting(true);
        try {
            await axiosPrivate.post('/document-requests/', {
                walkin_name: walkinName.trim(),
                walkin_purok: walkinPurok.trim(),
                document_type: newDocType,
                purpose: newPurpose.trim(),
                or_number: orNumber.trim(),
                fee_amount: feeAmount || '0.00',
                status: initialStatus
            });

            toast.success('Walk-in clearance recorded successfully!');
            await fetchRequests();

            setIsCreateModalOpen(false);
            setWalkinName('');
            setWalkinPurok('');
            setNewPurpose('');
            setOrNumber('');
            setFeeAmount('50.00');
            setInitialStatus('RELEASED');
        } catch (err: any) {
            console.error("Failed to create walk-in clearance.", err);
            toast.error(err.response?.data?.walkin_name || 'Failed to record walk-in clearance.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-4 md:p-8"><TableSkeleton /></div>;
    if (error) return <div className="p-8 text-red-600">{error}</div>;

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clearance Desk & Document Requests</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage online applications and issue walk-in certifications.</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-[#0047BA] hover:bg-[#003882] active:bg-[#002D6B] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    <span>+</span> Request Walk-in 
                </button>
            </div>

            <DocumentTable 
                requests={requests}
                openModal={openModal}
                getStatusBadge={getStatusBadge}
                onDelete={handleDeleteRequest}
            />

            {isModalOpen && selectedRequest && (
                <ReviewDocumentModal
                    selectedRequest={selectedRequest}
                    closeModal={closeModal}
                    getStatusBadge={getStatusBadge}
                    handleStatusUpdate={handleStatusUpdate}
                    isUpdating={isUpdating}
                    handleDownloadPDF={handleDownloadPDF}
                />
            )}

            {/* Log Walk-in Clearance Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Issue Walk-in Clearance</h3>
                                <p className="text-xs text-slate-500">Record in-person resident certification and fee receipt.</p>
                            </div>
                            <button 
                                onClick={() => setIsCreateModalOpen(false)} 
                                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
                            >
                                <span className="text-2xl leading-none">&times;</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateWalkinRequest} className="p-6 space-y-4 bg-white">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Resident Full Name *</label>
                                    <input 
                                        type="text"
                                        required
                                        value={walkinName}
                                        onChange={(e) => setWalkinName(e.target.value)}
                                        placeholder="e.g. Maria Santos"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Purok / Zone</label>
                                    <input 
                                        type="text"
                                        value={walkinPurok}
                                        onChange={(e) => setWalkinPurok(e.target.value)}
                                        placeholder="e.g. Purok Maligaya"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Document Type</label>
                                <select 
                                    value={newDocType}
                                    onChange={(e) => {
                                        const doc = e.target.value;
                                        setNewDocType(doc);
                                        if (doc === 'Certificate of Indigency') setFeeAmount('0.00');
                                        else if (doc === 'Business Permit') setFeeAmount('200.00');
                                        else setFeeAmount('50.00');
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                                >
                                    <option value="Barangay Clearance">Barangay Clearance</option>
                                    <option value="Certificate of Indigency">Certificate of Indigency</option>
                                    <option value="Business Permit">Business Permit</option>
                                    <option value="Proof of Residency">Proof of Residency</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Purpose Statement *</label>
                                <textarea 
                                    required
                                    value={newPurpose}
                                    onChange={(e) => setNewPurpose(e.target.value)}
                                    rows={2}
                                    placeholder="e.g. Employment requirement, Bank account opening, Scholarship..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                />
                            </div>

                            {/* Assessment / Treasury Section */}
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">O.R. Number</label>
                                    <input 
                                        type="text"
                                        value={orNumber}
                                        onChange={(e) => setOrNumber(e.target.value)}
                                        placeholder="e.g. OR-5491"
                                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount Paid (PHP)</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        value={feeAmount}
                                        onChange={(e) => setFeeAmount(e.target.value)}
                                        placeholder="50.00"
                                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Status</label>
                                <select 
                                    value={initialStatus}
                                    onChange={(e) => setInitialStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                                >
                                    <option value="RELEASED">Released (Issued Immediately)</option>
                                    <option value="PROCESSING">Processing (Pending Signatures)</option>
                                    <option value="PENDING">Pending</option>
                                </select>
                            </div>
                            
                            <div className="pt-3 flex justify-end gap-2.5">
                                <button 
                                    type="button" 
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="px-5 py-2 text-sm font-bold text-white bg-[#0047BA] hover:bg-[#003882] rounded-xl transition-all shadow-sm disabled:opacity-70 cursor-pointer"
                                >
                                    {isSubmitting ? 'Recording...' : 'Record & Print Clearance'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};