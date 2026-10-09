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
        vi.clearAllMocks();
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
