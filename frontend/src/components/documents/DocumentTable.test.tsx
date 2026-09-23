import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DocumentTable } from './DocumentTable';
import type { DocumentRequest } from '../../pages/services/DocumentRequests';

const mockRequests: DocumentRequest[] = [
    {
        id: 1,
        requester_name: 'Juan Dela Cruz',
        purok: 'Purok 1',
        document_type: 'Barangay Clearance',
        or_number: 'OR-1001',
        status: 'RELEASED',
        created_at: '2026-09-20T10:00:00Z',
    },
    {
        id: 2,
        requester_name: 'Maria Clara',
        purok: 'Purok 2',
        document_type: 'Certificate of Indigency',
        or_number: '',
        status: 'PENDING',
        created_at: '2026-09-21T11:00:00Z',
    },
    {
        id: 3,
        requester_name: 'Pedro Penduko',
        purok: 'Purok 3',
        document_type: 'Residency Certificate',
        or_number: '',
        status: 'REJECTED',
        created_at: '2026-09-22T12:00:00Z',
    },
];

const mockGetStatusBadge = (status: string) => `badge-${status.toLowerCase()}`;

describe('DocumentTable Component', () => {
    it('renders clearance requests correctly in the table', () => {
        const mockOpenModal = vi.fn();
        render(
            <DocumentTable 
                requests={mockRequests}
                openModal={mockOpenModal}
                getStatusBadge={mockGetStatusBadge}
            />
        );

        expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
        expect(screen.getByText('Maria Clara')).toBeInTheDocument();
        expect(screen.getByText('Pedro Penduko')).toBeInTheDocument();
        expect(screen.getByText('RELEASED')).toBeInTheDocument();
        expect(screen.getByText('PENDING')).toBeInTheDocument();
        expect(screen.getByText('REJECTED')).toBeInTheDocument();
    });

    it('renders delete button only for RELEASED and REJECTED requests', () => {
        const mockOpenModal = vi.fn();
        const mockOnDelete = vi.fn();

        render(
            <DocumentTable 
                requests={mockRequests}
                openModal={mockOpenModal}
                getStatusBadge={mockGetStatusBadge}
                onDelete={mockOnDelete}
            />
        );

        // Delete button should exist for #1 (RELEASED) and #3 (REJECTED)
        expect(screen.getByLabelText('Delete request #1')).toBeInTheDocument();
        expect(screen.getByLabelText('Delete request #3')).toBeInTheDocument();

        // Delete button should NOT exist for #2 (PENDING)
        expect(screen.queryByLabelText('Delete request #2')).not.toBeInTheDocument();
    });

    it('triggers onDelete without firing openModal when delete button is clicked', () => {
        const mockOpenModal = vi.fn();
        const mockOnDelete = vi.fn();

        render(
            <DocumentTable 
                requests={mockRequests}
                openModal={mockOpenModal}
                getStatusBadge={mockGetStatusBadge}
                onDelete={mockOnDelete}
            />
        );

        const deleteBtn = screen.getByLabelText('Delete request #1');
        fireEvent.click(deleteBtn);

        // onDelete should be called with request ID 1
        expect(mockOnDelete).toHaveBeenCalledTimes(1);
        expect(mockOnDelete).toHaveBeenCalledWith(1);

        // openModal should NOT have been called due to e.stopPropagation()
        expect(mockOpenModal).not.toHaveBeenCalled();
    });

    it('triggers openModal when clicking on the row itself', () => {
        const mockOpenModal = vi.fn();
        const mockOnDelete = vi.fn();

        render(
            <DocumentTable 
                requests={mockRequests}
                openModal={mockOpenModal}
                getStatusBadge={mockGetStatusBadge}
                onDelete={mockOnDelete}
            />
        );

        const row = screen.getByText('Juan Dela Cruz').closest('tr')!;
        fireEvent.click(row);

        expect(mockOpenModal).toHaveBeenCalledTimes(1);
        expect(mockOpenModal).toHaveBeenCalledWith(mockRequests[0]);
    });
});

