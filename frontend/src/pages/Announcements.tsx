import React, { useEffect, useState } from 'react';
import { axiosPrivate } from '../api/axios';
import { Megaphone, Pin, Plus } from 'lucide-react';

interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

export const Announcements: React.FC = () => {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await axiosPrivate.get('/announcements/');
      const list = res.data.results || res.data || [];
      setItems(list);
    } catch (err: any) {
      setError('Failed to fetch announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosPrivate.post('/announcements/', {
        title,
        content,
        is_pinned: isPinned
      });
      setShowModal(false);
      setTitle('');
      setContent('');
      setIsPinned(false);
      fetchAnnouncements();
    } catch (err: any) {
      setError('Failed to post announcement.');
    }
  };

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Barangay Announcements</h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Broadcast official notices, advisories, and public updates to residents.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0047BA] hover:bg-[#003693] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading announcements...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
          No active announcements.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl p-6 border shadow-xs transition-all ${
                item.is_pinned ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                </div>
                {item.is_pinned && (
                  <span className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                    <Pin className="w-3.5 h-3.5" /> PINNED
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 mt-3 whitespace-pre-line leading-relaxed">{item.content}</p>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
                Posted on {new Date(item.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Post Announcement</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                  placeholder="e.g. Scheduled Power Interruption"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Content</label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600"
                  placeholder="Details of the announcement..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pin"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="pin" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Pin this announcement to top
                </label>
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
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
