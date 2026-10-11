import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axiosPrivate } from '../../api/axios';
import { HotlineManagement } from './HotlineManagement';

vi.mock('../../api/axios', () => ({
    axiosPrivate: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('HotlineManagement', () => {
    beforeEach(() => {
        vi.mocked(axiosPrivate.get).mockReset();
        vi.mocked(axiosPrivate.post).mockReset();
        vi.mocked(axiosPrivate.delete).mockReset();
        vi.mocked(axiosPrivate.get).mockResolvedValue({ data: [] } as never);
    });

    it('shows a retryable load error instead of an empty list and keeps add available', async () => {
        vi.mocked(axiosPrivate.get).mockRejectedValueOnce(new Error('Network unavailable'));

        render(<HotlineManagement />);

        expect(await screen.findByRole('alert')).toHaveTextContent(
            "We couldn't load emergency hotlines.",
        );
        expect(screen.queryByText('No hotlines added yet.')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Add Hotline' }));
        expect(screen.getByRole('dialog', { name: 'Add Emergency Hotline' })).toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenCalledExactlyOnceWith('/hotlines/');
        expect(axiosPrivate.post).not.toHaveBeenCalled();
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });

    it('retries the same endpoint after failure and clears the error when records load', async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockResolvedValueOnce({
                data: {
                    results: [{
                        id: 12,
                        name: 'Community Emergency Response',
                        number: '123',
                        category: 'BARANGAY',
                        category_display: 'Barangay',
                        is_active: true,
                    }],
                },
            } as never);

        render(<HotlineManagement />);
        expect(await screen.findByRole('alert')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        await waitFor(() => expect(axiosPrivate.get).toHaveBeenCalledTimes(2));
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByText('Community Emergency Response')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.queryByText('No hotlines added yet.')).not.toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(1, '/hotlines/');
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(2, '/hotlines/');
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(3, '/hotlines/');
    });

    it('keeps the empty-list message for a successful empty response', async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: [] } as never);

        render(<HotlineManagement />);

        expect(await screen.findByText('No hotlines added yet.')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('disables retry while the GET is pending without invoking mutations', async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockImplementationOnce(() => new Promise(() => {}));

        render(<HotlineManagement />);
        await screen.findByRole('alert');
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByRole('button', { name: 'Trying again…' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Add Hotline' })).toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenCalledTimes(2);
        expect(axiosPrivate.post).not.toHaveBeenCalled();
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });
});
