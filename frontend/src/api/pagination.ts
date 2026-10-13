export interface PageResponse<T> {
    count: number;
    results: T[];
}

export function parsePageResponse<T>(payload: unknown): PageResponse<T> {
    if (Array.isArray(payload)) {
        return { count: payload.length, results: payload as T[] };
    }

    if (!payload || typeof payload !== 'object') {
        throw new Error('The list response was not a valid page.');
    }

    const page = payload as { count?: unknown; results?: unknown };
    if (!Array.isArray(page.results)) {
        throw new Error('The list response did not contain a results array.');
    }

    return {
        count: typeof page.count === 'number' && Number.isFinite(page.count)
            ? page.count
            : page.results.length,
        results: page.results as T[],
    };
}
