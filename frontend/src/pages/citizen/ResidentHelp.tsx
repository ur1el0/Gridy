import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CircleHelp, Loader2, Search, ShieldCheck } from 'lucide-react';
import { axiosPrivate } from '../../api/axios';

type ResidentFAQ = {
    id: number;
    question: string;
    answer: string;
    order: number;
    audience: 'RESIDENT' | 'STAFF';
    category: string;
};

const CATEGORY_LABELS: Record<string, string> = {
    GETTING_STARTED: 'Getting started',
    ACCOUNT: 'Account access',
    DOCUMENTS: 'Documents',
    PAYMENTS: 'Fees and payments',
    QUEUE: 'Queue and schedules',
    ASSISTANCE: 'Assistance and programs',
    COMMUNITY: 'Community notices',
    ACCESSIBILITY: 'Accessibility',
    PRIVACY: 'Privacy and safety',
    OTHER: 'Other',
};

function unwrapFaqs(payload: unknown): ResidentFAQ[] {
    if (Array.isArray(payload)) return payload as ResidentFAQ[];
    if (payload && typeof payload === 'object' && Array.isArray((payload as { results?: unknown }).results)) {
        return (payload as { results: ResidentFAQ[] }).results;
    }
    return [];
}

export const ResidentHelp: React.FC = () => {
    const [faqs, setFaqs] = useState<ResidentFAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [retryKey, setRetryKey] = useState(0);

    const loadFaqs = useCallback(async (signal: AbortSignal) => {
        setLoading(true);
        setLoadError(false);
        try {
            const response = await axiosPrivate.get('/faqs/', { signal });
            setFaqs(unwrapFaqs(response.data).filter((faq) => faq.audience === 'RESIDENT'));
        } catch {
            if (!signal.aborted) {
                setLoadError(true);
                setFaqs([]);
            }
        } finally {
            if (!signal.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadFaqs(controller.signal);
        return () => controller.abort();
    }, [loadFaqs, retryKey]);

    const categories = useMemo(() => [...new Set(faqs.map((faq) => faq.category))], [faqs]);
    const filteredFaqs = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        return faqs.filter((faq) => {
            const matchesQuery = !normalizedQuery
                || `${faq.question} ${faq.answer}`.toLocaleLowerCase().includes(normalizedQuery);
            return matchesQuery && (selectedCategory === 'ALL' || faq.category === selectedCategory);
        });
    }, [faqs, query, selectedCategory]);

    return (
        <main className="mx-auto max-w-5xl space-y-7 pb-10">
            <header className="max-w-3xl">
                <p className="text-sm font-bold uppercase tracking-wide text-primary-text">Resident support</p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Help and frequently asked questions</h1>
                <p className="mt-3 text-base leading-7 text-slate-700">
                    Search for help with your account and Barangay services. Local requirements and programs can differ, so check current instructions from your Barangay.
                </p>
            </header>

            <section aria-labelledby="faq-list-heading" className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div>
                    <h2 id="faq-list-heading" className="text-xl font-bold text-slate-900">Find an answer</h2>
                    <label className="relative mt-3 block">
                        <span className="sr-only">Search help questions and answers</span>
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="For example: request a document"
                            className="min-h-12 w-full rounded-xl border border-slate-300 py-2 pl-11 pr-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        />
                    </label>
                </div>

                {!loading && !loadError && categories.length > 0 && (
                    <div aria-label="FAQ categories" className="flex flex-wrap gap-2">
                        <button type="button" aria-pressed={selectedCategory === 'ALL'} onClick={() => setSelectedCategory('ALL')} className={`min-h-11 rounded-full border px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${selectedCategory === 'ALL' ? 'border-primary bg-primary text-primary-foreground' : 'border-slate-300 bg-white text-slate-800'}`}>
                            All topics
                        </button>
                        {categories.map((category) => (
                            <button key={category} type="button" aria-pressed={selectedCategory === category} onClick={() => setSelectedCategory(category)} className={`min-h-11 rounded-full border px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${selectedCategory === category ? 'border-primary bg-primary text-primary-foreground' : 'border-slate-300 bg-white text-slate-800'}`}>
                                {CATEGORY_LABELS[category] ?? 'Other'}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div role="status" className="flex min-h-40 items-center justify-center gap-3 text-slate-700">
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Loading help…
                    </div>
                ) : loadError ? (
                    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-slate-900">
                        <p className="font-bold">Help could not be loaded.</p>
                        <p className="mt-1 leading-6">Check your internet connection and try again. If the problem continues, contact your Barangay through a verified channel.</p>
                        <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="mt-4 min-h-11 rounded-lg bg-primary px-4 font-semibold text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Try again</button>
                    </div>
                ) : filteredFaqs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-7 text-center">
                        <CircleHelp className="mx-auto h-8 w-8 text-slate-500" aria-hidden="true" />
                        <p className="mt-3 font-semibold text-slate-900">{faqs.length ? 'No answers match your search.' : 'No FAQs are available yet.'}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">For current local instructions, contact your Barangay office.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200">
                        {filteredFaqs.map((faq) => (
                            <details key={faq.id} className="group py-2 first:pt-0 last:pb-0">
                                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-3 py-3 text-left font-semibold leading-6 text-slate-900 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
                                    <span>{faq.question}</span>
                                    <span aria-hidden="true" className="shrink-0 text-2xl font-normal text-primary group-open:rotate-45">+</span>
                                </summary>
                                <div className="whitespace-pre-line px-3 pb-4 pt-1 text-base leading-7 text-slate-700">{faq.answer}</div>
                            </details>
                        ))}
                    </div>
                )}
                {!loading && !loadError && <p role="status" className="text-sm text-slate-600">Showing {filteredFaqs.length} answers.</p>}
            </section>

            <aside className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-700">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <p>Do not share your password, OTP, or identity documents in personal messages. Barangay-specific eligibility, fees, required documents, and office hours must be confirmed with the responsible Barangay.</p>
            </aside>
        </main>
    );
};
