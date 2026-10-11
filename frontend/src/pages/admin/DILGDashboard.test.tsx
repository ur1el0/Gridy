import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axiosPrivate } from '../../api/axios';
import { DILGDashboard } from './DILGDashboard';

vi.mock('../../api/axios', () => ({
    axiosPrivate: { get: vi.fn() },
}));

describe('DILGDashboard', () => {
    beforeEach(() => vi.mocked(axiosPrivate.get).mockReset());

    it('shows a retryable error instead of empty analytics and distinguishes an empty retry result', async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockResolvedValueOnce({ data: [] });

        render(<DILGDashboard />);

        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load DILG analytics.");
        expect(screen.queryByText('No barangay analytics available')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        await waitFor(() => {
            expect(screen.getByText('No barangay analytics available')).toBeInTheDocument();
        });
        expect(axiosPrivate.get).toHaveBeenCalledTimes(2);
    });

    it('renders the existing analytics charts after a successful populated response', async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValue({
            data: [{
                barangay_name: 'Barangay Sample',
                residents: { total: 25, verified: 20 },
                documents: { pending: 3, released: 10 },
                queue: { priority: 1, regular: 2 },
                scenarios: {
                    peace_and_order: 1,
                    public_health: 2,
                    infrastructure: 3,
                    environment: 4,
                    other: 5,
                },
                night_time_incidents: 1,
            }],
        });

        render(<DILGDashboard />);

        expect(await screen.findByText('Population by Barangay')).toBeInTheDocument();
        expect(screen.getByText('Service Load by Barangay')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});
