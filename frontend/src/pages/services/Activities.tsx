import React, { useEffect, useState } from 'react';
import { axiosPrivate } from '../../api/axios';
import { Calendar, MapPin, Clock, Plus, X } from 'lucide-react';

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
      alert("Failed to schedule activity.");
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

  if (loading && activities.length === 0) return <div className="p-8 text-slate-500 flex items-center gap-2"><div className="w-4 h-4 border-2 border-[#0047BA] border-t-transparent rounded-full animate-spin"></div> Loading...</div>;
  if (error) return <div className="p-8 text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>;

  return (
    <div className="space-y-6 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header / Action Row */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 text-slate-700">
          <Calendar className="w-5 h-5 text-[#0047BA]" />
          <span className="font-semibold text-sm">Upcoming Schedules</span>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#0047BA] hover:bg-[#003894] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Schedule Activity
        </button>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {activities.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-100 border-dashed">
            No upcoming activities scheduled.
          </div>
        ) : (
          activities.map((act) => {
            const eventDateObj = new Date(act.event_datetime);
            return (
              <div key={act.id} className="group bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all flex flex-col sm:flex-row">
                
                {/* Date Highlight Box */}
                <div className="bg-[#E3EDFD] border-r border-slate-100 p-5 flex flex-col items-center justify-center min-w-[100px] shrink-0 text-center">
                  <span className="text-xs font-bold text-[#0047BA] uppercase tracking-widest mb-1">
                    {eventDateObj.toLocaleDateString(undefined, { month: 'short' })}
                  </span>
                  <span className="text-3xl font-black text-[#0f172a] leading-none mb-1">
                    {eventDateObj.getDate()}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {eventDateObj.toLocaleDateString(undefined, { weekday: 'short' })}
                  </span>
                </div>

                {/* Details Section */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2 group-hover:text-[#0047BA] transition-colors">
                      {act.title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
                      {act.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {eventDateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {act.location}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modern Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" onClick={closeModal} />
          
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#0047BA]" />
                    Schedule Activity
                </h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-5 bg-white">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Event Title</label>
                <input 
                  type="text" 
                  required 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g., Barangay Assembly"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0047BA] focus:ring-2 focus:ring-[#0047BA]/20 rounded-xl text-sm outline-none transition-all" 
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      required 
                      value={location} 
                      onChange={e => setLocation(e.target.value)} 
                      placeholder="Covered Court"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0047BA] focus:ring-2 focus:ring-[#0047BA]/20 rounded-xl text-sm outline-none transition-all" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date & Time</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={eventDate} 
                    onChange={e => setEventDate(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0047BA] focus:ring-2 focus:ring-[#0047BA]/20 rounded-xl text-sm outline-none transition-all cursor-pointer" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea 
                  required 
                  rows={3} 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Details about the event..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#0047BA] focus:ring-2 focus:ring-[#0047BA]/20 rounded-xl text-sm outline-none transition-all resize-none" 
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0047BA] hover:bg-[#003894] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                >
                  {isSubmitting ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Scheduling...</>
                  ) : 'Schedule Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
