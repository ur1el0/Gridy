import React, { useEffect, useState } from 'react';
import { axiosPrivate } from '../api/axios';

interface DocumentRequest {
  id: number;
  document_type: string;
  purpose: string;
  status: string;
  created_at: string;
}

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
      alert("Failed to update status. Please check permissions or try again.")
    } finally {
      setIsUpdating(false)
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
      console.error("Failed to create request.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-slate-600">Loading requests...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Document Requests</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          New Request
        </button>
      </div>

      <div className="bg-surface shadow-sm border border-border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Purpose</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">No requests found.</td>
              </tr>
            ) : (
              requests.map((req, index) => (
                <tr key={req.id || index} onClick={() => openModal(req)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">#{req.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{req.document_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{req.purpose}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(req.status)}`}>
                      {req.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={closeModal} />
            
            <div className="fixed inset-y-0 right-0 max-w-md w-full flex">
              <div className="w-full h-full bg-white shadow-xl flex flex-col">
                
                <div className="px-6 py-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <h3 className="text-lg font-medium text-slate-900">Request #{selectedRequest.id} Details</h3>
                  <button onClick={closeModal} className="text-slate-400 hover:text-slate-500">
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>

                <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">Document Type</h4>
                    <p className="mt-1 text-sm text-slate-900 font-semibold">{selectedRequest.document_type}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">Purpose</h4>
                    <p className="mt-1 text-sm text-slate-900 bg-slate-50 p-3 rounded-md border border-slate-200">{selectedRequest.purpose}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">Date Requested</h4>
                    <p className="mt-1 text-sm text-slate-900">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2">Current Status</h4>
                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full border ${getStatusBadge(selectedRequest.status)}`}>
                      {selectedRequest.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
                  <button 
                    onClick={closeModal} 
                    className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
                  >
                    Close
                  </button>
                  
                  {/* 1. Pending Actions */}
                  {selectedRequest.status.toLowerCase() === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleStatusUpdate('REJECTED')}
                        disabled={isUpdating}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate('PROCESSING')}
                        disabled={isUpdating}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isUpdating ? 'Updating...' : 'Start Processing'}
                      </button>
                    </>
                  )}

                  {/* 2. Processing Actions */}
                  {selectedRequest.status.toLowerCase() === 'processing' && (
                    <button 
                      onClick={() => handleStatusUpdate('READY_FOR_PICKUP')}
                      disabled={isUpdating}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      {isUpdating ? 'Updating...' : 'Mark Ready for Pickup'}
                    </button>
                  )}

                  {/* 3. Ready for Pickup Actions */}
                  {selectedRequest.status.toLowerCase() === 'ready_for_pickup' && (
                    <button 
                      onClick={() => handleStatusUpdate('RELEASED')}
                      disabled={isUpdating}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {isUpdating ? 'Updating...' : 'Release to Resident'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
            {/* Create Request Modal */}
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
