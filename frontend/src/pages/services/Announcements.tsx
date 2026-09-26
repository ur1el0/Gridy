import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import { axiosPrivate } from '../../api/axios';
import { Pin, Megaphone, Plus, X, Trash, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Announcement {
    id: number;
    title: string;
    content: string;
    image?: string | null;
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
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

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
            setAnnouncements(prev => prev.filter(a => a.id !== id));
            toast.success('Announcement deleted.');
        } catch (err) {
            console.error("Failed to delete announcement", err);
            toast.error('Failed to delete announcement.');
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload a valid image file (PNG, JPG, WebP).');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size cannot exceed 5MB.');
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
            setImagePreview(null);
        }
    };

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('content', content.trim());
            formData.append('is_pinned', String(isPinned));
            if (imageFile) {
                formData.append('image', imageFile);
            }

            await axiosPrivate.post('/announcements/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Announcement broadcasted successfully!');
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
        handleRemoveImage();
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
            {/* Header Row */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-2xs border border-slate-100">
                <div className="flex items-center gap-2 text-slate-700">
                    <Megaphone className="w-5 h-5 text-primary-text" />
                    <span className="font-semibold text-sm">Active Broadcasts</span>
                </div>
                {user?.role === 'ADMIN' && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
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
                        <div key={ann.id} className="group bg-white rounded-2xl shadow-2xs border border-slate-100 overflow-hidden hover:shadow-md transition-all flex flex-col">
                            {/* Attached Banner Image if present */}
                            {ann.image && (
                                <div className="h-44 w-full overflow-hidden bg-slate-100 border-b border-slate-100 relative">
                                    <img 
                                        src={ann.image} 
                                        alt={ann.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                    />
                                </div>
                            )}

                            {/* Card Header */}
                            <div className={`px-5 py-3 border-b flex justify-between items-center ${ann.is_pinned ? 'bg-amber-50/70 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex items-center gap-2">
                                    {ann.is_pinned ? (
                                        <Pin className="w-4 h-4 text-amber-600 fill-amber-600" />
                                    ) : (
                                        <Megaphone className="w-4 h-4 text-slate-400" />
                                    )}
                                    <span className={`text-xs font-bold uppercase tracking-wider ${ann.is_pinned ? 'text-amber-800' : 'text-slate-500'}`}>
                                        {ann.is_pinned ? 'Pinned Broadcast' : 'Standard Broadcast'}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-400 font-medium">
                                    {new Date(ann.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-slate-900 text-base mb-2 group-hover:text-primary-text transition-colors leading-snug">
                                        {ann.title}
                                    </h4>
                                    <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                                        {ann.content}
                                    </p>
                                </div>

                                {user?.role === 'ADMIN' && (
                                    <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
                                        <button 
                                            onClick={() => handleDelete(ann.id)}
                                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                            title="Delete broadcast"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Announcement Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-primary-text" />
                                Broadcast Announcement
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200 cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreate} className="p-6 space-y-4 bg-white">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Headline</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)} 
                                    placeholder="e.g., Scheduled Power Interruption"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-sm outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Full Content</label>
                                <textarea 
                                    required 
                                    rows={4} 
                                    value={content} 
                                    onChange={e => setContent(e.target.value)} 
                                    placeholder="Write the full details of the announcement here..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-sm outline-none transition-all resize-none"
                                />
                            </div>

                            {/* Image Upload Area */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Attached Image / Banner (Optional)</label>
                                {imagePreview ? (
                                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-48 group">
                                        <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute top-2 right-2 p-1.5 bg-slate-900/70 hover:bg-rose-600 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
                                            title="Remove image"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-primary rounded-xl p-4 bg-slate-50 hover:bg-primary/5 cursor-pointer transition-all">
                                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                                        <span className="text-xs font-semibold text-slate-700">Click to upload banner or photo</span>
                                        <span className="text-[11px] text-slate-400">PNG, JPG, or WEBP up to 5MB</span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleImageChange} 
                                            className="hidden" 
                                        />
                                    </label>
                                )}
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center h-5">
                                    <input 
                                        id="is_pinned" 
                                        type="checkbox" 
                                        checked={isPinned} 
                                        onChange={e => setIsPinned(e.target.checked)} 
                                        className="h-4 w-4 text-primary-text focus:ring-primary border-slate-300 rounded cursor-pointer"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="is_pinned" className="text-xs font-bold text-slate-900 cursor-pointer">Pin to top</label>
                                    <span className="text-[11px] text-slate-500">Pinned broadcasts will always appear first.</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting} 
                                    className="px-5 py-2 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary-hover transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-xs cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Broadcasting...</>
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