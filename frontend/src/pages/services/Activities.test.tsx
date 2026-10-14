import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axiosPrivate } from '../../api/axios';
import { useAuth } from '../../context/auth-context';
import { Activities } from './Activities';

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

const activity = {
    id: 12,
    title: 'Barangay Assembly',
    description: 'Monthly community meeting.',
    location: 'Covered Court',
    event_datetime: '2026-10-20T09:00:00Z',
    created_at: '2026-10-12T08:00:00Z',
};

describe('Activities', () => {
    beforeEach(() => {
        vi.mocked(axiosPrivate.get).mockReset();
        vi.mocked(axiosPrivate.post).mockReset();
        vi.mocked(axiosPrivate.delete).mockReset();
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'ADMIN', barangay_id: 1 } } as never);
        vi.mocked(axiosPrivate.get).mockResolvedValue({ data: [] } as never);
    });

    it('shows an accessible load error and keeps scheduling available after the list request fails', async () => {
        vi.mocked(axiosPrivate.get).mockRejectedValueOnce(new Error('Network unavailable'));

        render(<Activities />);

        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load activities.");
        expect(screen.queryByText('No upcoming activities scheduled.')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Schedule Activity' }));
        expect(screen.getByRole('dialog', { name: 'Schedule Activity' })).toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenCalledExactlyOnceWith('/activities/');
        expect(axiosPrivate.post).not.toHaveBeenCalled();
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });

    it('retries the same list endpoint after repeated failure and renders activities on recovery', async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockResolvedValueOnce({ data: { results: [activity] } } as never);

        render(<Activities />);
        expect(await screen.findByRole('alert')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        await waitFor(() => expect(axiosPrivate.get).toHaveBeenCalledTimes(2));
        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load activities.");

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByText('Barangay Assembly')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.queryByText('No upcoming activities scheduled.')).not.toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(1, '/activities/');
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(2, '/activities/');
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(3, '/activities/');
        expect(axiosPrivate.post).not.toHaveBeenCalled();
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });

    it('preserves loaded activity cards when the post-create list refresh fails', async () => {
        vi.mocked(axiosPrivate.get)
            .mockResolvedValueOnce({ data: [activity] } as never)
            .mockRejectedValueOnce(new Error('Network unavailable'));
        vi.mocked(axiosPrivate.post).mockResolvedValueOnce({ data: {} } as never);

        render(<Activities />);
        expect(await screen.findByText('Barangay Assembly')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Schedule Activity' }));
        fireEvent.change(screen.getByLabelText('Event Title'), { target: { value: 'Health Screening' } });
        fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Barangay Hall' } });
        fireEvent.change(screen.getByLabelText('Date & Time'), { target: { value: '2026-10-20T09:00' } });
        fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Community health screening.' } });
        fireEvent.click(screen.getByRole('button', { name: 'Schedule Event' }));

        await waitFor(() => expect(axiosPrivate.get).toHaveBeenCalledTimes(2));

        expect(screen.getByText('Barangay Assembly')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent("We couldn't load activities.");
        expect(axiosPrivate.post).toHaveBeenCalledWith('/activities/', expect.objectContaining({
            title: 'Health Screening',
            location: 'Barangay Hall',
        }));
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });

    it('shows the genuine empty state after a successful empty response', async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: [] } as never);

        render(<Activities />);

        expect(await screen.findByText('No upcoming activities scheduled.')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('disables retry while the GET is pending without blocking scheduling or invoking mutations', async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockImplementationOnce(() => new Promise(() => {}));

        render(<Activities />);
        await screen.findByRole('alert');
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByRole('button', { name: 'Trying again…' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Schedule Activity' })).toBeEnabled();
        expect(axiosPrivate.get).toHaveBeenCalledTimes(2);
        expect(axiosPrivate.post).not.toHaveBeenCalled();
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });

    it('renders navigator_ai_enabled control for authorized staff and includes it in creation payload', async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: [] } as never);
        vi.mocked(axiosPrivate.post).mockResolvedValueOnce({ data: {} } as never);

        render(<Activities />);
        await screen.findByText('No upcoming activities scheduled.');
        fireEvent.click(screen.getByRole('button', { name: 'Schedule Activity' }));

        const aiCheckbox = screen.getByLabelText('Share with Public AI Navigator');
        expect(aiCheckbox).toBeInTheDocument();
        expect(aiCheckbox).toBeEnabled();
        expect(screen.getByText(/Allow the Public Information AI Navigator to use this activity schedule/)).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Event Title'), { target: { value: 'Clean-up Drive' } });
        fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Zone 4' } });
        fireEvent.change(screen.getByLabelText('Date & Time'), { target: { value: '2026-10-25T08:00' } });
        fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Community cleanup initiative.' } });
        fireEvent.click(aiCheckbox);

        fireEvent.click(screen.getByRole('button', { name: 'Schedule Event' }));

        await waitFor(() => expect(axiosPrivate.post).toHaveBeenCalledTimes(1));
        const [url, payload] = vi.mocked(axiosPrivate.post).mock.calls[0];
        expect(url).toBe('/activities/');
        expect(payload).toEqual(expect.objectContaining({
            title: 'Clean-up Drive',
            location: 'Zone 4',
            navigator_ai_enabled: true,
        }));
    });

    it('disables navigator_ai_enabled control when user lacks barangay assignment', async () => {
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'ADMIN', barangay_id: null } } as never);
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: [] } as never);

        render(<Activities />);
        await screen.findByText('No upcoming activities scheduled.');
        fireEvent.click(screen.getByRole('button', { name: 'Schedule Activity' }));

        const aiCheckbox = screen.getByLabelText('Share with Public AI Navigator');
        expect(aiCheckbox).toBeDisabled();
        expect(screen.getByText('AI sharing is restricted to authorized same-barangay staff.')).toBeInTheDocument();
    });
});
