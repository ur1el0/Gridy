import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axiosPrivate } from '../api/axios';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../api/axios', () => ({
    axiosPrivate: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

const ProfileProbe = () => {
    const { user } = useAuth();
    return <div>{user?.barangay?.primary_color ?? 'loading profile'}</div>;
};

describe('AuthContext tenant theme', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        document.documentElement.style.cssText = '';
    });

    it('hydrates the tenant color on refresh and chooses readable text colors', async () => {
        const payload = btoa(JSON.stringify({
            user_id: 7,
            username: 'official',
            role: 'BARANGAY_OFFICIAL',
        }));
        localStorage.setItem('access_token', 'header.' + payload + '.signature');

        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({
            data: {
                id: 7,
                username: 'official',
                role: 'BARANGAY_OFFICIAL',
                barangay: {
                    name: 'Barangay Test',
                    primary_color: '#F1C40F',
                },
            },
        } as never);

        render(
            <AuthProvider>
                <ProfileProbe />
            </AuthProvider>,
        );

        await screen.findByText('#F1C40F');
        await waitFor(() => {
            expect(document.documentElement.style.getPropertyValue('--brand-primary')).toBe('#F1C40F');
        });

        expect(axiosPrivate.get).toHaveBeenCalledWith('/auth/me/');
        expect(document.documentElement.style.getPropertyValue('--brand-primary-foreground')).toBe('#0F172A');
        expect(document.documentElement.style.getPropertyValue('--brand-primary-text')).not.toBe('#F1C40F');
    });
});
