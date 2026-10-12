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

    it('shows a retryable load alert instead of claiming no recipients are configured', async () => {
        vi.mocked(axiosPrivate.get).mockRejectedValueOnce(new Error('Network unavailable'));
        render(<PaymentRecipientSettings />);

        expect(await screen.findByRole('alert')).toHaveTextContent('Could not load payment recipients.');
        expect(screen.queryByText('No e-payment recipients configured. Cash collection remains available.')).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Electronic payment recipients' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add payment recipient' })).toBeEnabled();
        expect(axiosPrivate.get).toHaveBeenCalledExactlyOnceWith('/payment-recipients/');
        expect(axiosPrivate.post).not.toHaveBeenCalled();
        expect(axiosPrivate.patch).not.toHaveBeenCalled();
    });

    it('retries only the list GET and recovers after repeated failures', async () => {
        const recipient = {
            id: 2,
            provider: 'MAYA',
            provider_label: 'Maya',
            display_name: 'Barangay Maya',
            recipient_name: 'Barangay Treasurer',
            recipient_identifier: '09170000000',
            instructions: 'Include request number.',
            is_active: true,
        };
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockResolvedValueOnce({ data: { results: [recipient] } } as never);
        render(<PaymentRecipientSettings />);

        expect(await screen.findByRole('alert')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        await waitFor(() => expect(axiosPrivate.get).toHaveBeenCalledTimes(2));
        expect(screen.getByRole('alert')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(await screen.findByText('Barangay Maya')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.queryByText('No e-payment recipients configured. Cash collection remains available.')).not.toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(1, '/payment-recipients/');
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(2, '/payment-recipients/');
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(3, '/payment-recipients/');
        expect(axiosPrivate.post).not.toHaveBeenCalled();
        expect(axiosPrivate.patch).not.toHaveBeenCalled();
    });

    it('disables retry while the recipient list GET is pending', async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockImplementationOnce(() => new Promise(() => {}));
        render(<PaymentRecipientSettings />);

        await screen.findByRole('alert');
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByRole('button', { name: 'Trying again…' })).toBeDisabled();
        expect(axiosPrivate.get).toHaveBeenCalledTimes(2);
        expect(axiosPrivate.post).not.toHaveBeenCalled();
        expect(axiosPrivate.patch).not.toHaveBeenCalled();
    });

    it('shows the genuine empty state after a retry successfully returns no recipients', async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockResolvedValueOnce({ data: [] } as never);
        render(<PaymentRecipientSettings />);

        await screen.findByRole('alert');
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByText('No e-payment recipients configured. Cash collection remains available.')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenCalledTimes(2);
    });

    it('retains known recipients and distinct create success feedback when the follow-up GET fails', async () => {
        const recipient = {
            id: 2,
            provider: 'MAYA',
            provider_label: 'Maya',
            display_name: 'Existing Maya',
            recipient_name: 'Barangay Treasurer',
            recipient_identifier: '09170000000',
            instructions: 'Include request number.',
            is_active: true,
        };
        vi.mocked(axiosPrivate.get)
            .mockResolvedValueOnce({ data: { results: [recipient] } } as never)
            .mockRejectedValueOnce(new Error('Network unavailable'));
        vi.mocked(axiosPrivate.post).mockResolvedValueOnce({ data: {} } as never);
        render(<PaymentRecipientSettings />);

        expect(await screen.findByText('Existing Maya')).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('Label residents will recognize'), { target: { value: 'New recipient' } });
        fireEvent.change(screen.getByLabelText('Official recipient name'), { target: { value: 'New Treasurer' } });
        fireEvent.change(screen.getByLabelText('Account number or wallet identifier'), { target: { value: '09179999999' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add payment recipient' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Could not load payment recipients.');
        expect(screen.getByRole('status')).toHaveTextContent('Recipient added. Residents in this barangay can now use it.');
        expect(screen.getByText('Existing Maya')).toBeInTheDocument();
        expect(screen.queryByText('No e-payment recipients configured. Cash collection remains available.')).not.toBeInTheDocument();
        expect(axiosPrivate.post).toHaveBeenCalledExactlyOnceWith('/payment-recipients/', {
            provider: 'GCASH',
            display_name: 'New recipient',
            recipient_name: 'New Treasurer',
            recipient_identifier: '09179999999',
            instructions: '',
        });
        expect(axiosPrivate.get).toHaveBeenCalledTimes(2);
        expect(axiosPrivate.patch).not.toHaveBeenCalled();
    });
});
