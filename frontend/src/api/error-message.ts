import axios from 'axios';

export function getSafeApiErrorMessage(error: unknown, fallback: string): string {
    if (!axios.isAxiosError(error)) return fallback;

    const response = error.response;
    if (!response || response.status >= 500) return fallback;

    const data = response.data as { detail?: unknown; message?: unknown } | undefined;
    const message = typeof data?.detail === 'string'
        ? data.detail
        : typeof data?.message === 'string'
            ? data.message
            : undefined;

    return message?.trim().slice(0, 300) || fallback;
}
