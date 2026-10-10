import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { axiosPublic } from '../../api/axios';
import { Register } from './Register';

beforeEach(() => {
    vi.spyOn(axiosPublic, 'get').mockResolvedValue({
        data: [{ id: 2, name: 'Barangay Ibabang Dupay', municipality: 'Lucena City', province: 'Quezon' }],
    } as never);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Register Component (Dual-Mode)', () => {
    it('renders Resident Registration by default with resident fields and LGU service highlights', () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        // Branding & Citizen Badges
        expect(screen.getByText('KapitBayan')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /resident registration/i })).toBeInTheDocument();
        expect(screen.getByText('OFFICIAL CLEARANCES ACCESS')).toBeInTheDocument();
        expect(screen.getByText('REAL-TIME QUEUE TICKETING')).toBeInTheDocument();
        expect(screen.getByText('COMMUNITY PROGRAM UPDATES')).toBeInTheDocument();

        // Right form headings
        expect(screen.getByRole('heading', { level: 2, name: 'Resident Registration' })).toBeInTheDocument();
        expect(screen.getByText('Complete your registration details to access barangay services.')).toBeInTheDocument();

        // Citizen Inputs
        expect(screen.getByPlaceholderText('e.g. Juan Dela Cruz')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('juandelacruz')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('juan@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('0917 123 4567')).toBeInTheDocument();
        expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);

        // Submit Button & Navigation
        expect(screen.getByRole('button', { name: /create resident account/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /log in here/i })).toHaveAttribute('href', '/login');
    });

    it('toggles to Administrative Registration when clicking the mode switch button', async () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        await screen.findByRole('option', { name: /Barangay Ibabang Dupay/ });

        // Click the toggle button to switch to Staff/Admin mode
        const toggleButton = screen.getByTitle('Tap to switch registration type');
        fireEvent.click(toggleButton);

        // Verify Admin Headings and Features
        expect(screen.getByRole('heading', { level: 2, name: 'Administrative Registration' })).toBeInTheDocument();
        expect(screen.getByText('CREDENTIALS VERIFICATION')).toBeInTheDocument();
        expect(screen.getByText('ADMIN ACCESS TIERS')).toBeInTheDocument();
        expect(screen.getByText('SECURITY AUDIT COMPLIANCE')).toBeInTheDocument();

        // Admin-Specific Inputs
        expect(screen.getByPlaceholderText('admin_captain')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        const affirmationCheckbox = screen.getByRole('checkbox', {
            name: /I affirm that I am an authorized barangay official or personnel/i,
        });
        expect(affirmationCheckbox).toBeRequired();
        expect(screen.getByRole('button', { name: /create admin account/i })).toBeInTheDocument();
    });

    it('blocks registration when the approved barangay directory is unavailable', async () => {
        vi.mocked(axiosPublic.get).mockRejectedValueOnce(new Error('offline'));
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        expect(await screen.findByRole('alert')).toHaveTextContent('Approved barangays could not be loaded');
        fireEvent.click(screen.getByRole('checkbox'));
        expect(screen.getByRole('button', { name: /create resident account/i })).toBeDisabled();
    });

    it('validates password mismatch before submission', async () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        const fullNameInput = screen.getByPlaceholderText('e.g. Juan Dela Cruz');
        const usernameInput = screen.getByPlaceholderText('juandelacruz');
        const emailInput = screen.getByPlaceholderText('juan@example.com');
        const [passwordInput, confirmPasswordInput] = screen.getAllByPlaceholderText('••••••••');
        const submitButton = screen.getByRole('button', { name: /create resident account/i });

        fireEvent.change(fullNameInput, { target: { value: 'Juan Dela Cruz' } });
        fireEvent.change(usernameInput, { target: { value: 'juandc' } });
        fireEvent.change(emailInput, { target: { value: 'juan@test.com' } });
        fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword!' } });

        // Dispatch submit directly to trigger the component's onSubmit handler
        fireEvent.submit(submitButton.closest('form')!);

        expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    });

    it('validates affirmation requirement before administrative account submission', async () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        // Switch to Admin mode
        const toggleButton = screen.getByTitle('Tap to switch registration type');
        fireEvent.click(toggleButton);

        const fullNameInput = screen.getByPlaceholderText('e.g. Juan Dela Cruz');
        const usernameInput = screen.getByPlaceholderText('admin_captain');
        const emailInput = screen.getByPlaceholderText('juan@example.com');
        const [passwordInput, confirmPasswordInput] = screen.getAllByPlaceholderText('••••••••');
        const submitButton = screen.getByRole('button', { name: /create admin account/i });

        fireEvent.change(fullNameInput, { target: { value: 'Brgy Kagawad' } });
        fireEvent.change(usernameInput, { target: { value: 'brgy_kagawad' } });
        fireEvent.change(emailInput, { target: { value: 'kagawad@barangay.gov.ph' } });
        fireEvent.change(passwordInput, { target: { value: 'AdminPass123!' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'AdminPass123!' } });

        // Dispatch submit without checking the affirmation checkbox
        fireEvent.submit(submitButton.closest('form')!);

        expect(
            await screen.findByText('You must affirm that you are an authorized barangay official or personnel.')
        ).toBeInTheDocument();
    });

    it('sends accepted privacy consent with resident registration', async () => {
        const postSpy = vi
            .spyOn(axiosPublic, 'post')
            .mockResolvedValue({ data: {} } as never);

        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('e.g. Juan Dela Cruz'), {
            target: { value: 'Juan Dela Cruz' },
        });
        fireEvent.change(screen.getByPlaceholderText('juandelacruz'), {
            target: { value: 'juandc' },
        });
        fireEvent.change(screen.getByPlaceholderText('juan@example.com'), {
            target: { value: 'juan@example.com' },
        });
        await screen.findByRole('option', { name: /Barangay Ibabang Dupay/ });
        fireEvent.change(screen.getByRole('combobox'), {
            target: { value: '2' },
        });

        const [passwordInput, confirmPasswordInput] =
            screen.getAllByPlaceholderText('••••••••');
        fireEvent.change(passwordInput, {
            target: { value: 'Password123!' },
        });
        fireEvent.change(confirmPasswordInput, {
            target: { value: 'Password123!' },
        });

        const birthDateInput =
            document.querySelector<HTMLInputElement>('input[type="date"]');
        expect(birthDateInput).not.toBeNull();
        fireEvent.change(birthDateInput!, {
            target: { value: '1990-01-01' },
        });

        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.submit(
            screen
                .getByRole('button', { name: /create resident account/i })
                .closest('form')!
        );

        await waitFor(() => {
            expect(postSpy).toHaveBeenCalled();
        });

        const [url, payload] = postSpy.mock.calls[0];
        expect(url).toBe('/auth/register/');
        expect(payload).toBeInstanceOf(FormData);

        const formData = payload as FormData;
        expect(formData.get('privacy_consent')).toBe('true');
        expect(formData.get('privacy_consent_version')).toBe('resident-v1');
        expect(formData.get('barangay_id')).toBe('2');
    });
});
