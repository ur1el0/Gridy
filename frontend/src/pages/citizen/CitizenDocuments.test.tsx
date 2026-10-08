import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axiosPrivate } from '../../api/axios';
import { CitizenDocuments } from './CitizenDocuments';

vi.mock('../../api/axios', () => ({
    axiosPrivate: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

describe('CitizenDocuments payment reference', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(axiosPrivate.get).mockResolvedValue({
            data: [{
                id: 15,
                document_type: 'Barangay Clearance',
                purpose: 'Employment',
                status: 'READY_FOR_PICKUP',
                fee_amount: '50.00',
                payment_method: '',
                payment_status: 'UNPAID',
                created_at: '2026-10-08T00:00:00Z',
            }],
        } as never);
    });

    it('submits a resident supplied GCash reference for manual verification', async () => {
        vi.mocked(axiosPrivate.post).mockResolvedValue({
            data: {
                id: 15,
                payment_method: 'GCASH',
                payment_reference: 'GC-REF-5512',
                payment_status: 'PENDING_VERIFICATION',
            },
        } as never);

        render(<CitizenDocuments />);
        const input = await screen.findByLabelText('GCash reference for request 15');
        fireEvent.change(input, { target: { value: 'GC-REF-5512' } });
        fireEvent.click(screen.getByRole('button', { name: 'Submit GCash reference' }));

        await waitFor(() => expect(axiosPrivate.post).toHaveBeenCalledWith(
            '/document-requests/15/payment-reference/',
            { payment_reference: 'GC-REF-5512' },
        ));
    });
});
