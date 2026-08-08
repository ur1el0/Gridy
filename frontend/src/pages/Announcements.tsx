import React, { useEffect, useState } from 'react'
import { axiosPrivate } from '../api/axios'

interface Announcement {
    id: number;
    title: string;
    content: string;
    is_pinned: boolean;
    created_at: string;
}

export const Announcements: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [loading, setLoading] = useState(null)
    const [error, setError] = useState('')

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting ] =useState(false)
    const [title, setTitle] = useState('')
    const [content, setContent] =useState('')
    const [isPinned, setIsPinned] = useState(false)

    const fetchAnnouncements = async () => {
        setLoading(true)
        try {
            const response = await axiosPrivate.get('/announcements')
            setAnnouncements(response.data.results || response.data)
        } catch (err) {
            setError('Failed to load announcements.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAnnouncements()
    }, [])

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await axiosPrivate.post('/announcements/', {
                title,
                content,
                is_pinned: isPinned
            })
            await fetchAnnouncements()
            closeModal()
        } catch (err) {
            console.error('Failed to create annoncement.', err)
            alert('Failed to create announcement.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setTitle('')
        setContent('')
        setIsPinned(false)
    }

    if (loading && announcements.length === 0) return <div className="p-8 text-slate-600">Loading...</div>
    if (error) return <div className='p-8 text-red-600'>{error}</div>

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Announcements</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          New Announcement
        </button>
      </div>
      <div className="bg-surface shadow-sm border border-border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border">
            {announcements.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500">No announcements found.</td></tr>
            ) : (
              announcements.map((ann) => (
                <tr key={ann.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">#{ann.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                      ann.is_pinned ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      {ann.is_pinned ? 'Pinned' : 'Standard'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    <div className="font-semibold text-slate-900">{ann.title}</div>
                    <div className="text-slate-500 line-clamp-1 mt-1">{ann.content}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={closeModal} />
          
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6 flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 mb-5">Broadcast Announcement</h3>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                <textarea required rows={4} value={content} onChange={e => setContent(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
              </div>
              <div className="flex items-center">
                <input id="is_pinned" type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="h-4 w-4 text-primary" />
                <label htmlFor="is_pinned" className="ml-2 text-sm font-medium text-slate-900">Pin Announcement</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-md text-sm font-medium bg-white">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 border rounded-md text-sm font-medium text-white bg-primary">Broadcast</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
