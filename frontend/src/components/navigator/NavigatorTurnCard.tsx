import React, { useId, useState } from 'react';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    FileText,
    Info,
    RotateCcw,
    ShieldAlert,
} from 'lucide-react';
import { NavigatorEscalationPanel } from './NavigatorEscalationPanel';
import {
    classifyTurn,
    formatManilaDate,
    formatManilaTime,
    isRetryable,
    type NavigatorTurn,
    type NavigatorTurnKind,
} from './types';

const KIND_BADGE: Record<NavigatorTurnKind, { label: string; className: string; Icon: typeof Info }> = {
    answered: {
        label: 'Answer from public records',
        className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        Icon: CheckCircle2,
    },
    privacy: {
        label: 'Privacy notice',
        className: 'bg-amber-50 text-amber-900 border-amber-200',
        Icon: ShieldAlert,
    },
    out_of_scope: {
        label: 'Not in public records',
        className: 'bg-slate-100 text-slate-800 border-slate-300',
        Icon: AlertCircle,
    },
    unavailable: {
        label: 'Assistant unavailable',
        className: 'bg-rose-50 text-rose-800 border-rose-200',
        Icon: Info,
    },
};

interface NavigatorTurnCardProps {
    turn: NavigatorTurn;
    onRetry: (query: string) => void;
    retryDisabled: boolean;
}

export const NavigatorTurnCard: React.FC<NavigatorTurnCardProps> = ({ turn, onRetry, retryDisabled }) => {
    const kind = classifyTurn(turn.response);
    const badge = KIND_BADGE[kind];
    const escalationId = useId();
    const [escalationOpen, setEscalationOpen] = useState(kind !== 'answered');
    const { sources, escalation } = turn.response;

    return (
        <li className="space-y-3">
            <div className="flex justify-end">
                <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
                    <p className="sr-only">You asked:</p>
                    <p className="text-sm font-medium leading-relaxed break-words">{turn.query}</p>
                    <span className="block text-[10px] text-white/80 text-right mt-1 font-semibold">
                        {formatManilaTime(turn.askedAt)}
                    </span>
                </div>
            </div>

            <article
                aria-label={badge.label}
                className="w-full bg-white rounded-2xl rounded-tl-sm p-4 border border-slate-200 shadow-sm space-y-3"
            >
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.className}`}>
                    <badge.Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    {badge.label}
                </span>

                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    {turn.response.answer}
                </p>

                {isRetryable(turn.response) && (
                    <button
                        type="button"
                        onClick={() => onRetry(turn.query)}
                        disabled={retryDisabled}
                        className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        Try again
                    </button>
                )}

                {sources.length > 0 && (
                    <section className="pt-2 border-t border-slate-100 space-y-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                            {kind === 'answered' ? 'Sources cited' : 'Public records you can check'}
                        </h4>
                        <ul className="space-y-1.5">
                            {sources.map((source) => {
                                const updated = source.updated_at ? formatManilaDate(source.updated_at) : null;
                                return (
                                    <li
                                        key={source.id}
                                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="font-bold text-slate-900 leading-tight">{source.title}</span>
                                            <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 capitalize">
                                                {source.category.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        {source.reference && (
                                            <p className="text-[11px] text-slate-600">Reference: {source.reference}</p>
                                        )}
                                        {updated && (
                                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" aria-hidden="true" />
                                                Updated {updated}
                                            </p>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                )}

                <div className="pt-2 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => setEscalationOpen((open) => !open)}
                        aria-expanded={escalationOpen}
                        aria-controls={escalationId}
                        className="w-full min-h-[44px] flex items-center justify-between text-left text-xs font-bold text-slate-700 hover:text-slate-900 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    >
                        <span>Barangay Hall &amp; emergency contacts</span>
                        {escalationOpen
                            ? <ChevronUp className="w-4 h-4 text-slate-500" aria-hidden="true" />
                            : <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />}
                    </button>
                    <div id={escalationId} hidden={!escalationOpen}>
                        {escalationOpen && <NavigatorEscalationPanel escalation={escalation} />}
                    </div>
                </div>
            </article>
        </li>
    );
};
