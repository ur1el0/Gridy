import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { axiosPublic } from '../../api/axios';
import { PublicAnnouncements } from './PublicAnnouncements';

vi.mock('../../api/axios', () => ({
    axiosPublic: { get: vi.fn() },
}));

describe('PublicAnnouncements', () => {
    beforeEach(() => vi.clearAllMocks());

    it('shows public post details and directs transactions back to Gridy', async () => {
        vi.mocked(axiosPublic.get).mockResolvedValue({
            data: [{
                id: 3,
                title: 'Barangay hall schedule',
                content: 'The office opens at 8 AM on Monday.',
                is_pinned: true,
                created_at: '2026-10-08T00:00:00Z',
            }],
        } as never);

        render(
            <MemoryRouter initialEntries={['/public/announcements/12']}>
                <Routes>
                    <Route path="/public/announcements/:barangayId" element={<PublicAnnouncements />} />
                </Routes>
            </MemoryRouter>,
        );

        expect(await screen.findByRole('heading', { name: 'Barangay hall schedule' })).toBeInTheDocument();
        expect(screen.getByText('The office opens at 8 AM on Monday.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Sign in to Gridy' })).toHaveAttribute('href', '/login');
        expect(axiosPublic.get).toHaveBeenCalledWith('/public/barangays/12/announcements/');
    });
});
