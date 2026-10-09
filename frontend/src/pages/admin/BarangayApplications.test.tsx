import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axiosPrivate } from '../../api/axios';
import { BarangayApplications } from './BarangayApplications';

vi.mock('../../api/axios', () => ({ axiosPrivate: { get: vi.fn(), post: vi.fn() } }));

describe('BarangayApplications', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        vi.mocked(axiosPrivate.get).mockResolvedValue({ data: [{
            id: 4, name: 'Barangay Mabini', municipality: 'Lucena City', province: 'Quezon',
            applicant_name: 'Maria Santos', applicant_position: 'Secretary',
            applicant_email: 'maria@example.com', applicant_phone: '09170000000',
            status: 'PENDING', review_note: '',
        }] } as never);
    });

    it('requires review decision confirmation and posts approval', async () => {
        vi.mocked(axiosPrivate.post).mockResolvedValue({ data: { id: 4, status: 'APPROVED' } } as never);
        render(<BarangayApplications />);
        fireEvent.click(await screen.findByRole('button', { name: 'Approve and create account' }));

        await waitFor(() => expect(axiosPrivate.post).toHaveBeenCalledWith('/auth/barangay-applications/4/review/', {
            status: 'APPROVED', review_note: '',
        }));
    });
});
