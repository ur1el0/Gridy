/**
 * Mirrors backend/gridy_communications/navigator/serializers.py
 * (NavigatorQueryResponseSerializer). Keep in sync with the OpenAPI contract.
 */
export interface NavigatorSource {
    id: string;
    title: string;
    category: string;
    reference: string;
    updated_at?: string | null;
}

export interface NavigatorHotline {
    name: string;
    number: string;
    category: string;
}

export interface NavigatorEscalation {
    office_contact: string | null;
    hotlines: NavigatorHotline[];
    barangay_hall_notice: string;
}

export type NavigatorResponseStatus = 'answered' | 'abstained' | 'unavailable';

export interface NavigatorQueryResponse {
    status: NavigatorResponseStatus;
    answer: string;
    reason: string | null;
    sources: NavigatorSource[];
    escalation: NavigatorEscalation;
}

export interface NavigatorTurn {
    id: string;
    query: string;
    askedAt: Date;
    response: NavigatorQueryResponse;
}

export type NavigatorTurnKind = 'answered' | 'privacy' | 'out_of_scope' | 'unavailable';

const RETRYABLE_UNAVAILABLE_REASONS = new Set([
    'provider_timeout',
    'provider_error',
    'provider_quota_exceeded',
]);

export function classifyTurn(response: NavigatorQueryResponse): NavigatorTurnKind {
    if (response.status === 'answered') return 'answered';
    if (response.status === 'unavailable') return 'unavailable';
    return response.reason?.startsWith('privacy_guard_') ? 'privacy' : 'out_of_scope';
}

export function isRetryable(response: NavigatorQueryResponse): boolean {
    return response.status === 'unavailable'
        && RETRYABLE_UNAVAILABLE_REASONS.has(response.reason ?? '');
}

const MANILA_DATE = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
});

const MANILA_TIME = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
});

export function formatManilaDate(value: string): string | null {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : MANILA_DATE.format(date);
}

export function formatManilaTime(value: Date): string {
    return MANILA_TIME.format(value);
}
