import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axiosPrivate } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { BarangaySettings } from './BarangaySettings';

vi.mock('../../api/axios', () => ({
    axiosPrivate: {
        get: vi.fn(),
        patch: vi.fn(),
    },
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

describe('BarangaySettings', () => {
    const updateBarangayPrimaryColor = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            login: vi.fn(),
            logout: vi.fn(async () => {}),
            isAuthenticated: true,
            updateBarangayPrimaryColor,
        });
        vi.mocked(axiosPrivate.get).mockResolvedValue({
            data: {
                results: [{
                    id: 12,
                    name: 'Barangay Test',
                    captain_name: '',
                    office_contact: '',
                    logo: null,
                    city_seal: null,
                    primary_color: '#082B66',
                }],
            },
        } as never);
        vi.mocked(axiosPrivate.patch).mockResolvedValue({
            data: { primary_color: '#C70039' },
        } as never);
    });

    it('saves the selected primary color and updates the active theme', async () => {
        render(<BarangaySettings />);

        const colorInput = await screen.findByLabelText('Primary brand color');
        fireEvent.change(colorInput, { target: { value: '#c70039' } });
        fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

        await waitFor(() => {
            expect(axiosPrivate.patch).toHaveBeenCalled();
            expect(updateBarangayPrimaryColor).toHaveBeenCalledWith('#C70039');
        });

        const formData = vi.mocked(axiosPrivate.patch).mock.calls[0]?.[1] as FormData;
        expect(formData.get('primary_color')).toBe('#C70039');
        expect(await screen.findByText('Settings updated successfully!')).toBeInTheDocument();
    });
});
