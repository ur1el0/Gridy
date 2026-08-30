import React, { useEffect, useState } from "react";
import { axiosPrivate } from "../../api/axios";
import toast from 'react-hot-toast';

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

const CardSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse space-y-3">
    <div className="h-5 w-2/3 bg-slate-200 rounded"></div>
    <div className="h-4 w-full bg-slate-100 rounded"></div>
    <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
    <div className="h-6 w-20 bg-slate-200 rounded-full mt-2"></div>
  </div>
);

export const ResidentIssueReports: React.FC = () => {
    const [reports, setReports] = useState<IssueReport[]>([])
    const [loading, setLoading] = useState(true)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [location, setLocation] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)

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

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Because we are uploading a file, we MUST use FormData instead of a standard JSON object
        const formData = new FormData()
        formData.append('title', title)
        formData.append('description', description)
        formData.append('location', location)
        if (imageFile) {
            formData.append('image', imageFile)
        }

        try {
            await axiosPrivate.post('/reports/', formData, {
                headers: { 'Content-Type': 'multipart/form-data'}
            })

            setTitle('')
            setDescription('')
            setLocation('')
            setImageFile(null)
            toast.success('Issue reported successfully! It has been submitted for review.')
            fetchReports()
        } catch (err) {
            console.error("Failed to submit report", err)
            toast.error("Failed to submit report. Please check your connection and try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
        case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
            case 'RESOLVED': return 'bg-emerald-100 text-emerald-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Community Issues</h1>
        <p className="text-slate-500 mt-1">Report community hazards, infrastructure problems, or emergencies directly to the Barangay.</p>
      </div>
      {/* --- FORM SECTION --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">Submit a New Report</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Issue Title</label>
              <input 
                type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep Pothole on Rizal St."
                className="w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location / Landmark</label>
              <input 
                type="text" required value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="Near the old church"
                className="w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 border"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Description</label>
            <textarea 
              required rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Photo Evidence (Optional)</label>
            <input 
              type="file" accept="image/*"
              onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover transition-colors"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button 
              type="submit" disabled={isSubmitting}
              className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-md text-sm font-medium transition-all shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
      {/* --- HISTORY SECTION --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">Your Report History</h2>
        </div>
        
        {loading ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-slate-500">You haven't submitted any reports yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {reports.map((report) => (
              <li key={report.id} className="p-6 hover:bg-slate-50 transition-colors flex items-start space-x-4">
                {report.image ? (
                  <img src={report.image} alt="Report" className="h-16 w-16 object-cover rounded-md border border-slate-200" />
                ) : (
                  <div className="h-16 w-16 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 text-xs">No Photo</div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">{report.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(report.status)}`}>
                      {report.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">{report.description}</p>
                  <div className="mt-2 text-xs text-slate-400 flex space-x-3">
                    <span>{report.location}</span>
                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
