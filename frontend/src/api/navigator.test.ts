import { describe, it, expect, vi } from 'vitest';
import { axiosPrivate } from './axios';
import { submitNavigatorQuery } from './navigator';

vi.mock('./axios', () => ({
    axiosPrivate: { post: vi.fn() },
}));

describe('submitNavigatorQuery', () => {
    it('posts only the trimmed query to the tenant-scoped navigator endpoint', async () => {
        const data = { status: 'answered', answer: 'ok', reason: null, sources: [], escalation: {} };
        vi.mocked(axiosPrivate.post).mockResolvedValueOnce({ data });

        await expect(submitNavigatorQuery('  Clearance fee?  ')).resolves.toBe(data);

        expect(axiosPrivate.post).toHaveBeenCalledWith('/public/navigator/query/', { query: 'Clearance fee?' });
    });
});
