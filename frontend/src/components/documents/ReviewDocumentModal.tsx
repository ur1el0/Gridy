import React from 'react';

export const ReviewDocumentModal = ({ selectedRequest, closeModal, getStatusBadge, handleStatusUpdate, isUpdating, handleDownloadPDF }) => {
  if (!selectedRequest) return null;
  return (
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
              
              {['processing', 'ready_for_pickup', 'released'].includes(selectedRequest.status.toLowerCase()) && (
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  Download PDF
                </button>
              )}
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
                    Approve Request
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
                  Mark Ready for Pickup
                </button>
              )}

              {/* 3. Ready for Pickup Actions */}
              {selectedRequest.status.toLowerCase() === 'ready_for_pickup' && (
                <button 
                  onClick={() => handleStatusUpdate('RELEASED')}
                  disabled={isUpdating}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  Mark as Released
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
