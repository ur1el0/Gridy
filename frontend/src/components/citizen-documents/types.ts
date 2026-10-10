export interface PaymentRecipient {
    id: number;
    provider: string;
    provider_label: string;
    display_name: string;
    recipient_name: string;
    recipient_identifier: string;
    instructions: string;
}
