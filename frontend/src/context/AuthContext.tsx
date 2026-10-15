import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { AuthContext, type User } from "./auth-context";
import { axiosPrivate } from "../api/axios";
import { clearAccessToken, setAccessToken } from "../api/accessToken";

const DEFAULT_PRIMARY_COLOR = '#082B66';

const applyBarangayTheme = (primaryColor?: string) => {
    const color =
        primaryColor && /^#[0-9a-fA-F]{6}$/.test(primaryColor)
            ? primaryColor.toUpperCase()
            : DEFAULT_PRIMARY_COLOR;

    const red = Number.parseInt(color.slice(1, 3), 16);
    const green = Number.parseInt(color.slice(3, 5), 16);
    const blue = Number.parseInt(color.slice(5, 7), 16);

    const linearize = (channel: number) => {
        const value = channel / 255;
        return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
    };

    const luminance =
        0.2126 * linearize(red) +
        0.7152 * linearize(green) +
        0.0722 * linearize(blue);

    const whiteContrast = 1.05 / (luminance + 0.05);
    const darkContrast = (luminance + 0.05) / (linearize(15) + 0.05);
    const foreground = darkContrast >= whiteContrast ? '#0F172A' : '#FFFFFF';

    let primaryTextColor = color;
    if (whiteContrast < 4.5) {
        let lowerScale = 0;
        let upperScale = 1;
        for (let index = 0; index < 24; index += 1) {
            const scale = (lowerScale + upperScale) / 2;
            const scaledLuminance =
                0.2126 * linearize(red * scale) +
                0.7152 * linearize(green * scale) +
                0.0722 * linearize(blue * scale);
            if (1.05 / (scaledLuminance + 0.05) >= 4.5) {
                lowerScale = scale;
            } else {
                upperScale = scale;
            }
        }
        primaryTextColor =
            '#' +
            [red, green, blue]
                .map((channel) =>
                    Math.round(channel * lowerScale)
                        .toString(16)
                        .padStart(2, '0'),
                )
                .join('')
                .toUpperCase();
    }

    const hoverChannels = [red, green, blue].map((channel) =>
        foreground === '#FFFFFF'
            ? Math.round(channel * 0.85)
            : Math.round(channel + (255 - channel) * 0.15),
    );

    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--brand-primary', color);
    rootStyle.setProperty('--brand-primary-rgb', red + ' ' + green + ' ' + blue);
    rootStyle.setProperty(
        '--brand-primary-hover',
        'rgb(' + hoverChannels.join(' ') + ')',
    );
    rootStyle.setProperty('--brand-primary-foreground', foreground);
    rootStyle.setProperty('--brand-primary-text', primaryTextColor);
};

interface AuthProviderProps {
    children: ReactNode;
    restoreSession?: boolean;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, restoreSession = true }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(!restoreSession);
    const authActionVersion = useRef(0);

    useEffect(() => {
        applyBarangayTheme(user?.barangay?.primary_color);
    }, [user?.barangay?.primary_color]);

    useEffect(() => {
        if (!restoreSession) return;
        let active = true;
        const initialActionVersion = authActionVersion.current;

        const handleSessionExpired = () => {
            authActionVersion.current += 1;
            clearAccessToken();
            setUser(null);
            setIsAuthReady(true);
        };
        window.addEventListener('gridy:session-expired', handleSessionExpired);

        axiosPrivate.get('/auth/me/')
            .then((response) => {
                if (active && authActionVersion.current === initialActionVersion) {
                    setUser(response.data);
                }
            })
            .catch((error) => {
                if (active && authActionVersion.current === initialActionVersion) {
                    clearAccessToken();
                    setUser(null);
                }
                if (error?.response?.status !== 401) {
                    console.error('Failed to load the authenticated profile');
                }
            })
            .finally(() => {
                if (active && authActionVersion.current === initialActionVersion) {
                    setIsAuthReady(true);
                }
            });

        return () => {
            active = false;
            window.removeEventListener('gridy:session-expired', handleSessionExpired);
        };
    }, [restoreSession]);

    const login = (token: string, userData?: User) => {
        authActionVersion.current += 1;
        setAccessToken(token);
        setIsAuthReady(true);
        if (userData) {
            setUser(userData);
        } else {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({
                    id: payload.user_id,
                    username: payload.username,
                    full_name: payload.full_name,
                    role: payload.role,
                });
            } catch (error) {
                console.error("Failed to parse token payload", error);
            }
        }
    };

    const updateBarangayPrimaryColor = (primaryColor: string) => {
        setUser((currentUser) => {
            if (!currentUser) return currentUser;

            return {
                ...currentUser,
                barangay: {
                    ...(currentUser.barangay ?? {}),
                    primary_color: primaryColor,
                },
            };
        });
    };

    const logout = async () => {
        authActionVersion.current += 1;
        try {
            // Tell the backend to blacklist the session and destroy the HttpOnly cookie.
            await axiosPrivate.post('/auth/logout/');
        } catch (error) {
            console.error("Server logout failed, but local state will be cleared.", error);
        } finally {
            clearAccessToken();
            setUser(null);
            setIsAuthReady(true);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                isAuthenticated: !!user,
                isAuthReady,
                updateBarangayPrimaryColor,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
