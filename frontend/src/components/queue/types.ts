export interface QueueTicket {
    ticket_id: number;
    ticket_number: string;
    resident_name?: string;
    service_type: string;
    priority_status?: string;
    is_priority?: boolean;
    status: string;
    created_at: string;
    updated_at?: string;
}
