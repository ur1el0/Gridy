import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axiosPublic } from '../../api/axios';
import { BarangayApplication } from './BarangayApplication';

vi.mock('../../api/axios', () => ({ axiosPublic: { post: vi.fn() } }));

describe('BarangayApplication', () => {
    beforeEach(() => vi.clearAllMocks());

    it('submits locality and authorized contact details for DILG review', async () => {
        vi.mocked(axiosPublic.post).mockResolvedValue({ data: { id: 2 } } as never);
        render(<BrowserRouter><BarangayApplication /></BrowserRouter>);
        fireEvent.change(screen.getByLabelText('Barangay name'), { target: { value: 'Barangay Mabini' } });
        fireEvent.change(screen.getByLabelText('Municipality or city'), { target: { value: 'Lucena City' } });
        fireEvent.change(screen.getByLabelText('Province'), { target: { value: 'Quezon' } });
        fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Maria Santos' } });
        fireEvent.change(screen.getByLabelText('Official position'), { target: { value: 'Secretary' } });
        fireEvent.change(screen.getByLabelText('Official email'), { target: { value: 'maria@example.com' } });
        fireEvent.change(screen.getByLabelText('Office contact number'), { target: { value: '09170000000' } });
        fireEvent.click(screen.getByRole('button', { name: 'Submit for DILG review' }));

        await waitFor(() => expect(axiosPublic.post).toHaveBeenCalledWith('/auth/barangay-applications/', expect.objectContaining({
            name: 'Barangay Mabini',
            municipality: 'Lucena City',
            applicant_email: 'maria@example.com',
        })));
        expect(await screen.findByRole('status')).toHaveTextContent('Application received.');
    });
});
