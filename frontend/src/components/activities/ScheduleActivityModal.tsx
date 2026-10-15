import React, { useId } from 'react';
import { Calendar, MapPin, X } from 'lucide-react';
import { useModalFocus } from '../../hooks/useModalFocus';

export interface ScheduleActivityModalProps {
    onClose: () => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    title: string;
    setTitle: (val: string) => void;
    location: string;
    setLocation: (val: string) => void;
    eventDate: string;
    setEventDate: (val: string) => void;
    description: string;
    setDescription: (val: string) => void;
    isSubmitting: boolean;
    navigatorAiEnabled?: boolean;
    setNavigatorAiEnabled?: (val: boolean) => void;
    canEnableAi?: boolean;
}

export const ScheduleActivityModal: React.FC<ScheduleActivityModalProps> = ({
    onClose,
    onSubmit,
    title,
    setTitle,
    location,
    setLocation,
    eventDate,
    setEventDate,
    description,
    setDescription,
    isSubmitting,
    navigatorAiEnabled = false,
    setNavigatorAiEnabled,
    canEnableAi = true,
}) => {
    const activityDialogTitleId = useId();
    const activityDialogRef = useModalFocus<HTMLDivElement>(true, onClose);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" onClick={onClose} />

            <div
                ref={activityDialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={activityDialogTitleId}
                tabIndex={-1}
                className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            >
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 id={activityDialogTitleId} className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary-text" />
                        Schedule Activity
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close schedule activity dialog"
                        className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-200 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-5 bg-white">
                    <div>
                        <label htmlFor="activity-title" className="block text-sm font-semibold text-slate-700 mb-1.5">Event Title</label>
                        <input
                            id="activity-title"
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g., Barangay Assembly"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-sm outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="activity-location" className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    id="activity-location"
                                    type="text"
                                    required
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    placeholder="Covered Court"
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-sm outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="activity-datetime" className="block text-sm font-semibold text-slate-700 mb-1.5">Date & Time</label>
                            <input
                                id="activity-datetime"
                                type="datetime-local"
                                required
                                value={eventDate}
                                onChange={e => setEventDate(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-sm outline-none transition-all cursor-pointer"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="activity-description" className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                        <textarea
                            id="activity-description"
                            required
                            rows={3}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Details about the event..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-sm outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center h-5">
                            <input
                                id="activity-navigator-ai-enabled"
                                type="checkbox"
                                checked={navigatorAiEnabled}
                                disabled={!canEnableAi}
                                onChange={e => setNavigatorAiEnabled?.(e.target.checked)}
                                className="h-4 w-4 text-primary-text focus:ring-primary border-slate-300 rounded cursor-pointer disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label
                                htmlFor="activity-navigator-ai-enabled"
                                className={`text-xs font-bold ${canEnableAi ? 'text-slate-900 cursor-pointer' : 'text-slate-400 cursor-not-allowed'}`}
                            >
                                Share with Public AI Navigator
                            </label>
                            <span className="text-[11px] text-slate-500">
                                Allow the Public Information AI Navigator to use this activity schedule as an official source. Opted-in content is screened locally before reaching the configured AI provider. Do not include resident identifiers, personal contact numbers, or private records.
                            </span>
                            {!canEnableAi && (
                                <span className="text-[11px] text-amber-600 font-medium mt-1">
                                    AI sharing is restricted to authorized same-barangay staff.
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary-hover transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                        >
                            {isSubmitting ? (
                                <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Scheduling...</>
                            ) : 'Schedule Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
