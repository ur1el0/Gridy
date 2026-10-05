import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { LiveQueue } from "./LiveQueue";
import { axiosPrivate } from "../../api/axios";
import { useAuth } from "../../context/auth-context";
import { BrowserRouter } from "react-router-dom";

vi.mock('../../api/axios', () => ({
    axiosPrivate: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock('../../context/auth-context', () => ({
    useAuth: vi.fn(),
}));

const mockTickets = [
    {
        ticket_id: 1,
        ticket_number: 'Q-001',
        service_type: 'Clearance',
        resident_name: 'Resident One',
        status: 'WAITING',
        is_priority: false,
        created_at: '2026-08-14T08:00:00Z',
    },
    {
        ticket_id: 2,
        ticket_number: 'Q-002',
        service_type: 'Permit',
        resident_name: 'Resident Two',
        status: 'SERVING',
        is_priority: false,
        created_at: '2026-08-14T08:05:00Z',
    },
];

const mockAuth = (role: string) => {
    vi.mocked(useAuth).mockReturnValue({
        user: { role },
        login: vi.fn(),
        logout: vi.fn(async () => {}),
        isAuthenticated: true,
        updateBarangayPrimaryColor: vi.fn(),
    });
};

const renderQueue = (role = 'ADMIN') => {
    mockAuth(role);
    return render(
        <BrowserRouter>
            <LiveQueue />
        </BrowserRouter>,
    );
};

describe('LiveQueue Component', () => {
    beforeEach(() => {
        vi.mocked(axiosPrivate.get).mockReset();
        vi.mocked(axiosPrivate.post).mockReset();
        vi.mocked(axiosPrivate.delete).mockReset();
        vi.mocked(axiosPrivate.get).mockResolvedValue({
            data: { results: mockTickets },
        } as never);
        vi.mocked(axiosPrivate.post).mockResolvedValue({ data: {} } as never);
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it('renders queue data and does not offer a call-specific skip action', async () => {
        renderQueue();

        expect(await screen.findByText('Q-002')).toBeInTheDocument();
        expect(screen.getByText(/now serving/i)).toBeInTheDocument();
        expect(screen.getByText('Permit')).toBeInTheDocument();
        expect(screen.getByText('Waiting List')).toBeInTheDocument();
        expect(screen.getByText('Q-001')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /call q-001/i })).not.toBeInTheDocument();
    });

    it('requires an admin-entered reason and uses the audited priority endpoint', async () => {
        renderQueue('ADMIN');

        fireEvent.click(await screen.findByRole('button', { name: 'Grant priority for Q-001' }));
        fireEvent.change(screen.getByLabelText(/reason for granting priority/i), {
            target: { value: 'Eligibility checked at the service desk.' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save priority change' }));

        await waitFor(() => {
            expect(axiosPrivate.post).toHaveBeenCalledWith('/tickets/1/priority/', {
                priority_status: 'priority',
                reason: 'Eligibility checked at the service desk.',
            });
        });
    });

    it('does not show priority assignment controls to a field official', async () => {
        renderQueue('FIELD_OFFICIAL');

        expect(await screen.findByText('Q-001')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /grant priority/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /remove priority/i })).not.toBeInTheDocument();
    });

    it('advances through the server queue-order endpoint', async () => {
        vi.mocked(axiosPrivate.post).mockResolvedValueOnce({
            data: { current_ticket: 'Q-001' },
        } as never);
        renderQueue('FIELD_OFFICIAL');

        fireEvent.click(await screen.findByRole('button', { name: /next queue/i }));

        await waitFor(() => {
            expect(axiosPrivate.post).toHaveBeenCalledWith('/tickets/next/');
            expect(screen.getByText('Now serving ticket Q-001')).toBeInTheDocument();
        });
    });

    it('polls tickets every three seconds and clears the interval on unmount', async () => {
        vi.useFakeTimers();
        renderQueue();

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(axiosPrivate.get).toHaveBeenCalledTimes(1);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(3000);
        });
        expect(axiosPrivate.get).toHaveBeenCalledTimes(2);

        cleanup();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(3000);
        });
        expect(axiosPrivate.get).toHaveBeenCalledTimes(2);
    });
});
