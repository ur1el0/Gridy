import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axiosPrivate } from '../../api/axios';
import { PaymentRecipientSettings } from './PaymentRecipientSettings';

vi.mock('../../api/axios', () => ({ axiosPrivate: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

describe('PaymentRecipientSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(axiosPrivate.get).mockResolvedValue({ data: [] } as never);
    });

    it('stores provider details and transfer instructions with the barangay recipient', async () => {
        vi.mocked(axiosPrivate.post).mockResolvedValue({ data: { id: 2 } } as never);
        render(<PaymentRecipientSettings />);
        fireEvent.change(await screen.findByLabelText('Label residents will recognize'), { target: { value: 'Barangay Maya' } });
        fireEvent.change(screen.getByLabelText('Official recipient name'), { target: { value: 'Barangay Treasurer' } });
        fireEvent.change(screen.getByLabelText('Account number or wallet identifier'), { target: { value: '09170000000' } });
        fireEvent.change(screen.getByLabelText('Transfer instructions'), { target: { value: 'Include request number.' } });
        fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'MAYA' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add payment recipient' }));

        await waitFor(() => expect(axiosPrivate.post).toHaveBeenCalledWith('/payment-recipients/', {
            provider: 'MAYA', display_name: 'Barangay Maya', recipient_name: 'Barangay Treasurer',
            recipient_identifier: '09170000000', instructions: 'Include request number.',
        }));
    });
});
