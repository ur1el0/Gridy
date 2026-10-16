import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import { axiosPublic } from '../../api/axios';
import { InlineErrorState } from '../../components/ui/InlineErrorState';

export const PublicNoticeRedirect: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [destination, setDestination] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [notFound, setNotFound] = useState(false);

    const resolveAnnouncement = useCallback(async (isRetry = false) => {
        if (!id) return;
        if (isRetry) setRetrying(true);
        setFailed(false);
        setNotFound(false);
        try {
            const res = await axiosPublic.get(`/public/announcements/${id}/`);
            const barangayId = res.data?.barangay_id;
            if (barangayId) {
                setDestination(`/public/announcements/${barangayId}#announcement-${id}`);
            } else {
                setNotFound(true);
            }
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 404) {
                setNotFound(true);
            } else {
                setFailed(true);
            }
        } finally {
            setLoading(false);
            setRetrying(false);
        }
    }, [id]);

    useEffect(() => {
        void resolveAnnouncement();
    }, [resolveAnnouncement]);

    if (destination) {
        return <Navigate to={destination} replace />;
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-900">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Megaphone aria-hidden="true" className="h-6 w-6" />
                </div>
                {loading ? (
                    <div className="space-y-3 py-4">
                        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                        <p className="text-sm font-medium text-slate-600">Redirecting to official notice…</p>
                    </div>
                ) : notFound ? (
                    <div className="space-y-3 py-2">
                        <h1 className="text-lg font-bold text-slate-900">Announcement Not Found</h1>
                        <p className="text-sm text-slate-600">
                            This announcement is no longer available in the public bulletin.
                        </p>
                        <div className="pt-2">
                            <Link
                                to="/"
                                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                            >
                                Back to KapitBayan
                            </Link>
                        </div>
                    </div>
                ) : failed ? (
                    <div className="py-2">
                        <InlineErrorState
                            message="Unable to load this announcement right now."
                            onRetry={() => { void resolveAnnouncement(true); }}
                            retrying={retrying}
                        />
                    </div>
                ) : null}
            </div>
        </main>
    );
};
