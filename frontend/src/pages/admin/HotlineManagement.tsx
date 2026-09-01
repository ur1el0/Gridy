import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { axiosPrivate } from '../../api/axios'
import { Phone, Plus, Trash2 } from 'lucide-react'

interface Hotline {
  id: number
  name: string
  number: string
  category: string
  category_display: string
  is_active: boolean
}

const CATEGORIES = ['POLICE', 'FIRE', 'MEDICAL', 'BARANGAY', 'OTHER']

const getCategoryBadge = (category: string) => {
  switch (category) {
    case 'POLICE': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'FIRE': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'MEDICAL': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'BARANGAY': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export const HotlineManagement: React.FC = () => {
  const [hotlines, setHotlines] = useState<Hotline[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', number: '', category: 'OTHER' })

  const fetchHotlines = async () => {
    try {
      const res = await axiosPrivate.get('/communications/hotlines/')
      setHotlines(res.data.results || res.data)
    } catch {
      toast.error('Failed to load hotlines.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHotlines() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await axiosPrivate.post('/communications/hotlines/', form)
      setHotlines(prev => [...prev, res.data])
      setIsModalOpen(false)
      setForm({ name: '', number: '', category: 'OTHER' })
      toast.success('Hotline added successfully.')
    } catch {
      toast.error('Failed to add hotline.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this hotline?')) return
    try {
      await axiosPrivate.delete(`/communications/hotlines/${id}/`)
      setHotlines(prev => prev.filter(h => h.id !== id))
      toast.success('Hotline removed.')
    } catch {
      toast.error('Failed to delete hotline.')
    }
  }

  if (loading) return <div className="p-8 text-slate-500">Loading hotlines...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Emergency Hotlines</h1>
          <p className="text-slate-500 mt-1">Manage emergency contacts visible to residents.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#0047BA] hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Hotline
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {hotlines.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">No hotlines added yet.</td>
              </tr>
            ) : (
              hotlines.map(h => (
                <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-slate-400" />
                      <span className="text-sm font-semibold text-slate-900">{h.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-mono">{h.number}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getCategoryBadge(h.category)}`}>
                      {h.category_display}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="text-rose-500 hover:text-rose-700 transition-colors"
                      aria-label="Delete hotline"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Hotline Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Add Emergency Hotline</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Philippine National Police"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Number</label>
                <input
                  required
                  value={form.number}
                  onChange={e => setForm(p => ({ ...p, number: e.target.value }))}
                  placeholder="e.g. 117 or 0912-345-6789"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#0047BA] hover:bg-blue-800 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? 'Adding...' : 'Add Hotline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}