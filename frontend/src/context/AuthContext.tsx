import React, { createContext, useContext, useState, type ReactNode } from "react";

interface User {
    id?: number
    email?: string
    username?: string
    full_name?: string
    role?: string
}

interface AuthContextType {
    user: User | null
    login: (userData: User) => void
    logout: () => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)
    export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
        const [user, setUser] = useState<User | null>(() => {
            const token = localStorage.getItem('access_token')
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]))
                    // We don't strictly check expiration here because the interceptor will handle refresh
                    return {
                        id: payload.user_id,
                        username: payload.username,
                        full_name: payload.full_name,
                        role: payload.role
                    }
                } catch (e) {
                    console.error("Failed to parse token on load", e)
                    localStorage.removeItem('access_token')
                }
            }
            return null
        })

        const login = (userData: User) => {
            setUser(userData)
        }

        const logout = () => {
            localStorage.removeItem('access_token')
            setUser(null)
        }

        return (
            <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
                {children}
            </AuthContext.Provider>
        )
    }

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}