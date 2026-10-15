let accessToken: string | null = null;
let accessTokenVersion = 0;
export const EXPLICIT_LOGOUT_KEY = 'gridy.explicitly_logged_out';

export function hasExplicitLogout(): boolean {
    try {
        return typeof localStorage !== 'undefined' && localStorage.getItem(EXPLICIT_LOGOUT_KEY) === 'true';
    } catch {
        return false;
    }
}

export function markExplicitLogout(): void {
    try {
        localStorage.setItem(EXPLICIT_LOGOUT_KEY, 'true');
    } catch {
        // In-memory logout still applies if browser storage is unavailable.
    }
}

export function clearExplicitLogout(): void {
    try {
        localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
    } catch {
        // Login still proceeds if browser storage is unavailable.
    }
}

export function getAccessToken(): string | null {
    return accessToken;
}

export function setAccessToken(token: string): void {
    accessToken = token;
    accessTokenVersion += 1;
}

export function clearAccessToken(): void {
    accessToken = null;
    accessTokenVersion += 1;
}

export function getAccessTokenVersion(): number {
    return accessTokenVersion;
}
