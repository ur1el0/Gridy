import React, { useId, useRef, useState } from 'react';
import { Check, Copy, Download, ExternalLink, QrCode, X } from 'lucide-react';
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
    onClose,
}) => {
    const titleId = useId();
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const dialogRef = useModalFocus<HTMLDivElement>(true, onClose);
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedCaption, setCopiedCaption] = useState(false);

    const publicUrl = new URL(
        `/notice/${announcement.id}`,
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

    const handleCopyLink = async () => {
        await copyText(publicUrl, 'Public announcement link copied.');
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleCopyCaption = async () => {
        await copyText(caption, 'Facebook-ready post text copied.');
        setCopiedCaption(true);
        setTimeout(() => setCopiedCaption(false), 2000);
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
                className="max-h-[92vh] w-full min-w-0 max-w-xl overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl"
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary-text">
                            <QrCode aria-hidden="true" className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 id={titleId} className="text-base font-bold text-slate-900">
                                Announcement share kit
                            </h2>
                            <p className="text-xs text-slate-500">Official bulletin distribution tools</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close announcement share kit"
                        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                    >
                        <X aria-hidden="true" className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-w-0 space-y-6 p-6">
                    {/* Announcement Title summary */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary-text">
                            Notice #{announcement.id}
                        </span>
                        <h3 className="mt-0.5 text-base font-semibold text-slate-900 line-clamp-2">
                            {announcement.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-600">
                            Use this QR code and short link to connect residents directly to this official notice.
                        </p>
                    </div>

                    {/* QR Code and Link Showcase */}
                    <div className="flex flex-col items-center gap-5 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 p-5 md:flex-row md:items-start">
                        {/* Square QR Card */}
                        <div className="flex w-full flex-col items-center rounded-xl border border-slate-200 bg-white p-3 shadow-xs md:w-52 md:shrink-0">
                            <div className="flex aspect-square w-full max-w-44 items-center justify-center rounded-lg p-1">
                                <QRCodeCanvas
                                    ref={qrCanvasRef}
                                    value={publicUrl}
                                    size={512}
                                    level="M"
                                    marginSize={4}
                                    title={`QR code linking to ${announcement.title}`}
                                    style={{ width: '100%', height: 'auto', aspectRatio: '1 / 1' }}
                                    className="block w-full"
                                />
                            </div>
                            <span className="mt-2 text-center text-[11px] font-medium text-slate-500">
                                Scan with phone camera
                            </span>
                        </div>

                        {/* Public Link & Destination Section */}
                        <div className="flex min-w-0 flex-1 flex-col justify-between space-y-4 self-stretch">
                            <div>
                                <label
                                    htmlFor={`${titleId}-url`}
                                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                                >
                                    Public announcement link
                                </label>
                                <div className="mt-1.5 flex items-center gap-2">
                                    <input
                                        id={`${titleId}-url`}
                                        readOnly
                                        value={publicUrl}
                                        onFocus={(event) => event.currentTarget.select()}
                                        className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => void handleCopyLink()}
                                        title="Copy short link"
                                        className={`inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-all ${
                                            copiedLink
                                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                                        }`}
                                    >
                                        {copiedLink ? (
                                            <>
                                                <Check aria-hidden="true" className="h-4 w-4 text-emerald-600" />
                                                <span className="text-xs">Copied</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy aria-hidden="true" className="h-4 w-4" />
                                                <span className="text-xs">Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-200/70 pt-3">
                                <a
                                    href={publicUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-primary-text hover:underline"
                                >
                                    Open public notice <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                                </a>
                                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                                    Direct Short Route
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="grid gap-2.5 sm:grid-cols-3">
                        <button
                            type="button"
                            onClick={() => void handleCopyLink()}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-[0.99] transition-all"
                        >
                            {copiedLink ? (
                                <Check aria-hidden="true" className="h-4 w-4 text-emerald-600" />
                            ) : (
                                <Copy aria-hidden="true" className="h-4 w-4 text-slate-500" />
                            )}
                            Copy link
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleCopyCaption()}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-[0.99] transition-all"
                        >
                            {copiedCaption ? (
                                <Check aria-hidden="true" className="h-4 w-4 text-emerald-600" />
                            ) : (
                                <Copy aria-hidden="true" className="h-4 w-4 text-slate-500" />
                            )}
                            Copy post text
                        </button>
                        <button
                            type="button"
                            onClick={downloadQr}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover active:scale-[0.99] transition-all"
                        >
                            <Download aria-hidden="true" className="h-4 w-4" />
                            Download QR PNG
                        </button>
                    </div>

                    {/* Manual Policy Notice */}
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-950">
                        <p className="font-bold text-amber-900">Facebook and external channels</p>
                        <p className="mt-1 text-amber-900/90">
                            Posting is manual. Before sharing on Facebook, staff must confirm public comments are disabled for the post. If the Page cannot disable them, use this QR code or link through other official channels. KapitBayan does not publish Facebook posts or read comments.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
