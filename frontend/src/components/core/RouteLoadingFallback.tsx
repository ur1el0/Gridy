export function RouteLoadingFallback() {
    return (
        <div
            className="flex min-h-[50vh] items-center justify-center gap-3 p-8 text-sm font-medium text-slate-600"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <span
                className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-700"
                aria-hidden="true"
            />
            <span>Loading page…</span>
        </div>
    );
}
