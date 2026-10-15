import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import { ProtectedRoute } from './ProtectedRoute';

vi.mock('../../context/auth-context', () => ({
    useAuth: vi.fn(),
}));

describe('ProtectedRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sends a Field Official who opens an admin URL to mobile-app guidance', async () => {
        vi.mocked(useAuth).mockReturnValue({
            user: { role: 'FIELD_OFFICIAL' },
            isAuthenticated: true,
        } as never);

        render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <Routes>
                    <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'DILG_ADMIN']} />}>
                        <Route path="/dashboard" element={<p>Admin dashboard</p>} />
                    </Route>
                    <Route path="/field-official-mobile" element={<p>Open KapitBayan on mobile</p>} />
                </Routes>
            </MemoryRouter>,
        );

        expect(await screen.findByText('Open KapitBayan on mobile')).toBeInTheDocument();
        expect(screen.queryByText('Admin dashboard')).not.toBeInTheDocument();
    });
});
