import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { axiosPublic } from '../../api/axios';
import { PublicNoticeRedirect } from './PublicNoticeRedirect';

vi.mock('../../api/axios', () => ({
    axiosPublic: {
        get: vi.fn(),
    },
}));

function renderWithRoute(initialUrl = '/notice/5') {
    return render(
        <MemoryRouter initialEntries={[initialUrl]}>
            <Routes>
                <Route path="/notice/:id" element={<PublicNoticeRedirect />} />
                <Route path="/public/announcements/:barangayId" element={<div data-testid="target-page">Public Bulletin</div>} />
                <Route path="/" element={<div data-testid="home-page">Home</div>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('PublicNoticeRedirect', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('redirects to the barangay bulletin anchor when announcement is resolved', async () => {
        vi.mocked(axiosPublic.get).mockResolvedValueOnce({
            data: {
                id: 5,
                barangay_id: 2,
                title: 'Water interruption',
            },
        } as never);

        renderWithRoute('/notice/5');

        await waitFor(() => {
            expect(screen.getByTestId('target-page')).toBeInTheDocument();
        });
        expect(axiosPublic.get).toHaveBeenCalledWith('/public/announcements/5/');
    });

    it('shows not found when announcement returns 404', async () => {
        vi.mocked(axiosPublic.get).mockRejectedValueOnce({
            response: { status: 404 },
        } as never);

        renderWithRoute('/notice/999');

        await waitFor(() => {
            expect(screen.getByText('Announcement Not Found')).toBeInTheDocument();
        });
        expect(screen.getByText(/no longer available in the public bulletin/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Back to KapitBayan' })).toBeInTheDocument();
    });

    it('shows retryable error on network failure', async () => {
        vi.mocked(axiosPublic.get).mockRejectedValueOnce(new Error('Network error'));

        renderWithRoute('/notice/5');

        await waitFor(() => {
            expect(screen.getByText(/Unable to load this announcement right now/)).toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });
});
