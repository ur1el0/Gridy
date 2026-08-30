import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react'
import { axiosPrivate } from '../../api/axios'

interface IssueReport {
    id: number
    title: string
    description: string
    location: string
    status: string
    urgency: string
    image: string | null
    created_at: string
}

export const AdminIssueManagement: React.FC = () => {
    const [reports, setReports] = useState<IssueReport[]>([])
    const [loading, setLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState<number | null>(null)

    const fetchReports = async () => {
        try {
            const response = await axiosPrivate.get('/reports/')
            setReports(response.data.results || response.data)
        } catch (err) {
            console.error("Failed to fetch reports", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReports()
    }, [])

    const handleUpdate = async (id: number, field: 'status' | 'urgency', value: string) => {
        setUpdatingId(id)
        try {
            await axiosPrivate.patch(`/reports/${id}/`, { [field]: value})
            setReports(prev => prev.map(report => report.id === id ? { ...report, [field]: value } : report))
        } catch (err) {
            console.error(`Failed to updat ${field}`, err)
            toast.error(`Failed to update ${field}. Please try again`)
        } finally {
            setUpdatingId(null)
        }
    }

    const getUrgencyBadge = (urgency: string) => {
        switch (urgency.toUpperCase()) {
      case 'MINOR': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HAZARD': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'EMERGENCY': return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading issues...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Issue Triage</h1>
          <p className="text-slate-500 mt-1">Review and manage community reports.</p>
        </div>
      </div>
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Issue</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Urgency</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Photo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">No issues reported.</td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">{report.title}</div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-1">{report.description}</div>
                      <div className="text-xs text-slate-400 mt-1">{new Date(report.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {report.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* Urgency Dropdown */}
                      <select 
                        value={report.urgency}
                        disabled={updatingId === report.id}
                        onChange={(e) => handleUpdate(report.id, 'urgency', e.target.value)}
                        className={`text-xs font-bold rounded-full px-3 py-1 border focus:ring-primary focus:border-primary cursor-pointer ${getUrgencyBadge(report.urgency)}`}
                      >
                        <option value="MINOR">MINOR</option>
                        <option value="MODERATE">MODERATE</option>
                        <option value="HAZARD">HAZARD</option>
                        <option value="EMERGENCY">EMERGENCY</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {/* Status Dropdown */}
                      <select 
                        value={report.status}
                        disabled={updatingId === report.id}
                        onChange={(e) => handleUpdate(report.id, 'status', e.target.value)}
                        className="text-xs font-bold rounded-md px-3 py-1 border border-slate-300 text-slate-700 bg-white focus:ring-primary focus:border-primary cursor-pointer"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.image ? (
                        <a href={report.image} target="_blank" rel="noreferrer" className="text-primary hover:text-primary-hover text-sm font-medium">
                          View Image
                        </a>
                      ) : (
                        <span className="text-slate-400 text-sm">None</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}