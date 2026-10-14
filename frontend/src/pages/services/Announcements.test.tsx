import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axiosPrivate } from '../../api/axios';
import { useAuth } from '../../context/auth-context';
import { Announcements } from './Announcements';

vi.mock('../../api/axios', () => ({
    axiosPrivate: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock('../../context/auth-context', () => ({
    useAuth: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

const announcement = {
    id: 12,
    title: 'Water service interruption',
    content: 'Water service will be unavailable this afternoon.',
    image: null,
    is_pinned: false,
    created_at: '2026-10-12T08:00:00Z',
};

describe('Announcements', () => {
    beforeEach(() => {
        vi.mocked(axiosPrivate.get).mockReset();
        vi.mocked(axiosPrivate.post).mockReset();
        vi.mocked(axiosPrivate.delete).mockReset();
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'ADMIN', barangay_id: 1 } } as never);
        vi.mocked(axiosPrivate.get).mockResolvedValue({ data: [] } as never);
    });

    it('shows an accessible list error and keeps the page and create action available', async () => {
        vi.mocked(axiosPrivate.get).mockRejectedValueOnce(new Error('Network unavailable'));

        render(<Announcements />);

        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load announcements.");
        expect(screen.queryByText('No announcements active right now.')).not.toBeInTheDocument();
        expect(screen.getByText('Active Broadcasts')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'New Announcement' }));
        expect(screen.getByRole('dialog', { name: 'Broadcast Announcement' })).toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenCalledExactlyOnceWith('/announcements/');
        expect(axiosPrivate.post).not.toHaveBeenCalled();
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });

    it('retries only the list GET after repeated failures and renders announcements after recovery', async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockResolvedValueOnce({ data: { results: [announcement] } } as never);

        render(<Announcements />);
        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load announcements.");

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        await waitFor(() => expect(axiosPrivate.get).toHaveBeenCalledTimes(2));
        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load announcements.");

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(await screen.findByText('Water service interruption')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.queryByText('No announcements active right now.')).not.toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(1, '/announcements/');
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(2, '/announcements/');
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(3, '/announcements/');
        expect(axiosPrivate.post).not.toHaveBeenCalled();
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });

    it('preserves loaded cards when the post-create list refresh fails', async () => {
        vi.mocked(axiosPrivate.get)
            .mockResolvedValueOnce({ data: [announcement] } as never)
            .mockRejectedValueOnce(new Error('Network unavailable'));
        vi.mocked(axiosPrivate.post).mockResolvedValueOnce({ data: {} } as never);

        render(<Announcements />);
        expect(await screen.findByText('Water service interruption')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'New Announcement' }));
        fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'Community cleanup' } });
        fireEvent.change(screen.getByLabelText('Full Content'), { target: { value: 'Meet at the barangay hall.' } });
        fireEvent.click(screen.getByRole('button', { name: 'Broadcast Now' }));

        await waitFor(() => expect(axiosPrivate.get).toHaveBeenCalledTimes(2));
        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load announcements.");
        expect(screen.getByText('Water service interruption')).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(axiosPrivate.post).toHaveBeenCalledTimes(1);
        expect(axiosPrivate.post).toHaveBeenCalledWith('/announcements/', expect.any(FormData), {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });

    it('shows the genuine empty state when a retry successfully returns no announcements', async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockResolvedValueOnce({ data: { results: [] } } as never);

        render(<Announcements />);
        await screen.findByRole('alert');
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByText('No announcements active right now.')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenCalledTimes(2);
    });

    it('disables retry while the GET is pending without issuing mutations', async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockImplementationOnce(() => new Promise(() => {}));

        render(<Announcements />);
        await screen.findByRole('alert');
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByRole('button', { name: 'Trying again…' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'New Announcement' })).toBeEnabled();
        expect(axiosPrivate.get).toHaveBeenCalledTimes(2);
        expect(axiosPrivate.post).not.toHaveBeenCalled();
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });

    it('renders navigator_ai_enabled control for authorized staff and includes it in creation payload', async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: [] } as never);
        vi.mocked(axiosPrivate.post).mockResolvedValueOnce({ data: {} } as never);

        render(<Announcements />);
        await screen.findByText('No announcements active right now.');
        fireEvent.click(screen.getByRole('button', { name: 'New Announcement' }));

        const aiCheckbox = screen.getByLabelText('Share with Public AI Navigator');
        expect(aiCheckbox).toBeInTheDocument();
        expect(aiCheckbox).toBeEnabled();
        expect(screen.getByText(/Allow the Public Information AI Navigator to use this announcement/)).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'Free Rabies Vaccination' } });
        fireEvent.change(screen.getByLabelText('Full Content'), { target: { value: 'Bring pets to barangay hall.' } });
        fireEvent.click(aiCheckbox);

        fireEvent.click(screen.getByRole('button', { name: 'Broadcast Now' }));

        await waitFor(() => expect(axiosPrivate.post).toHaveBeenCalledTimes(1));
        const [url, formData] = vi.mocked(axiosPrivate.post).mock.calls[0];
        expect(url).toBe('/announcements/');
        expect((formData as FormData).get('navigator_ai_enabled')).toBe('true');
    });

    it('disables navigator_ai_enabled control when user lacks barangay assignment', async () => {
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'ADMIN', barangay_id: null } } as never);
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: [] } as never);

        render(<Announcements />);
        await screen.findByText('No announcements active right now.');
        fireEvent.click(screen.getByRole('button', { name: 'New Announcement' }));

        const aiCheckbox = screen.getByLabelText('Share with Public AI Navigator');
        expect(aiCheckbox).toBeDisabled();
        expect(screen.getByText('AI sharing is restricted to authorized same-barangay staff.')).toBeInTheDocument();
    });
});
