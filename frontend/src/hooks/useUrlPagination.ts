import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useUrlPagination = (pageKey: string) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const parsedPage = Number.parseInt(searchParams.get(pageKey) ?? '1', 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const setPage = useCallback((nextPage: number) => {
        setSearchParams((current) => {
            const updated = new URLSearchParams(current);
            if (nextPage <= 1) {
                updated.delete(pageKey);
            } else {
                updated.set(pageKey, String(nextPage));
            }
            return updated;
        }, { replace: true });
    }, [pageKey, setSearchParams]);

    return { page, setPage, searchParams, setSearchParams };
};
