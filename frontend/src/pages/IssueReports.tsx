import React, { useEffect, useState } from 'react';
import { axiosPrivate } from '../api/axios';
import { Clock, MapPin, Plus } from 'lucide-react';

interface IssueReportItem {
  id: number;
  title: string;
  description: string;
  location: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  created_at: string;
}

export const IssueReports: React.FC = () => {
  const [reports, setReports] = useState<IssueReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('LOW');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axiosPrivate.get('/reports/');
      const list = res.data.results || res.data || [];
      setReports(list);
    } catch (err: any) {
      setError('Failed to load issue reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosPrivate.post('/reports/', {
        title,
        description,
        location,
        urgency
      });
      setShowModal(false);
      setTitle('');
      setDescription('');
      setLocation('');
      setUrgency('LOW');
      fetchReports();
    } catch (err: any) {
      setError('Failed to report issue.');
    }
  };

  const getUrgencyBadge = (u: string) => {
    switch (u) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 font-bold';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 font-semibold';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 font-medium';
      default:
        return 'bg-slate-100 text-slate-700 font-medium';
    }
  };

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Community Issue Reports</h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Track and manage incidents, infrastructure reports, and community maintenance.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0047BA] hover:bg-[#003693] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Issue</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading issue reports...</div>
      ) : reports.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
          No issue reports found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${getUrgencyBadge(r.urgency)}`}>
                    {r.urgency} URGENCY
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{r.title}</h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{r.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {r.location}
                </span>
                <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Report an Issue</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                  placeholder="e.g. Broken Streetlight"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                  placeholder="e.g. Zone 4, Corner Main St."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Urgency</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                  placeholder="Describe the details..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0047BA] hover:bg-[#003693] rounded-xl"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
