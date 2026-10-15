import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axiosPrivate } from '../api/axios';
import {
    clearAccessToken,
    EXPLICIT_LOGOUT_KEY,
    getAccessToken,
    setAccessToken,
} from '../api/accessToken';
import { AuthProvider } from './AuthContext';
import { useAuth } from './auth-context';

vi.mock('../api/axios', () => ({
    axiosPrivate: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

const AuthProbe = () => {
    const { user, isAuthenticated, isAuthReady, login, logout } = useAuth();
    return (
        <>
            <div>{user?.barangay?.primary_color ?? 'no tenant color'}</div>
            <div>{isAuthenticated ? 'authenticated' : 'signed out'}</div>
            <div>{isAuthReady ? 'auth ready' : 'restoring session'}</div>
            <button type="button" onClick={() => login('valid-token', { id: 7, username: 'official', role: 'ADMIN' })}>Login with valid profile</button>
            <button type="button" onClick={() => login('malformed-token', { id: 7, username: 'official' })}>Login with invalid profile</button>
            <button type="button" onClick={() => void logout()}>Log out</button>
        </>
    );
};

describe('AuthContext tenant theme', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        clearAccessToken();
        document.documentElement.style.cssText = '';
    });

    it('hydrates the tenant color on refresh and chooses readable text colors', async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({
            data: {
                id: 7,
                username: 'official',
                role: 'ADMIN',
                full_name: 'Barangay Official',
                barangay: {
                    name: 'Barangay Test',
                    primary_color: '#F1C40F',
                },
            },
        } as never);

        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>,
        );

        await screen.findByText('#F1C40F');
        expect(screen.getByText('authenticated')).toBeInTheDocument();
        await waitFor(() => {
            expect(document.documentElement.style.getPropertyValue('--brand-primary')).toBe('#F1C40F');
        });

        expect(axiosPrivate.get).toHaveBeenCalledWith('/auth/me/');
        expect(localStorage.getItem('access_token')).toBeNull();
        expect(document.documentElement.style.getPropertyValue('--brand-primary-foreground')).toBe('#0F172A');
        expect(document.documentElement.style.getPropertyValue('--brand-primary-text')).not.toBe('#F1C40F');
    });

    it('rejects an HTML 200 response instead of treating it as an authenticated user', async () => {
        setAccessToken('stale-access-token');
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({
            data: '<!doctype html><html><body><div id="root"></div></body></html>',
        } as never);

        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>,
        );

        expect(await screen.findByText('auth ready')).toBeInTheDocument();
        expect(screen.getByText('signed out')).toBeInTheDocument();
        expect(getAccessToken()).toBeNull();
    });

    it('rejects profile-shaped data with an unsupported role', async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({
            data: { id: 7, username: 'official', role: 'BARANGAY_OFFICIAL' },
        } as never);

        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>,
        );

        expect(await screen.findByText('signed out')).toBeInTheDocument();
        expect(getAccessToken()).toBeNull();
    });

    it('does not authenticate from a login response with an incomplete user profile', () => {
        localStorage.setItem(EXPLICIT_LOGOUT_KEY, 'true');
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        render(
            <AuthProvider restoreSession={false}>
                <AuthProbe />
            </AuthProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Login with invalid profile' }));

        expect(screen.getByText('signed out')).toBeInTheDocument();
        expect(getAccessToken()).toBeNull();
        expect(localStorage.getItem(EXPLICIT_LOGOUT_KEY)).toBe('true');
        expect(consoleError).toHaveBeenCalledWith('Login response did not contain a valid authenticated profile.');
        consoleError.mockRestore();
    });

    it('clears an explicit logout marker after a valid new login', () => {
        localStorage.setItem(EXPLICIT_LOGOUT_KEY, 'true');

        render(
            <AuthProvider restoreSession={false}>
                <AuthProbe />
            </AuthProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Login with valid profile' }));

        expect(screen.getByText('authenticated')).toBeInTheDocument();
        expect(localStorage.getItem(EXPLICIT_LOGOUT_KEY)).toBeNull();
    });

    it('clears an authenticated session when another tab logs out', async () => {
        setAccessToken('active-access-token');
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({
            data: { id: 7, username: 'official', role: 'ADMIN' },
        } as never);

        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>,
        );

        expect(await screen.findByText('authenticated')).toBeInTheDocument();
        window.dispatchEvent(new StorageEvent('storage', {
            key: EXPLICIT_LOGOUT_KEY,
            newValue: 'true',
        }));

        expect(await screen.findByText('signed out')).toBeInTheDocument();
        expect(getAccessToken()).toBeNull();
    });

    it('clears local auth but reports an invalid server logout response', async () => {
        setAccessToken('active-access-token');
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({
            data: { id: 7, username: 'official', role: 'ADMIN' },
        } as never);
        vi.mocked(axiosPrivate.post).mockResolvedValueOnce({
            data: '<!doctype html><html><body>Vercel fallback</body></html>',
        } as never);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        const { unmount } = render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>,
        );

        expect(await screen.findByText('authenticated')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

        expect(await screen.findByText('signed out')).toBeInTheDocument();
        expect(getAccessToken()).toBeNull();
        expect(consoleError).toHaveBeenCalledWith('Server logout failed, but local state will be cleared.');
        expect(localStorage.getItem(EXPLICIT_LOGOUT_KEY)).toBe('true');
        consoleError.mockRestore();

        unmount();
        vi.mocked(axiosPrivate.get).mockClear();
        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>,
        );

        expect(await screen.findByText('auth ready')).toBeInTheDocument();
        expect(screen.getByText('signed out')).toBeInTheDocument();
        expect(axiosPrivate.get).not.toHaveBeenCalled();
    });

    it('accepts the backend logout confirmation', async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({
            data: { id: 7, username: 'official', role: 'ADMIN' },
        } as never);
        vi.mocked(axiosPrivate.post).mockResolvedValueOnce({
            data: { detail: 'Successfully logged out.' },
        } as never);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>,
        );

        expect(await screen.findByText('authenticated')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

        expect(await screen.findByText('signed out')).toBeInTheDocument();
        expect(getAccessToken()).toBeNull();
        expect(consoleError).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });
});
