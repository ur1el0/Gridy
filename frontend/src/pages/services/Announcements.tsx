import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import { axiosPrivate } from '../../api/axios';
import { Pin, Megaphone, Plus, X, Trash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Announcement {
    id: number;
    title: string;
    content: string;
    is_pinned: boolean;
    created_at: string;
}

const CardSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-pulse flex flex-col h-[200px]">
    <div className="p-5 flex-1">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
        <div className="w-16 h-5 bg-slate-200 rounded-full"></div>
      </div>
      <div className="h-5 w-3/4 bg-slate-200 rounded mb-3"></div>
      <div className="h-4 w-full bg-slate-100 rounded mb-2"></div>
      <div className="h-4 w-2/3 bg-slate-100 rounded"></div>
    </div>
  </div>
);


export const Announcements: React.FC = () => {
    const { user } = useAuth()
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const response = await axiosPrivate.get('/announcements/');
            setAnnouncements(response.data.results || response.data);
        } catch (err) {
            setError('Failed to load announcements.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to permanently delete this announcement?")) return;
        try {
            await axiosPrivate.delete(`/announcements/${id}/`);
            // Instantly remove it from the UI without reloading the page
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error("Failed to delete announcement", err);
            toast.error('Failed to delete announcement.');
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axiosPrivate.post('/announcements/', {
                title,
                content,
                is_pinned: isPinned
            });
            await fetchAnnouncements();
            closeModal();
        } catch (err) {
            console.error('Failed to create announcement.', err);
            toast.error('Failed to create announcement.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTitle('');
        setContent('');
        setIsPinned(false);
    };

    if (loading && announcements.length === 0) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
            </div>
        );
    }
    
    if (error) return <div className="p-8 text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>;

    return (
        <div className="space-y-6 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Action Row */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 text-slate-700">
                    <Megaphone className="w-5 h-5 text-[#0047BA]" />
                    <span className="font-semibold text-sm">Active Broadcasts</span>
                </div>
                {user?.role === 'ADMIN' && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-[#0047BA] hover:bg-[#003894] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        New Announcement
                    </button>
                )}
            </div>
                
            {/* Announcements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {announcements.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-100 border-dashed">
                        No announcements active right now.
                    </div>
                ) : (
                    announcements.map((ann) => (
                        <div key={ann.id} className="group bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all flex flex-col">
                            {/* Card Header */}
                            <div className={`px-5 py-3 border-b flex justify-between items-center ${ann.is_pinned ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex items-center gap-2">
                                    {ann.is_pinned ? (
                                        <Pin className="w-4 h-4 text-amber-600 fill-amber-600" />
                                    ) : (
                                        <Megaphone className="w-4 h-4 text-slate-400" />
                                    )}
                                    <span className={`text-xs font-bold uppercase tracking-wider ${ann.is_pinned ? 'text-amber-700' : 'text-slate-500'}`}>
                                        {ann.is_pinned ? 'Pinned' : 'Standard'}
                                    </span>
                                </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-slate-400">
                                    {new Date(ann.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                                {user?.role === 'ADMIN' && (
                                    <button 
                                        onClick={() => handleDelete(ann.id)}
                                        className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                                        title="Delete Announcement"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            </div>
                            
                            {/* Card Body */}
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="text-base font-bold text-slate-900 leading-tight mb-2 group-hover:text-[#0047BA] transition-colors">{ann.title}</h3>
                                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed flex-1">{ann.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modern Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" onClick={closeModal} />

                    <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-[#0047BA]" />
                                Broadcast Announcement
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreate} className="p-6 space-y-5 bg-white">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Headline</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)} 
                                    placeholder="e.g., Scheduled Power Interruption"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0047BA] focus:ring-2 focus:ring-[#0047BA]/20 rounded-xl text-sm outline-none transition-all" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Content</label>
                                <textarea 
                                    required 
                                    rows={4} 
                                    value={content} 
                                    onChange={e => setContent(e.target.value)} 
                                    placeholder="Write the full details of the announcement here..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#0047BA] focus:ring-2 focus:ring-[#0047BA]/20 rounded-xl text-sm outline-none transition-all resize-none" 
                                />
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center h-5">
                                    <input 
                                        id="is_pinned" 
                                        type="checkbox" 
                                        checked={isPinned} 
                                        onChange={e => setIsPinned(e.target.checked)} 
                                        className="h-4 w-4 text-[#0047BA] focus:ring-[#0047BA] border-slate-300 rounded cursor-pointer" 
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="is_pinned" className="text-sm font-semibold text-slate-900 cursor-pointer">Pin to top</label>
                                    <span className="text-xs text-slate-500">Pinned broadcasts will always appear first.</span>
                                </div>
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
                                        <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Sending...</>
                                    ) : 'Broadcast Now'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
