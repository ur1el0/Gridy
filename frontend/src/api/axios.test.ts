import { describe, expect, it } from 'vitest';
import { axiosPrivate, axiosPublic, resolveApiBaseUrl } from './axios';

describe('axios client configuration', () => {
    it('configures axiosPrivate with credentials for HttpOnly cookie transmission and targets the /api/v1 prefix', () => {
        expect(axiosPrivate.defaults.withCredentials).toBe(true);
        expect(axiosPrivate.defaults.timeout).toBe(15_000);
        expect(axiosPrivate.defaults.headers['Content-Type']).toBe('application/json');
        expect(axiosPrivate.defaults.baseURL).toMatch(/\/api\/v1$/);
    });

    it('configures axiosPublic with consistent headers and base URL', () => {
        expect(axiosPublic.defaults.timeout).toBe(15_000);
        expect(axiosPublic.defaults.headers['Content-Type']).toBe('application/json');
        expect(axiosPublic.defaults.baseURL).toBe(axiosPrivate.defaults.baseURL);
    });

    it('resolves the expected /api/v1 base URL for same-origin proxy, custom domains, and local fallback', () => {
        // Nginx reverse proxy default used in Docker builds
        expect(resolveApiBaseUrl('/api/v1')).toBe('/api/v1');
        // Custom production domain override
        expect(resolveApiBaseUrl('https://api.example.test/api/v1')).toBe('https://api.example.test/api/v1');
        // Render backend destination override
        expect(resolveApiBaseUrl('https://gridy-backend.onrender.com/api/v1')).toBe('https://gridy-backend.onrender.com/api/v1');
        // Development fallback when unset
        expect(resolveApiBaseUrl('', false)).toBe('http://127.0.0.1:8000/api/v1');
        expect(resolveApiBaseUrl(undefined, false)).toBe('http://127.0.0.1:8000/api/v1');
        // Production fallback when unset (same-origin proxy default)
        expect(resolveApiBaseUrl('', true)).toBe('/api/v1');
        expect(resolveApiBaseUrl(undefined, true)).toBe('/api/v1');
    });
});
