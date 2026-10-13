import React, { useEffect, useId, useRef, useState } from 'react';
import axios from 'axios';
import { AlertCircle, Loader2, RotateCcw, Send, ShieldAlert, Sparkles, X } from 'lucide-react';
import { useModalFocus } from '../../hooks/useModalFocus';
import { submitNavigatorQuery } from '../../api/navigator';
import { NavigatorTurnCard } from './NavigatorTurnCard';
import type { NavigatorTurn } from './types';

const MAX_QUERY_LENGTH = 500;

const SUGGESTED_QUESTIONS = [
    'What are the requirements for a Barangay Clearance?',
    'Are first-time jobseekers exempt from clearance fees?',
    'What upcoming barangay activities are scheduled?',
    'What are the emergency hotlines?',
];

interface RequestError {
    message: string;
    query: string;
    retryable: boolean;
}

interface PublicNavigatorDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

function isRequestErrorRetryable(error: unknown): boolean {
    if (!axios.isAxiosError(error)) {
        return true;
    }
    const status = error.response?.status;
    if (status === undefined) {
        return true;
    }
    return status === 429 || status >= 500;
}

function getRequestErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 429) {
            return 'You have sent too many questions in a short time. Please wait a minute, then try again.';
        }
        if (status === 400) {
            return 'Your question could not be processed. Please check your question.';
        }
        if (status === 401) {
            return 'Your session has expired. Please log in again to continue.';
        }
        if (status === 403) {
            return 'Access restricted. Only verified residents can use the navigator.';
        }
        if (status && status >= 500) {
            return 'The assistant service encountered a temporary error. Please try again or contact the Barangay Hall.';
        }
    }
    return 'We could not reach the assistant. Check your connection and try again, or contact the Barangay Hall.';
}

export const PublicNavigatorDrawer: React.FC<PublicNavigatorDrawerProps> = ({ isOpen, onClose }) => {
    const titleId = useId();
    const noticeId = useId();
    const inputId = useId();
    const dialogRef = useModalFocus<HTMLDivElement>(isOpen, onClose);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Turns live only in component memory: never written to storage, URL state, or analytics.
    const [turns, setTurns] = useState<NavigatorTurn[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<RequestError | null>(null);
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    useEffect(() => {
        const area = scrollRef.current;
        if (area) area.scrollTop = area.scrollHeight;
    }, [turns, loading, error]);

    const send = async (rawQuery: string) => {
        const trimmed = rawQuery.trim();
        if (!trimmed || loading) return;

        setError(null);
        setLoading(true);
        setAnnouncement('Searching public barangay records.');

        try {
            const response = await submitNavigatorQuery(trimmed);
            setTurns((previous) => [
                ...previous,
                { id: crypto.randomUUID(), query: trimmed, askedAt: new Date(), response },
            ]);
            setQuery('');
            setAnnouncement(`Response received. ${response.answer}`);
        } catch (requestError: unknown) {
            const retryable = isRequestErrorRetryable(requestError);
            const message = getRequestErrorMessage(requestError);
            setError({ message, query: trimmed, retryable });
            setAnnouncement(message);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void send(query);
    };

    const clearConversation = () => {
        setTurns([]);
        setQuery('');
        setError(null);
        setAnnouncement('Conversation cleared.');
        inputRef.current?.focus();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs" onClick={onClose}>
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={noticeId}
                tabIndex={-1}
                onClick={(event) => event.stopPropagation()}
                className="fixed inset-y-0 right-0 w-full sm:max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200 focus:outline-none"
            >
                <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                    {announcement}
                </div>

                <header className="px-5 py-4 bg-primary text-primary-foreground flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-amber-300" aria-hidden="true" />
                        <div>
                            <h2 id={titleId} className="text-base font-extrabold tracking-tight leading-tight">
                                Ask Barangay
                            </h2>
                            <p className="text-xs text-white/85 font-medium">Public information assistant</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {turns.length > 0 && (
                            <button
                                type="button"
                                onClick={clearConversation}
                                aria-label="Clear conversation"
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl text-white/85 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                            >
                                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close Ask Barangay"
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl text-white/85 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                        >
                            <X className="w-5 h-5" aria-hidden="true" />
                        </button>
                    </div>
                </header>

                <div
                    id={noticeId}
                    className="bg-amber-50 border-b border-amber-200 px-4 py-3 shrink-0 flex items-start gap-2.5 text-xs text-amber-950"
                >
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="leading-relaxed">
                        <strong>Public information only.</strong> Answers come from your barangay&apos;s published
                        records and may be processed by an AI service. Do not type names, contact numbers, ID
                        numbers, payment references, or details of a personal case.
                    </p>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#F8FAFD]">
                    {turns.length === 0 && !loading && (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-700">
                                Ask about clearances, requirements, fee exemptions, activities, or hotlines.
                            </p>
                            <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                Suggested questions
                            </h3>
                            <ul className="space-y-2">
                                {SUGGESTED_QUESTIONS.map((suggestion) => (
                                    <li key={suggestion}>
                                        <button
                                            type="button"
                                            onClick={() => void send(suggestion)}
                                            className="w-full min-h-[44px] text-left px-3 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-primary/50 hover:bg-primary/5 text-sm text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                                        >
                                            {suggestion}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {turns.length > 0 && (
                        <ol aria-label="Conversation" className="space-y-5">
                            {turns.map((turn) => (
                                <NavigatorTurnCard
                                    key={turn.id}
                                    turn={turn}
                                    onRetry={(retryQuery) => void send(retryQuery)}
                                    retryDisabled={loading}
                                />
                            ))}
                        </ol>
                    )}

                    {loading && (
                        <div className="mt-5 flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 text-sm text-slate-700">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" aria-hidden="true" />
                            Searching public barangay records…
                        </div>
                    )}

                    {error && (
                        <div role="alert" className="mt-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-900 space-y-2">
                            <p className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                                {error.message}
                            </p>
                            {error.retryable && (
                                <button
                                    type="button"
                                    onClick={() => void send(error.query)}
                                    disabled={loading}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold border border-rose-300 bg-white hover:bg-rose-50 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                                    Try again
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-200 shrink-0 space-y-1.5">
                    <label htmlFor={inputId} className="block text-xs font-bold text-slate-700">
                        Your question
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            id={inputId}
                            type="text"
                            autoComplete="off"
                            maxLength={MAX_QUERY_LENGTH}
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            disabled={loading}
                            aria-describedby={`${inputId}-count`}
                            placeholder="e.g. How do I get a Barangay Clearance?"
                            className="flex-1 min-h-[44px] px-4 rounded-xl border border-slate-300 bg-[#F8FAFD] text-sm text-slate-900 placeholder-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60"
                        />
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            aria-label="Send question"
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer"
                        >
                            {loading
                                ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                : <Send className="w-4 h-4" aria-hidden="true" />}
                        </button>
                    </div>
                    <p id={`${inputId}-count`} className="text-[11px] text-slate-600 text-right">
                        {query.length}/{MAX_QUERY_LENGTH} characters
                    </p>
                </form>
            </div>
        </div>
    );
};
