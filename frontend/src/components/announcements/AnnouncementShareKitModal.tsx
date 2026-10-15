import React, { useId, useRef } from 'react';
import { Copy, Download, ExternalLink, QrCode, X } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import { useModalFocus } from '../../hooks/useModalFocus';

export interface ShareableAnnouncement {
    id: number;
    title: string;
    content: string;
}

interface AnnouncementShareKitModalProps {
    announcement: ShareableAnnouncement;
    barangayId: number | string;
    onClose: () => void;
}

export const AnnouncementShareKitModal: React.FC<AnnouncementShareKitModalProps> = ({
    announcement,
    barangayId,
    onClose,
}) => {
    const titleId = useId();
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const dialogRef = useModalFocus<HTMLDivElement>(true, onClose);
    const publicUrl = new URL(
        `/public/announcements/${encodeURIComponent(String(barangayId))}#announcement-${announcement.id}`,
        window.location.origin,
    ).toString();
    const caption = `${announcement.title}\n\n${announcement.content}\n\nRead the official KapitBayan announcement: ${publicUrl}`;

    const copyText = async (value: string, successMessage: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success(successMessage);
        } catch {
            toast.error('Clipboard access is unavailable. Select and copy the public link instead.');
        }
    };

    const downloadQr = () => {
        const canvas = qrCanvasRef.current;
        if (!canvas) {
            toast.error('The QR code is not ready to download.');
            return;
        }

        try {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `barangay-announcement-${announcement.id}-qr.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('QR code downloaded.');
        } catch {
            toast.error('Could not download the QR code.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                    <h2 id={titleId} className="flex items-center gap-2 text-base font-bold text-slate-900">
                        <QrCode aria-hidden="true" className="h-5 w-5 text-primary-text" />
                        Announcement share kit
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close announcement share kit"
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                    >
                        <X aria-hidden="true" className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-5 p-5">
                    <div>
                        <h3 className="font-semibold text-slate-900">{announcement.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                            Use this link and QR code to bring residents to this exact public KapitBayan notice.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-start">
                        <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-2">
                            <QRCodeCanvas
                                ref={qrCanvasRef}
                                value={publicUrl}
                                size={512}
                                level="M"
                                marginSize={4}
                                title={`QR code linking to ${announcement.title}`}
                                className="h-52 w-52"
                            />
                        </div>
                        <div className="min-w-0 flex-1 space-y-3">
                            <label htmlFor={`${titleId}-url`} className="block text-xs font-bold uppercase tracking-wide text-slate-600">
                                Public announcement link
                            </label>
                            <input
                                id={`${titleId}-url`}
                                readOnly
                                value={publicUrl}
                                onFocus={(event) => event.currentTarget.select()}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                            />
                            <a
                                href={publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary-text underline"
                            >
                                Open public notice <ExternalLink aria-hidden="true" className="h-4 w-4" />
                            </a>
                        </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                        <button
                            type="button"
                            onClick={() => void copyText(publicUrl, 'Public announcement link copied.')}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            <Copy aria-hidden="true" className="h-4 w-4" /> Copy link
                        </button>
                        <button
                            type="button"
                            onClick={() => void copyText(caption, 'Facebook-ready post text copied.')}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            <Copy aria-hidden="true" className="h-4 w-4" /> Copy post text
                        </button>
                        <button
                            type="button"
                            onClick={downloadQr}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                        >
                            <Download aria-hidden="true" className="h-4 w-4" /> Download QR PNG
                        </button>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                        <p className="font-semibold">Facebook and other channels</p>
                        <p className="mt-1">
                            Posting is manual. Before sharing on Facebook, staff must confirm public comments are disabled for the post. If the Page cannot disable them, use this QR code or link through other official channels. KapitBayan does not publish Facebook posts or read comments.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
