import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppointmentsTable } from './AppointmentsTable';

describe('AppointmentsTable', () => {
    it('shows a retryable error instead of the successful-empty row after a failed read', () => {
        const onRetry = vi.fn();
        render(
            <MemoryRouter>
                <AppointmentsTable activities={[]} loading={false} loadError onRetry={onRetry} retrying={false} />
            </MemoryRouter>,
        );

        expect(screen.getByRole('alert')).toHaveTextContent("We couldn't load today's appointments.");
        expect(screen.queryByText('No appointments or activities scheduled.')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(onRetry).toHaveBeenCalledOnce();
    });

    it('keeps the successful-empty row when the read succeeds with no activities', () => {
        render(
            <MemoryRouter>
                <AppointmentsTable activities={[]} loading={false} loadError={false} onRetry={vi.fn()} retrying={false} />
            </MemoryRouter>,
        );

        expect(screen.getByText('No appointments or activities scheduled.')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('does not show the successful-empty row while activities are loading', () => {
        render(
            <MemoryRouter>
                <AppointmentsTable activities={[]} loading loadError={false} onRetry={vi.fn()} retrying={false} />
            </MemoryRouter>,
        );

        expect(screen.getByRole('status')).toHaveTextContent('Loading appointments…');
        expect(screen.queryByText('No appointments or activities scheduled.')).not.toBeInTheDocument();
    });
});
