import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CitizenDocuments } from './CitizenDocuments';
import { CitizenLayout } from '../../components/layout/CitizenLayout';
import { AuthProvider } from '../../context/AuthContext';
import { axiosPrivate } from '../../api/axios';

// Mock axiosPrivate
vi.mock('../../api/axios', () => ({
    axiosPrivate: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('Resident Portal Components', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders CitizenLayout header with navigation tabs and branding', () => {
        render(
            <BrowserRouter>
                <AuthProvider>
                    <CitizenLayout />
                </AuthProvider>
            </BrowserRouter>
        );

        // Verify brand and navigation tabs
        expect(screen.getByText('Resident Portal')).toBeInTheDocument();
        expect(screen.getAllByText('Documents & Clearances')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Live Queue Ticker')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Community Bulletin')[0]).toBeInTheDocument();
    });

    it('renders empty state when citizen has no active document requests', async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: { results: [] } });

        render(
            <BrowserRouter>
                <AuthProvider>
                    <CitizenDocuments />
                </AuthProvider>
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('No active document requests')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /request new clearance/i })).toBeInTheDocument();
        });
    });

    it('renders list of active clearance requests when data is returned', async () => {
        const mockRequests = [
            {
                id: 101,
                document_type: 'Barangay Clearance',
                purpose: 'Local Employment Application',
                status: 'READY_FOR_PICKUP',
                admin_notes: 'Ready at Counter 2',
                created_at: '2026-09-06T10:00:00Z',
            },
        ];

        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: { results: mockRequests } });

        render(
            <BrowserRouter>
                <AuthProvider>
                    <CitizenDocuments />
                </AuthProvider>
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Barangay Clearance')).toBeInTheDocument();
            expect(screen.getByText('Local Employment Application')).toBeInTheDocument();
            expect(screen.getByText('Ready / Released')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();
        });
    });
        it('renders cancel button for pending clearance and cancels upon confirmation', async () => {
        const mockRequests = [
            {
                id: 202,
                document_type: 'Certificate of Residency',
                purpose: 'Bank Account Opening',
                status: 'PENDING',
                created_at: '2026-09-06T10:00:00Z',
            },
        ];

        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: { results: mockRequests } });
        vi.mocked(axiosPrivate.delete).mockResolvedValueOnce({ data: {} });
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(
            <BrowserRouter>
                <AuthProvider>
                    <CitizenDocuments />
                </AuthProvider>
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Certificate of Residency')).toBeInTheDocument();
            expect(screen.getByText('Pending Review')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /cancel clearance request #202/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /cancel clearance request #202/i }));

        await waitFor(() => {
            expect(axiosPrivate.delete).toHaveBeenCalledWith('/document-requests/202/');
            expect(screen.queryByText('Certificate of Residency')).not.toBeInTheDocument();
        });
    });
});