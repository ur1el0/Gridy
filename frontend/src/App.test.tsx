import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { beforeEach, describe, it, expect } from 'vitest'
import { Login } from './pages/auth/Login'
import { AuthProvider } from './context/AuthContext'
import { App } from './App'

describe('Login Component', () => {
    it('renders the login form correctly', () => {
        // 1. Render the component in virtual jsdom environment
        render(
            <BrowserRouter>
                <AuthProvider>
                    <Login/>
                </AuthProvider>
            </BrowserRouter>
        )

        // 2. Query the virtual screen for our elements
        const usernameInput = screen.getByPlaceholderText(/Enter your username/i)
        const passwordInput = screen.getByPlaceholderText('........')
        const loginButton = screen.getByRole('button', { name: /login to resident portal/i })

        // 3. Assert that they actually exist in the DOM
        expect(usernameInput).toBeInTheDocument()
        expect(passwordInput).toBeInTheDocument()
        expect(loginButton).toBeInTheDocument()

    })
})

describe('Application routes', () => {
    beforeEach(() => {
        localStorage.clear()
        window.history.replaceState({}, '', '/')
    })

    it('redirects unauthenticated root visitors to the lazy login page', async () => {
        render(<App />)

        expect(
            await screen.findByRole('button', { name: /login to resident portal/i }),
        ).toBeInTheDocument()
    })
})
