let accessToken: string | null = null;
let accessTokenVersion = 0;

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
