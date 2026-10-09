import { fireEvent, render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AdminLayout } from './AdminLayout';

vi.mock('../../context/auth-context', () => ({
    useAuth: () => ({
        user: { role: 'ADMIN', username: 'staff', full_name: 'Barangay Staff' },
        logout: vi.fn(),
    }),
}));

describe('AdminLayout', () => {
    it('opens the mobile navigation and closes it after a route is chosen', () => {
        render(
            <BrowserRouter>
                <AdminLayout />
            </BrowserRouter>,
        );

        const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
        expect(menuButton).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(menuButton);

        expect(menuButton).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('navigation', { name: 'Mobile administration' })).toBeInTheDocument();

        fireEvent.click(
            within(screen.getByRole('navigation', { name: 'Mobile administration' }))
                .getByRole('link', { name: 'Queue' }),
        );

        expect(menuButton).toHaveAttribute('aria-expanded', 'false');
        expect(document.getElementById('admin-mobile-navigation')).toHaveAttribute('hidden');
    });
});
