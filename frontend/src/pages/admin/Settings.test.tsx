import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axiosPrivate } from '../../api/axios';
import { Settings } from './Settings';

vi.mock('../../api/axios', () => ({
    axiosPrivate: {
        get: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('../../components/modals/ChangePasswordModal', () => ({
    ChangePasswordModal: () => null,
}));

const profilePreferences = {
    email_alerts: true,
    push_alerts: false,
};

const activeSession = {
    id: 41,
    ip_address: '192.0.2.10',
    user_agent: 'Chrome Desktop',
    created_at: '2026-10-01T12:00:00Z',
    expires_at: '2026-10-08T12:00:00Z',
    is_revoked: false,
};

const mockSuccessfulLoads = () => {
    vi.mocked(axiosPrivate.get).mockImplementation((url: string) => Promise.resolve(
        url === '/auth/me/'
            ? { data: profilePreferences }
            : { data: { results: [activeSession] } },
    ) as never);
};

describe('Settings load recovery', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSuccessfulLoads();
    });

    it('does not expose default notification preferences after their GET fails', async () => {
        vi.mocked(axiosPrivate.get).mockImplementation((url: string) => Promise.resolve(
            url === '/auth/me/'
                ? Promise.reject(new Error('Network unavailable'))
                : { data: { results: [activeSession] } },
        ) as never);
        render(<Settings />);

        expect(await screen.findByRole('alert')).toHaveTextContent('Could not load notification preferences.');
        expect(screen.queryByText('Email Summaries')).not.toBeInTheDocument();
        expect(screen.queryByText('Push Notifications (Queue Alerts)')).not.toBeInTheDocument();
        expect(screen.getByText('Chrome')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
        expect(axiosPrivate.patch).not.toHaveBeenCalled();
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });

    it('does not claim there are no active sessions when their GET fails', async () => {
        vi.mocked(axiosPrivate.get).mockImplementation((url: string) => Promise.resolve(
            url === '/auth/me/'
                ? { data: profilePreferences }
                : Promise.reject(new Error('Network unavailable')),
        ) as never);
        render(<Settings />);

        expect(await screen.findByRole('alert')).toHaveTextContent('Could not load active sessions.');
        expect(screen.queryByText('No active sessions found.')).not.toBeInTheDocument();
        expect(screen.getByText('Email Summaries')).toBeInTheDocument();
        expect(screen.getByText('Push Notifications (Queue Alerts)')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
        expect(axiosPrivate.patch).not.toHaveBeenCalled();
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });

    it('keeps profile errors visible after a failed retry and clears them after success', async () => {
        let profileReads = 0;
        vi.mocked(axiosPrivate.get).mockImplementation((url: string) => {
            if (url !== '/auth/me/') return Promise.resolve({ data: { results: [activeSession] } }) as never;
            profileReads += 1;
            if (profileReads < 3) return Promise.reject(new Error('Network unavailable')) as never;
            return Promise.resolve({ data: profilePreferences }) as never;
        });
        render(<Settings />);

        expect(await screen.findByRole('alert')).toHaveTextContent('Could not load notification preferences.');
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        await waitFor(() => expect(profileReads).toBe(2));
        expect(screen.getByRole('alert')).toHaveTextContent('Could not load notification preferences.');

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(await screen.findByText('Email Summaries')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByText('Chrome')).toBeInTheDocument();
        expect(vi.mocked(axiosPrivate.get).mock.calls.filter(([url]) => url === '/auth/me/')).toHaveLength(3);
        expect(vi.mocked(axiosPrivate.get).mock.calls.filter(([url]) => url === '/auth/sessions/')).toHaveLength(1);
        expect(axiosPrivate.patch).not.toHaveBeenCalled();
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });

    it('recovers the session list without refetching preferences', async () => {
        let sessionReads = 0;
        vi.mocked(axiosPrivate.get).mockImplementation((url: string) => {
            if (url !== '/auth/sessions/') return Promise.resolve({ data: profilePreferences }) as never;
            sessionReads += 1;
            return sessionReads === 1
                ? Promise.reject(new Error('Network unavailable')) as never
                : Promise.resolve({ data: { results: [activeSession] } }) as never;
        });
        render(<Settings />);

        expect(await screen.findByRole('alert')).toHaveTextContent('Could not load active sessions.');
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByText('Chrome')).toBeInTheDocument();
        expect(screen.queryByText('No active sessions found.')).not.toBeInTheDocument();
        expect(screen.getByText('Email Summaries')).toBeInTheDocument();
        expect(vi.mocked(axiosPrivate.get).mock.calls.filter(([url]) => url === '/auth/sessions/')).toHaveLength(2);
        expect(vi.mocked(axiosPrivate.get).mock.calls.filter(([url]) => url === '/auth/me/')).toHaveLength(1);
        expect(axiosPrivate.patch).not.toHaveBeenCalled();
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });

    it('disables profile retry while its GET is pending', async () => {
        let resolveProfile: (value: unknown) => void = () => {};
        let profileReads = 0;
        vi.mocked(axiosPrivate.get).mockImplementation((url: string) => {
            if (url !== '/auth/me/') return Promise.resolve({ data: { results: [activeSession] } }) as never;
            profileReads += 1;
            if (profileReads === 1) return Promise.reject(new Error('Network unavailable')) as never;
            return new Promise((resolve) => { resolveProfile = resolve; }) as never;
        });
        render(<Settings />);

        fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
        const pendingRetry = await screen.findByRole('button', { name: 'Trying again…' });
        expect(pendingRetry).toBeDisabled();
        expect(axiosPrivate.get).toHaveBeenCalledTimes(3);
        expect(axiosPrivate.patch).not.toHaveBeenCalled();

        resolveProfile({ data: profilePreferences });
        expect(await screen.findByText('Email Summaries')).toBeInTheDocument();
    });

    it('disables session retry while its GET is pending', async () => {
        let resolveSessions: (value: unknown) => void = () => {};
        let sessionReads = 0;
        vi.mocked(axiosPrivate.get).mockImplementation((url: string) => {
            if (url !== '/auth/sessions/') return Promise.resolve({ data: profilePreferences }) as never;
            sessionReads += 1;
            if (sessionReads === 1) return Promise.reject(new Error('Network unavailable')) as never;
            return new Promise((resolve) => { resolveSessions = resolve; }) as never;
        });
        render(<Settings />);

        fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
        const pendingRetry = await screen.findByRole('button', { name: 'Trying again…' });
        expect(pendingRetry).toBeDisabled();
        expect(axiosPrivate.get).toHaveBeenCalledTimes(3);
        expect(axiosPrivate.patch).not.toHaveBeenCalled();
        expect(axiosPrivate.delete).not.toHaveBeenCalled();

        resolveSessions({ data: { results: [activeSession] } });
        expect(await screen.findByText('Chrome')).toBeInTheDocument();
    });
});
