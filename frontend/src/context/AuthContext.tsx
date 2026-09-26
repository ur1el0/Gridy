import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { axiosPrivate } from "../api/axios";

export interface User {
    id?: number | string
    email?: string
    username?: string
    full_name?: string
    role?: string
    barangay?: {
        name?: string
        primary_color?: string
    } | null
}

interface AuthContextType {
    user: User | null
    login: (token: string, userData?: User) => void
    logout: () => Promise<void>
    isAuthenticated: boolean
    updateBarangayPrimaryColor: (primaryColor: string) => void
}

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

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return {
                    id: payload.user_id,
                    username: payload.username,
                    full_name: payload.full_name,
                    role: payload.role,
                };
            } catch (error) {
                console.error("Failed to parse token on load", error);
                localStorage.removeItem('access_token');
            }
        }
        return null;
    });

    useEffect(() => {
        applyBarangayTheme(user?.barangay?.primary_color);
    }, [user?.barangay?.primary_color]);

    useEffect(() => {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken || !user?.id || user.barangay?.primary_color) return;

        let active = true;
        const currentUserId = String(user.id);

        axiosPrivate.get('/auth/me/')
            .then((response) => {
                if (active && String(response.data.id) === currentUserId) {
                    setUser(response.data);
                }
            })
            .catch((error) => {
                if (active) {
                    console.error('Failed to load the authenticated profile', error);
                }
            });

        return () => {
            active = false;
        };
    }, [user?.id, user?.barangay?.primary_color]);

    const login = (token: string, userData?: User) => {
        localStorage.setItem('access_token', token);
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
        try {
            // Tell the backend to blacklist the session and destroy the HttpOnly cookie.
            await axiosPrivate.post('/auth/logout/');
        } catch (error) {
            console.error("Server logout failed, but local state will be cleared.", error);
        } finally {
            localStorage.removeItem('access_token');
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                isAuthenticated: !!user,
                updateBarangayPrimaryColor,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
