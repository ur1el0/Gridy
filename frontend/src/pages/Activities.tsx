import React, { useEffect, useState } from 'react';
import { axiosPrivate } from '../api/axios';
import { Calendar, MapPin, Plus } from 'lucide-react';

interface ActivityItem {
  id: number;
  title: string;
  description: string;
  event_datetime: string;
  location: string;
  created_at: string;
}

export const Activities: React.FC = () => {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDatetime, setEventDatetime] = useState('');
  const [location, setLocation] = useState('');

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await axiosPrivate.get('/activities/');
      const list = res.data.results || res.data || [];
      setItems(list);
    } catch (err: any) {
      setError('Failed to fetch activity schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosPrivate.post('/activities/', {
        title,
        description,
        event_datetime: new Date(eventDatetime).toISOString(),
        location
      });
      setShowModal(false);
      setTitle('');
      setDescription('');
      setEventDatetime('');
      setLocation('');
      fetchActivities();
    } catch (err: any) {
      setError('Failed to schedule activity.');
    }
  };

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Barangay Activity Schedule</h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Manage upcoming community events, health programs, and barangay assemblies.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0047BA] hover:bg-[#003693] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Activity</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading activity schedule...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
          No scheduled activities found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl w-fit mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(item.event_datetime).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{item.location}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Schedule Activity</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                  placeholder="e.g. Free Medical Mission"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={eventDatetime}
                  onChange={(e) => setEventDatetime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
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
                  placeholder="e.g. Barangay Covered Court"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                  placeholder="Activity details..."
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
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
