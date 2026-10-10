import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { axiosPrivate } from '../../api/axios';
import { AuthContext, type AuthContextType } from '../../context/auth-context';
import { Dashboard } from './Dashboard';

vi.mock('../../api/axios', () => ({
    axiosPrivate: { get: vi.fn() },
}));

const summary = {
    total_residents: 37,
    document_requests: {
        total: 10,
        pending: 4,
        approved: 2,
        rejected: 1,
        released: 3,
        total_revenue: 1250,
    },
    issue_reports: {
        total: 8,
        pending: 2,
        in_progress: 3,
        resolved: 3,
        urgency_breakdown: { low: 1, medium: 2, high: 3, urgent: 2 },
        scenario_breakdown: {
            peace_and_order: 1,
            public_health: 2,
            infrastructure: 3,
            environment: 1,
            other: 1,
        },
        time_of_day: { night_time: 4, day_time: 4 },
    },
    queue_activity: { total_today: 5, serving_now: null, waiting_count: 2 },
    demographics: {
        purok_distribution: { 'Purok 1': 20, 'Purok 2': 17 },
        age_demographics: { youth: 8, young_adult: 10, adult: 12, senior: 7 },
    },
};

const activities = [{
    id: 8,
    title: 'Community Health Day',
    description: 'Barangay health screening',
    location: 'Barangay Hall',
    event_datetime: '2030-01-15T09:00:00Z',
    created_at: '2029-12-01T00:00:00Z',
}];

const makeAuthContext = (role: string): AuthContextType => ({
    user: { role, barangay: { name: 'Cotta' } },
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    isAuthenticated: true,
    updateBarangayPrimaryColor: vi.fn(),
});

const renderDashboard = (role = 'ADMIN') => render(
    <AuthContext.Provider value={makeAuthContext(role)}>
        <MemoryRouter initialEntries={['/admin']}>
            <Routes>
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/dilg-analytics" element={<p>DILG analytics destination</p>} />
            </Routes>
        </MemoryRouter>
    </AuthContext.Provider>,
);

describe('Dashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(axiosPrivate.get)
            .mockResolvedValueOnce({ data: summary } as never)
            .mockResolvedValueOnce({ data: { results: activities } } as never);
    });

    it('renders barangay metrics and scheduled activities from the API', async () => {
        renderDashboard();

        expect(await screen.findByText('Community Health Day')).toBeInTheDocument();
        expect(screen.getByText('Administrative Overview')).toBeInTheDocument();
        expect(screen.getByText('Total Registered Residents')).toBeInTheDocument();
        expect(screen.getByText('37', { exact: true })).toBeInTheDocument();
        expect(screen.getByText('4', { exact: true })).toBeInTheDocument();
        expect(screen.getByText('₱1,250.00')).toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(1, '/dashboard/summary/', expect.anything());
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(2, '/activities/', expect.anything());
    });

    it('redirects DILG admins to the cross-barangay analytics page without fetching barangay data', async () => {
        renderDashboard('DILG_ADMIN');

        expect(await screen.findByText('DILG analytics destination')).toBeInTheDocument();
        expect(axiosPrivate.get).not.toHaveBeenCalled();
    });
});
