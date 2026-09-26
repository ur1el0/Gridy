import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { axiosPrivate } from '../../api/axios';
import { 
    AlertTriangle, 
    Plus, 
    Clock, 
    MapPin, 
    CheckCircle2, 
    Camera, 
    X, 
    ShieldAlert
} from 'lucide-react';

interface IssueReport {
    id: number;
    title: string;
    description: string;
    location: string;
    category: string;
    category_display?: string;
    urgency: string;
    status: string;
    image?: string;
    created_at: string;
}

const CATEGORIES = [
    { value: 'INFRASTRUCTURE', label: 'Infrastructure (Potholes, Outages)' },
    { value: 'PEACE_AND_ORDER', label: 'Peace & Order (Noise, Disturbances)' },
    { value: 'PUBLIC_HEALTH', label: 'Public Health & Sanitation' },
    { value: 'ENVIRONMENT', label: 'Environment (Floods, Waste, Hazards)' },
    { value: 'OTHER', label: 'General / Other Concerns' },
];

export const CitizenIssues: React.FC = () => {
    const [issues, setIssues] = useState<IssueReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0].value);
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const fetchIssues = async () => {
        try {
            setLoading(true);
            const res = await axiosPrivate.get('/reports/');
            const data = res.data.results || res.data;
            setIssues(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Failed to load your reported issues.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must not exceed 5MB.');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim() || !location.trim()) {
            toast.error('Please fill out all required fields.');
            return;
        }

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('category', category);
            formData.append('location', location.trim());
            formData.append('description', description.trim());
            if (imageFile) {
                formData.append('image', imageFile);
            }

            await axiosPrivate.post('/reports/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Incident report filed with Barangay Command!');
            setIsModalOpen(false);
            setTitle('');
            setLocation('');
            setDescription('');
            handleRemoveImage();
            fetchIssues();
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to submit report.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" /> Pending Review
                    </span>
                );
            case 'IN_PROGRESS':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        <ShieldAlert className="w-3.5 h-3.5" /> In Progress / Field Assigned
                    </span>
                );
            case 'RESOLVED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                    </span>
                );
            default:
                return (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Community Incident & Hazard Reports
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 max-w-xl">
                        Directly report community issues, road hazards, or public sanitation concerns to the Barangay Hall & Tanod.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-primary-foreground bg-primary hover:bg-primary-hover transition-all shadow-md shadow-primary/20 cursor-pointer shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>Report an Incident</span>
                </button>
            </div>

            {/* Reports List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                            <div className="h-4 w-32 bg-slate-200 rounded"></div>
                            <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
                            <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : issues.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-xs">
                    <div className="w-12 h-12 bg-sky-50 text-primary-text rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No Incidents Reported</h3>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                        You have not submitted any community issues yet. All your filed reports and resolution progress will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {issues.map((issue) => (
                        <div
                            key={issue.id}
                            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                                        {issue.category.replace(/_/g, ' ')}
                                    </span>
                                    {getStatusBadge(issue.status)}
                                </div>

                                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                                    {issue.title}
                                </h2>
                                
                                <p className="text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                                    {issue.description}
                                </p>

                                {issue.image && (
                                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 h-36 bg-slate-100">
                                        <img 
                                            src={issue.image} 
                                            alt="Incident evidence" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                                <div className="flex items-center gap-1.5 font-medium text-slate-500">
                                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                    <span className="truncate max-w-[180px]">{issue.location}</span>
                                </div>
                                <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Report Issue Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-2.5">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                <h3 className="text-lg font-bold text-slate-900">File Incident Report</h3>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Report Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Uncollected garbage pile, broken streetlight"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm font-medium outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Category *
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Exact Location *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Corner Purok 3 near chapel"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-primary rounded-xl text-sm font-medium outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Description of Concern *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Describe what happened, any immediate hazard, and how long the issue has persisted..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-primary rounded-xl text-sm font-medium outline-none resize-none"
                                />
                            </div>

                            {/* Photo Upload Dropzone */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Photo Evidence (Optional)
                                </label>
                                {imagePreview ? (
                                    <div className="relative rounded-xl overflow-hidden border border-slate-200 h-32 bg-slate-50 flex items-center justify-center">
                                        <img 
                                            src={imagePreview} 
                                            alt="Preview" 
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute top-2 right-2 bg-slate-900/80 text-white rounded-full p-1 hover:bg-slate-900 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-primary rounded-xl p-4 cursor-pointer transition-colors bg-slate-50/50 hover:bg-sky-50/30">
                                        <Camera className="w-6 h-6 text-slate-400 mb-1" />
                                        <span className="text-xs font-semibold text-slate-600">Click to upload photo</span>
                                        <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG up to 5MB</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2.5 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary-hover rounded-xl transition-all shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
                                >
                                    {submitting ? 'Submitting Report...' : 'Submit Incident Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};