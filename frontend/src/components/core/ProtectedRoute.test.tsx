import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import { ProtectedRoute } from './ProtectedRoute';

vi.mock('../../context/auth-context', () => ({ useAuth: vi.fn() }));

describe('ProtectedRoute session restoration', () => {
    beforeEach(() => vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isAuthReady: false,
        login: vi.fn(),
        logout: vi.fn(),
        updateBarangayPrimaryColor: vi.fn(),
    }));

    it('waits for the refresh-cookie session check before redirecting to login', () => {
        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/protected" element={<div>Private content</div>} />
                    </Route>
                    <Route path="/login" element={<div>Login form</div>} />
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByRole('status')).toHaveTextContent('Loading page');
        expect(screen.queryByText('Login form')).not.toBeInTheDocument();
        expect(screen.queryByText('Private content')).not.toBeInTheDocument();
    });
});
