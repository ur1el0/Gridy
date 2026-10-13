import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
    count: number;
    page: number;
    pageSize: number;
    label: string;
    onPageChange: (page: number) => void;
}

export const TablePagination = ({
    count,
    page,
    pageSize,
    label,
    onPageChange,
}: TablePaginationProps) => {
    if (count <= pageSize) return null;

    const pageCount = Math.max(1, Math.ceil(count / pageSize));
    const firstResult = (page - 1) * pageSize + 1;
    const lastResult = Math.min(page * pageSize, count);

    return (
        <nav
            aria-label={`${label} pagination`}
            className="flex flex-col gap-3 rounded-b-xl border border-t-0 border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
        >
            <p aria-live="polite" className="text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-900">{firstResult}–{lastResult}</span> of{' '}
                <span className="font-semibold text-slate-900">{count}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    aria-label="Previous page"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                    Previous
                </button>
                <span aria-current="page" className="min-h-11 px-2 py-3 text-sm font-medium text-slate-700">
                    Page {page} of {pageCount}
                </span>
                <button
                    type="button"
                    aria-label="Next page"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= pageCount}
                    className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Next
                    <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </button>
            </div>
        </nav>
    );
};
