import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentReferenceForm } from './PaymentReferenceForm';
import type { PaymentRecipient } from './types';

describe('PaymentReferenceForm', () => {
    const mockRecipients: PaymentRecipient[] = [
        {
            id: 1,
            provider: 'GCASH',
            provider_label: 'GCash',
            display_name: 'Barangay GCash Hub',
            recipient_name: 'Treasurer Juan Dela Cruz',
            recipient_identifier: '09171234567',
            instructions: 'Send exact fee and write request ID in message.',
        },
        {
            id: 2,
            provider: 'MAYA',
            provider_label: 'Maya',
            display_name: 'Barangay Maya Desk',
            recipient_name: 'Barangay Hall Collection',
            recipient_identifier: '09189876543',
            instructions: 'Use reference for confirmation.',
        },
    ];

    const defaultProps = {
        requestId: 42,
        recipients: mockRecipients,
        recipientsLoading: false,
        recipientsLoadError: false,
        onRetryRecipients: vi.fn(),
        submitting: false,
        onSubmit: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        window.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');
        window.URL.revokeObjectURL = vi.fn();
    });

    it('renders all form fields, date-time picker, screenshot dropzone, and official guidance', () => {
        render(<PaymentReferenceForm {...defaultProps} />);

        expect(screen.getByLabelText('Payment recipient for request 42')).toBeInTheDocument();
        expect(screen.getByLabelText('Transfer reference for request 42')).toBeInTheDocument();
        expect(screen.getByLabelText('Transaction date and time for request 42')).toBeInTheDocument();
        expect(screen.getByLabelText('Payment proof screenshot for request 42')).toBeInTheDocument();

        expect(screen.getByText(/Please ensure your uploaded screenshot visibly shows the transaction reference number, amount, and date\/time/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Submit transfer reference' })).toBeInTheDocument();
    });

    it('displays recipient details card when a recipient is selected', () => {
        render(<PaymentReferenceForm {...defaultProps} />);

        const recipientSelect = screen.getByLabelText('Payment recipient for request 42');
        fireEvent.change(recipientSelect, { target: { value: '1' } });

        expect(screen.getByText('Treasurer Juan Dela Cruz')).toBeInTheDocument();
        expect(screen.getByText('09171234567')).toBeInTheDocument();
        expect(screen.getByText('Send exact fee and write request ID in message.')).toBeInTheDocument();
    });

    it('validates required fields and displays validation error when submitting incomplete form', () => {
        render(<PaymentReferenceForm {...defaultProps} />);

        const form = screen.getByRole('button', { name: 'Submit transfer reference' }).closest('form')!;
        fireEvent.submit(form);

        expect(screen.getByRole('alert')).toHaveTextContent('Please select an active payment recipient');
        expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('rejects unsupported file formats', () => {
        render(<PaymentReferenceForm {...defaultProps} />);

        const fileInput = screen.getByLabelText('Payment proof screenshot for request 42');
        const invalidFile = new File(['text'], 'receipt.txt', { type: 'text/plain' });
        fireEvent.change(fileInput, { target: { files: [invalidFile] } });

        expect(screen.getByRole('alert')).toHaveTextContent('Only JPEG, PNG, and WEBP image formats are supported');
    });

    it('rejects files larger than 5 MB', () => {
        render(<PaymentReferenceForm {...defaultProps} />);

        const fileInput = screen.getByLabelText('Payment proof screenshot for request 42');
        const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big_receipt.png', {
            type: 'image/png',
        });
        fireEvent.change(fileInput, { target: { files: [largeFile] } });

        expect(screen.getByRole('alert')).toHaveTextContent('Payment proof screenshot must not exceed 5 MB');
    });

    it('shows thumbnail preview and allows clearing selected screenshot', () => {
        render(<PaymentReferenceForm {...defaultProps} />);

        const fileInput = screen.getByLabelText('Payment proof screenshot for request 42');
        const validFile = new File(['image-bytes'], 'my_receipt.png', { type: 'image/png' });
        fireEvent.change(fileInput, { target: { files: [validFile] } });

        expect(screen.getByAltText('Receipt preview thumbnail')).toBeInTheDocument();
        expect(screen.getByText('my_receipt.png')).toBeInTheDocument();

        const removeBtn = screen.getByLabelText('Remove receipt screenshot');
        fireEvent.click(removeBtn);

        expect(screen.queryByAltText('Receipt preview thumbnail')).not.toBeInTheDocument();
        expect(screen.queryByText('my_receipt.png')).not.toBeInTheDocument();
    });

    it('submits valid multipart FormData on submission', () => {
        render(<PaymentReferenceForm {...defaultProps} />);

        fireEvent.change(screen.getByLabelText('Payment recipient for request 42'), {
            target: { value: '2' },
        });
        fireEvent.change(screen.getByLabelText('Transfer reference for request 42'), {
            target: { value: 'MAYA-TXN-987654' },
        });

        const validFile = new File(['receipt-data'], 'transfer.webp', { type: 'image/webp' });
        fireEvent.change(screen.getByLabelText('Payment proof screenshot for request 42'), {
            target: { files: [validFile] },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Submit transfer reference' }));

        expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
        const submittedFormData = vi.mocked(defaultProps.onSubmit).mock.calls[0][0] as FormData;
        expect(submittedFormData.get('payment_recipient_id')).toBe('2');
        expect(submittedFormData.get('payment_reference')).toBe('MAYA-TXN-987654');
        expect(submittedFormData.get('payment_transacted_at')).toBeTruthy();
        expect(submittedFormData.get('payment_proof_image')).toBe(validFile);
    });

    it('prefills initial values for retry/resubmission flow', () => {
        render(
            <PaymentReferenceForm
                {...defaultProps}
                initialRecipientId="1"
                initialReference="PREV-REF-123"
                initialTransactedAt="2026-10-10T14:30:00.000Z"
            />,
        );

        const recipientSelect = screen.getByLabelText('Payment recipient for request 42') as HTMLSelectElement;
        expect(recipientSelect.value).toBe('1');

        const referenceInput = screen.getByLabelText('Transfer reference for request 42') as HTMLInputElement;
        expect(referenceInput.value).toBe('PREV-REF-123');

        expect(screen.getByText('Treasurer Juan Dela Cruz')).toBeInTheDocument();
    });
});
