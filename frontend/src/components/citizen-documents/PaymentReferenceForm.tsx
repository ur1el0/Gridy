import React from 'react';
import type { PaymentRecipient } from './types';

interface PaymentReferenceFormProps {
    requestId: number;
    recipients: PaymentRecipient[];
    selectedRecipientId: string;
    paymentReference: string;
    submitting: boolean;
    onRecipientChange: (value: string) => void;
    onPaymentReferenceChange: (value: string) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export const PaymentReferenceForm: React.FC<PaymentReferenceFormProps> = ({
    requestId,
    recipients,
    selectedRecipientId,
    paymentReference,
    submitting,
    onRecipientChange,
    onPaymentReferenceChange,
    onSubmit,
}) => {
    const selectedRecipient = recipients.find(
        (recipient) => recipient.id === Number(selectedRecipientId),
    );

    return (
        <form className="mt-2 space-y-2" onSubmit={onSubmit}>
            <p>
                Select an official recipient configured by your barangay, follow its
                instructions, and enter your transfer reference. Staff verify the
                transfer manually.
            </p>
            {recipients.length === 0 ? (
                <p role="status" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                    Your barangay has not configured an e-payment recipient. Contact the barangay hall or pay in person.
                </p>
            ) : (
                <>
                    <label className="block text-xs font-semibold text-slate-700">
                        Payment recipient
                        <select
                            required
                            aria-label={`Payment recipient for request ${requestId}`}
                            value={selectedRecipientId}
                            onChange={(event) => onRecipientChange(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                        >
                            <option value="">Select a recipient</option>
                            {recipients.map((recipient) => (
                                <option key={recipient.id} value={recipient.id}>
                                    {recipient.display_name} · {recipient.provider_label}
                                </option>
                            ))}
                        </select>
                    </label>
                    {selectedRecipient && (
                        <div className="rounded-lg bg-white p-3 text-xs text-slate-700">
                            <p className="font-bold">{selectedRecipient.recipient_name}</p>
                            <p>{selectedRecipient.recipient_identifier}</p>
                            {selectedRecipient.instructions && (
                                <p className="mt-1">{selectedRecipient.instructions}</p>
                            )}
                        </div>
                    )}
                    <input
                        required
                        maxLength={100}
                        aria-label={`Transfer reference for request ${requestId}`}
                        value={paymentReference}
                        onChange={(event) => onPaymentReferenceChange(event.target.value)}
                        placeholder="Transfer reference"
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                    />
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                    >
                        {submitting ? 'Submitting…' : 'Submit transfer reference'}
                    </button>
                </>
            )}
        </form>
    );
};
