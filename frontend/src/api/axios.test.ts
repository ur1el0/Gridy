import { describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { axiosPrivate, axiosPublic, resolveApiBaseUrl } from './axios';
import {
    clearAccessToken,
    clearExplicitLogout,
    EXPLICIT_LOGOUT_KEY,
    getAccessToken,
    setAccessToken,
} from './accessToken';

describe('axios client configuration', () => {
    it('configures axiosPrivate with credentials for HttpOnly cookie transmission and targets the /api/v1 prefix', () => {
        expect(axiosPrivate.defaults.withCredentials).toBe(true);
        expect(axiosPrivate.defaults.timeout).toBe(35_000);
        expect(axiosPrivate.defaults.headers['Content-Type']).toBe('application/json');
        expect(axiosPrivate.defaults.baseURL).toMatch(/\/api\/v1$/);
    });

    it('configures axiosPublic with consistent headers and base URL', () => {
        expect(axiosPublic.defaults.timeout).toBe(35_000);
        expect(axiosPublic.defaults.headers['Content-Type']).toBe('application/json');
        expect(axiosPublic.defaults.withCredentials).toBe(true);
        expect(axiosPublic.defaults.baseURL).toBe(axiosPrivate.defaults.baseURL);
    });

    it('uses the same-origin API proxy in production and permits local development overrides', () => {
        // Nginx reverse proxy default used in Docker builds
        expect(resolveApiBaseUrl('/api/v1')).toBe('/api/v1');
        // Production always uses the first-party proxy, even if an old build variable points at Render.
        expect(resolveApiBaseUrl('https://api.example.test/api/v1', true)).toBe('/api/v1');
        expect(resolveApiBaseUrl('https://gridy-backend.onrender.com/api/v1', true)).toBe('/api/v1');
        // Development fallback when unset
        expect(resolveApiBaseUrl('', false)).toBe('http://localhost:8000/api/v1');
        expect(resolveApiBaseUrl(undefined, false)).toBe('http://localhost:8000/api/v1');
        expect(resolveApiBaseUrl('https://api.example.test/api/v1', false)).toBe('https://api.example.test/api/v1');
        // Production fallback when unset (same-origin proxy default)
        expect(resolveApiBaseUrl('', true)).toBe('/api/v1');
        expect(resolveApiBaseUrl(undefined, true)).toBe('/api/v1');
    });

    it('keeps the access token only in module memory', () => {
        localStorage.clear();
        setAccessToken('short-lived-access-token');

        expect(getAccessToken()).toBe('short-lived-access-token');
        expect(localStorage.getItem('access_token')).toBeNull();

        clearAccessToken();
        expect(getAccessToken()).toBeNull();
    });

    it('refreshes after an unauthorized response and retries with the new in-memory token', async () => {
        clearAccessToken();
        const originalAdapter = axiosPrivate.defaults.adapter;
        const adapter = vi.fn()
            .mockImplementationOnce((config) => Promise.reject({
                config,
                response: { status: 401, data: {}, headers: {}, config },
                isAxiosError: true,
            }))
            .mockImplementationOnce((config) => Promise.resolve({
                config,
                data: { ok: true },
                headers: {},
                status: 200,
                statusText: 'OK',
            }));
        axiosPrivate.defaults.adapter = adapter;
        const refresh = vi.spyOn(axios, 'post').mockResolvedValue({
            data: { access: 'refreshed-access-token' },
        } as never);

        try {
            const response = await axiosPrivate.get('/auth/me/');
            expect(response.data).toEqual({ ok: true });
            expect(refresh).toHaveBeenCalledWith(
                expect.stringMatching(/\/auth\/token\/refresh\/$/),
                {},
                expect.objectContaining({ withCredentials: true }),
            );
            expect(adapter).toHaveBeenCalledTimes(2);
            expect(adapter.mock.calls[1][0].headers.Authorization).toBe('Bearer refreshed-access-token');
            expect(localStorage.getItem('access_token')).toBeNull();
        } finally {
            axiosPrivate.defaults.adapter = originalAdapter;
            refresh.mockRestore();
            clearAccessToken();
        }
    });

    it('does not refresh the HttpOnly session after an explicit logout', async () => {
        clearAccessToken();
        localStorage.setItem(EXPLICIT_LOGOUT_KEY, 'true');
        const originalAdapter = axiosPrivate.defaults.adapter;
        const adapter = vi.fn((config) => Promise.reject({
            config,
            response: { status: 401, data: {}, headers: {}, config },
            isAxiosError: true,
        }));
        axiosPrivate.defaults.adapter = adapter;
        const refresh = vi.spyOn(axios, 'post');

        try {
            await expect(axiosPrivate.get('/auth/me/')).rejects.toThrow('Session was explicitly logged out.');
            expect(refresh).not.toHaveBeenCalled();
        } finally {
            axiosPrivate.defaults.adapter = originalAdapter;
            refresh.mockRestore();
            clearAccessToken();
            clearExplicitLogout();
        }
    });
});
