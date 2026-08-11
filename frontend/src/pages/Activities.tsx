import React, { useEffect, useState } from 'react';
import { axiosPrivate } from '../api/axios';

interface Activity {
  id: number;
  title: string;
  description: string;
  location: string;
  event_datetime: string;
  created_at: string;
}

export const Activities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await axiosPrivate.get('/activities/');
      setActivities(response.data.results || response.data);
    } catch (err) {
      setError('Failed to load activities.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Convert the local datetime string to ISO format for Django
      const isoDate = new Date(eventDate).toISOString();
      
      await axiosPrivate.post('/activities/', {
        title,
        description,
        location,
        event_datetime: isoDate
      });
      await fetchActivities();
      closeModal();
    } catch (err) {
      console.error("Failed to create activity", err);
      alert("Failed to create activity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
    setLocation('');
    setEventDate('');
  };

  if (loading && activities.length === 0) return <div className="p-8 text-slate-600">Loading activities...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Activity Schedules</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          New Activity
        </button>
      </div>

      <div className="bg-surface shadow-sm border border-border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Event Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Event Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border">
            {activities.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500">No activities found.</td></tr>
            ) : (
              activities.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">#{act.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    <div className="font-semibold text-slate-900">{act.title}</div>
                    <div className="text-slate-500 line-clamp-1 mt-1">{act.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{act.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {new Date(act.event_datetime).toLocaleString()}
                    </span>
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
            <h3 className="text-xl font-bold text-slate-900 mb-5">Schedule Activity</h3>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input type="text" required value={location} onChange={e => setLocation(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Event Date & Time</label>
                <input type="datetime-local" required value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-md text-sm font-medium bg-white">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 border rounded-md text-sm font-medium text-white bg-primary">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
