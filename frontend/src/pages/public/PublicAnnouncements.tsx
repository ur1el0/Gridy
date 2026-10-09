import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import { axiosPublic } from '../../api/axios';

interface PublicAnnouncement {
    id: number;
    title: string;
    content: string;
    is_pinned: boolean;
    created_at: string;
}

export const PublicAnnouncements: React.FC = () => {
    const { barangayId } = useParams<{ barangayId: string }>();
    const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!barangayId) return;
        axiosPublic.get(`/public/barangays/${barangayId}/announcements/`)
            .then((response) => setAnnouncements(response.data))
            .catch(() => setFailed(true))
            .finally(() => setLoading(false));
    }, [barangayId]);

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
            <div className="mx-auto max-w-3xl space-y-6">
                <header className="rounded-2xl bg-primary p-6 text-primary-foreground">
                    <div className="flex items-center gap-3">
                        <Megaphone aria-hidden="true" />
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-80">Gridy Community Bulletin</p>
                            <h1 className="text-2xl font-bold">Barangay announcements</h1>
                        </div>
                    </div>
                    <p className="mt-3 text-sm opacity-90">Official information is shared here. Requests and transactions must be completed inside Gridy.</p>
                </header>
                {loading ? <p role="status">Loading announcements…</p> : failed ? (
                    <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">Announcements are temporarily unavailable.</p>
                ) : announcements.length === 0 ? (
                    <p className="rounded-xl bg-white p-6 text-slate-600">There are no public announcements at this time.</p>
                ) : announcements.map((announcement) => (
                    <article key={announcement.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        {announcement.is_pinned && <p className="mb-2 text-xs font-bold uppercase text-amber-700">Pinned announcement</p>}
                        <h2 className="text-xl font-bold">{announcement.title}</h2>
                        <p className="mt-2 text-xs text-slate-500">{new Date(announcement.created_at).toLocaleDateString()}</p>
                        <p className="mt-4 whitespace-pre-wrap leading-relaxed text-slate-700">{announcement.content}</p>
                    </article>
                ))}
                <footer className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                    Need to file a request? <Link className="font-semibold text-primary-text underline" to="/login">Sign in to Gridy</Link> to complete the transaction.
                </footer>
            </div>
        </main>
    );
};
