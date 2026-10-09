import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axiosPrivate } from '../../api/axios';
import { CitizenBulletin } from './CitizenBulletin';

vi.mock('../../api/axios', () => ({
    axiosPrivate: { get: vi.fn() },
}));

describe('CitizenBulletin', () => {
    beforeEach(() => vi.mocked(axiosPrivate.get).mockReset());

    it('shows a load error instead of an empty announcement state and retries', async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockResolvedValueOnce({ data: { results: [] } })
            .mockResolvedValueOnce({ data: { results: [] } })
            .mockResolvedValueOnce({ data: { results: [] } });

        render(<CitizenBulletin />);

        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load announcements.");
        expect(screen.queryByText('No announcements posted')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        await waitFor(() => {
            expect(screen.getByText('No announcements posted')).toBeInTheDocument();
        });
    });
});
