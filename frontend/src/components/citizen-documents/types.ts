export interface PaymentRecipient {
    id: number;
    provider: string;
    provider_label: string;
    display_name: string;
    recipient_name: string;
    recipient_identifier: string;
    instructions: string;
}

export interface DocumentRequest {
    id: number;
    document_type: string;
    purpose: string;
    status: string;
    fee_amount?: number | string | null;
    payment_method?: string;
    payment_reference?: string;
    payment_status?: string;
    payment_review_note?: string;
    payment_recipient?: number | null;
    payment_recipient_name_snapshot?: string | null;
    payment_recipient_identifier_snapshot?: string | null;
    payment_instructions_snapshot?: string | null;
    admin_notes?: string;
    created_at: string;
}
