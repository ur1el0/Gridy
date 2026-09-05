import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import { axiosPrivate } from '../../api/axios';
import { DocumentTable } from '../../components/documents/DocumentTable';
import { ReviewDocumentModal } from '../../components/documents/ReviewDocumentModal';

export interface DocumentRequest {
  id: number;
  request_id?: number;
  requester_name?: string;
  document_type: string;
  purpose?: string;
  urgency_tag?: 'REGULAR' | 'URGENT';
  status: string;
  admin_notes?: string;
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
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newDocType, setNewDocType] = useState('Barangay Clearance')
  const [newPurpose, setNewPurpose] = useState('')

  useEffect(() => {
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
    fetchRequests();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': 
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': 
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready_for_pickup': 
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'released': 
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected': 
        return 'bg-red-100 text-red-800 border-red-200';
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

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedRequest) return
    setIsUpdating(true)

    try {
      // Send the status update to Django's custom validate endpoint
      await axiosPrivate.patch(`/document-requests/${selectedRequest.id}/validate/`, {
        status: newStatus
      })

      // Instantly update the local UI tbale without reloading the page
      setRequests(prev => prev.map(req =>
        req.id === selectedRequest.id ? {...req, status: newStatus} : req
      ))
      closeModal()
    } catch(err) {
      console.error("Failed to update status", err)
      toast.error('Failed to update status. Please check permissions or try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!selectedRequest) return
    try {
      const response = await axiosPrivate.get(`/document-requests/${selectedRequest.id}/generate-pdf/`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${selectedRequest.document_type.replace(/ /g, '_')}${selectedRequest.id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
    } catch (error) {
      console.error("Failed to download PDF", error)
      toast.error('Failed to generate PDF. Make sure the document is not pending or rejected.')
    }
  }

  const handleCreateRequest = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await axiosPrivate.post('/document-requests/', {
        document_type: newDocType,
        purpose: newPurpose
      })
      // Fetch fresh data from server to update the table
      const response = await axiosPrivate.get('/document-requests/')
      setRequests(response.data.results || response.data)

      setIsCreateModalOpen(false)
      setNewDocType('Barangay-Clearance')
      setNewPurpose('')
    } catch (err) {
      console.error("Failed to create request.", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="p-4 md:p-8"><TableSkeleton /></div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Document Requests</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#0047BA] hover:bg-[#003882] active:bg-[#002D6B] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          New Request
        </button>
      </div>

      <DocumentTable 
        requests={requests}
        openModal={openModal}
        getStatusBadge={getStatusBadge}
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

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Log Walk-in Request</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateRequest} className="p-6 space-y-4 bg-white">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Document Type</label>
                <select 
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="Barangay Clearance">Barangay Clearance</option>
                  <option value="Certificate of Indigency">Certificate of Indigency</option>
                  <option value="Business Permit">Business Permit</option>
                  <option value="Proof of Residency">Proof of Residency</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Purpose</label>
                <textarea 
                  required
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  rows={3}
                  placeholder="e.g., For employment purposes..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-sm disabled:opacity-70"
                >
                  {isSubmitting ? 'Saving...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
