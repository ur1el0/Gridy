import type { DocumentRequest } from '../../pages/services/DocumentRequests';

interface DocumentTableProps {
  requests: DocumentRequest[];
  openModal: (request: DocumentRequest) => void;
  getStatusBadge: (status: string) => string;
}

export const DocumentTable = ({ requests, openModal, getStatusBadge }: DocumentTableProps) => {
  return (
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
  );
};
