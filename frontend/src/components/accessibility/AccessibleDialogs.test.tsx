import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DocumentRequest } from '../../pages/services/DocumentRequests';
import { NewDocumentRequestModal } from '../citizen-documents/NewDocumentRequestModal';
import { ReviewDocumentModal } from '../documents/ReviewDocumentModal';
import { NewTicketModal } from '../queue/NewTicketModal';

describe('accessible modal names', () => {
    it('names the manual queue entry dialog', () => {
        render(
            <NewTicketModal
                handleCloseManualModal={vi.fn()}
                handleCreateManualTicket={vi.fn()}
                searchResident=""
                setSearchResident={vi.fn()}
                serviceRequired=""
                setServiceRequired={vi.fn()}
                canManagePriority={false}
                priorityStatus="regular"
                setPriorityStatus={vi.fn()}
                priorityReason=""
                setPriorityReason={vi.fn()}
                notes=""
                setNotes={vi.fn()}
                isSubmittingNew={false}
            />,
        );

        expect(screen.getByRole('dialog', { name: 'Manual Queue Entry' })).toBeInTheDocument();
    });

    it('names the clearance request dialog', () => {
        render(
            <NewDocumentRequestModal
                documentType="Barangay Clearance"
                purpose="Employment"
                submitting={false}
                onDocumentTypeChange={vi.fn()}
                onPurposeChange={vi.fn()}
                onClose={vi.fn()}
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.getByRole('dialog', { name: 'Request Official Clearance' })).toBeInTheDocument();
    });

    it('names the document review dialog', () => {
        const request: DocumentRequest = {
            id: 42,
            document_type: 'Barangay Clearance',
            status: 'PENDING',
            created_at: '2026-10-10T00:00:00Z',
        };

        render(
            <ReviewDocumentModal
                selectedRequest={request}
                closeModal={vi.fn()}
                getStatusBadge={() => ''}
                handleStatusUpdate={vi.fn()}
                handlePaymentReview={vi.fn()}
                isUpdating={false}
                handleDownloadPDF={vi.fn()}
            />,
        );

        expect(screen.getByRole('dialog', { name: 'Request #42' })).toBeInTheDocument();
    });
});
