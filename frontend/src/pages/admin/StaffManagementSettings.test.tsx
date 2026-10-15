import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axiosPrivate } from '../../api/axios';
import { StaffManagementSettings } from './StaffManagementSettings';

vi.mock('../../api/axios', () => ({
    axiosPrivate: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

describe('StaffManagementSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(axiosPrivate.get).mockResolvedValue({ data: [] } as never);
    });

    it('renders empty state when no staff members exist', async () => {
        render(<StaffManagementSettings />);
        expect(await screen.findByText('No field officials registered yet')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Barangay Field Officials & Staff' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Register Field Official' })).toBeEnabled();
    });

    it('submits new field official payload and adds it to the list', async () => {
        const createdStaff = {
            id: 10,
            username: 'tanod_carding',
            email: 'carding@barangay.gov.ph',
            first_name: 'Ricardo',
            last_name: 'Dalisay',
            full_name: 'Ricardo Dalisay',
            role: 'FIELD_OFFICIAL',
            is_active: true,
            date_joined: '2026-10-15T08:00:00Z',
            last_login: null,
        };
        vi.mocked(axiosPrivate.post).mockResolvedValueOnce({ data: createdStaff } as never);

        render(<StaffManagementSettings />);
        await screen.findByText('No field officials registered yet');

        fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Ricardo' } });
        fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Dalisay' } });
        fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'tanod_carding' } });
        fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'carding@barangay.gov.ph' } });
        fireEvent.change(screen.getByLabelText('Initial Password'), { target: { value: 'Password123!' } });

        fireEvent.click(screen.getByRole('button', { name: 'Register Field Official' }));

        await waitFor(() => {
            expect(axiosPrivate.post).toHaveBeenCalledWith('/auth/staff/', {
                first_name: 'Ricardo',
                last_name: 'Dalisay',
                username: 'tanod_carding',
                email: 'carding@barangay.gov.ph',
                password: 'Password123!',
            });
        });

        expect(await screen.findByText("Field official account 'tanod_carding' created successfully.")).toBeInTheDocument();
        expect(screen.getByText('Ricardo Dalisay')).toBeInTheDocument();
        expect(screen.getByText('@tanod_carding')).toBeInTheDocument();
    });

    it('renders existing staff and toggles active status', async () => {
        const staff = {
            id: 5,
            username: 'tanod_juan',
            email: 'juan@barangay.gov.ph',
            first_name: 'Juan',
            last_name: 'Dela Cruz',
            full_name: 'Juan Dela Cruz',
            role: 'FIELD_OFFICIAL',
            is_active: true,
            date_joined: '2026-10-15T08:00:00Z',
            last_login: null,
        };
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: [staff] } as never);
        vi.mocked(axiosPrivate.post).mockResolvedValueOnce({
            data: { ...staff, is_active: false },
        } as never);

        render(<StaffManagementSettings />);
        expect(await screen.findByText('Juan Dela Cruz')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();

        const deactivateBtn = screen.getByRole('button', { name: 'Deactivate' });
        fireEvent.click(deactivateBtn);

        await waitFor(() => {
            expect(axiosPrivate.post).toHaveBeenCalledWith('/auth/staff/5/toggle-status/');
        });

        expect(await screen.findByText("Field official 'tanod_juan' is now inactive.")).toBeInTheDocument();
        expect(screen.getByText('Deactivated')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Activate' })).toBeInTheDocument();
    });

    it('shows a retryable load alert on network error', async () => {
        vi.mocked(axiosPrivate.get).mockRejectedValueOnce(new Error('Network error'));
        render(<StaffManagementSettings />);

        expect(await screen.findByRole('alert')).toHaveTextContent('Could not load field officials list.');
        expect(screen.queryByText('No field officials registered yet')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Register Field Official' })).toBeEnabled();
    });
});
