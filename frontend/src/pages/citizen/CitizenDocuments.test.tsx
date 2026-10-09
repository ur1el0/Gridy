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
        vi.mocked(axiosPrivate.get).mockImplementation(async (url: string) => ({
            data: url === '/payment-recipients/' ? [{
                id: 7,
                provider: 'MAYA',
                provider_label: 'Maya',
                display_name: 'Barangay Maya',
                recipient_name: 'Barangay Treasurer',
                recipient_identifier: '09170000000',
                instructions: 'Add the document request number.',
            }] : [{
                id: 15,
                document_type: 'Barangay Clearance',
                purpose: 'Employment',
                status: 'READY_FOR_PICKUP',
                fee_amount: '50.00',
                payment_method: '',
                payment_status: 'UNPAID',
                created_at: '2026-10-08T00:00:00Z',
            }],
        } as never));
    });

    it('submits a selected barangay transfer recipient and reference for manual verification', async () => {
        vi.mocked(axiosPrivate.post).mockResolvedValue({
            data: {
                id: 15,
                payment_method: 'MAYA',
                payment_recipient: 7,
                payment_reference: 'GC-REF-5512',
                payment_status: 'PENDING_VERIFICATION',
            },
        } as never);

        render(<CitizenDocuments />);
        const recipient = await screen.findByLabelText('Payment recipient for request 15');
        fireEvent.change(recipient, { target: { value: '7' } });
        const input = screen.getByLabelText('Transfer reference for request 15');
        fireEvent.change(input, { target: { value: 'GC-REF-5512' } });
        fireEvent.click(screen.getByRole('button', { name: 'Submit transfer reference' }));

        await waitFor(() => expect(axiosPrivate.post).toHaveBeenCalledWith(
            '/document-requests/15/payment-reference/',
            { payment_recipient_id: 7, payment_reference: 'GC-REF-5512' },
        ));
    });
});
