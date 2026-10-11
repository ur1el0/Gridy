import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axiosPrivate } from '../../api/axios';
import { useAuth } from '../../context/auth-context';
import { AidRequests } from './AidRequests';

vi.mock('../../api/axios', () => ({
    axiosPrivate: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));
vi.mock('../../context/auth-context', () => ({ useAuth: vi.fn() }));

describe('AidRequests', () => {
    beforeEach(() => {
        vi.mocked(axiosPrivate.get).mockReset();
        vi.mocked(axiosPrivate.post).mockReset();
        vi.mocked(axiosPrivate.patch).mockReset();
        vi.mocked(axiosPrivate.get).mockResolvedValue({ data: [] } as never);
    });

    it('submits a resident request for manual review', async () => {
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'RESIDENT' } } as never);
        vi.mocked(axiosPrivate.post).mockResolvedValue({ data: {} } as never);

        render(<AidRequests />);
        fireEvent.change(await screen.findByLabelText('Reason for request'), {
            target: { value: 'I am requesting help with school expenses.' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }));

        await waitFor(() => expect(axiosPrivate.post).toHaveBeenCalledWith('/aid-requests/', {
            assistance_type: 'Medical assistance',
            reason: 'I am requesting help with school expenses.',
        }));
    });

    it('shows an accessible load error instead of an empty history and keeps the resident form available', async () => {
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'RESIDENT' } } as never);
        vi.mocked(axiosPrivate.get).mockRejectedValueOnce(new Error('Network unavailable'));

        render(<AidRequests />);

        expect(await screen.findByRole('alert')).toHaveTextContent(
            "We couldn't load assistance requests.",
        );
        expect(screen.queryByText('No assistance requests have been submitted.')).not.toBeInTheDocument();
        expect(await screen.findByLabelText('Reason for request')).toBeInTheDocument();
    });

    it('retries the same list endpoint and recovers after a repeated failure', async () => {
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'RESIDENT' } } as never);
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockResolvedValueOnce({
                data: [{
                    id: 12,
                    requester_name: 'Demo Resident',
                    assistance_type: 'Food assistance',
                    reason: 'Requesting grocery support.',
                    status: 'PENDING',
                    staff_notes: '',
                    created_at: '2026-10-01T00:00:00Z',
                }],
            } as never);

        render(<AidRequests />);
        expect(await screen.findByRole('alert')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        await waitFor(() => expect(axiosPrivate.get).toHaveBeenCalledTimes(2));
        expect(await screen.findByRole('alert')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByText('Requesting grocery support.')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.queryByText('No assistance requests have been submitted.')).not.toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(1, '/aid-requests/');
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(2, '/aid-requests/');
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(3, '/aid-requests/');
    });

    it('keeps the empty-history message for a successful empty response', async () => {
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'RESIDENT' } } as never);
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: [] } as never);

        render(<AidRequests />);

        expect(await screen.findByText('No assistance requests have been submitted.')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('disables retry while the list request is pending without invoking mutations', async () => {
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'RESIDENT' } } as never);
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockImplementationOnce(() => new Promise(() => {}));

        render(<AidRequests />);
        await screen.findByRole('alert');
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(screen.getByRole('button', { name: 'Trying again…' })).toBeDisabled();
        expect(axiosPrivate.get).toHaveBeenCalledTimes(2);
        expect(axiosPrivate.post).not.toHaveBeenCalled();
        expect(axiosPrivate.patch).not.toHaveBeenCalled();
    });

    it('requires a reason before staff can decline a request', async () => {
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'ADMIN' } } as never);
        vi.mocked(axiosPrivate.get).mockResolvedValue({
            data: [{
                id: 8,
                requester_name: 'Demo Resident',
                assistance_type: 'Medical assistance',
                reason: 'Requesting clinic support.',
                status: 'PENDING',
                staff_notes: '',
                created_at: '2026-10-01T00:00:00Z',
            }],
        } as never);
        vi.mocked(axiosPrivate.patch).mockResolvedValue({
            data: {
                id: 8,
                requester_name: 'Demo Resident',
                assistance_type: 'Medical assistance',
                reason: 'Requesting clinic support.',
                status: 'DECLINED',
                staff_notes: 'The application is missing required documents.',
                created_at: '2026-10-01T00:00:00Z',
            },
        } as never);

        render(<AidRequests />);
        const decline = await screen.findByRole('button', { name: 'Decline' });
        fireEvent.click(decline);
        expect(axiosPrivate.patch).not.toHaveBeenCalled();
        fireEvent.change(screen.getByLabelText('Review note'), {
            target: { value: 'The application is missing required documents.' },
        });
        fireEvent.click(decline);

        await waitFor(() => expect(axiosPrivate.patch).toHaveBeenCalledWith('/aid-requests/8/', {
            status: 'DECLINED',
            staff_notes: 'The application is missing required documents.',
        }));
    });
});
