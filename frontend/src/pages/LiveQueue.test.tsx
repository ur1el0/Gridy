import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LiveQueue } from "./LiveQueue";
import { axiosPrivate } from "../api/axios";
import { AuthProvider } from "../context/AuthContext";
import { BrowserRouter } from "react-router-dom";

// Mock the axiosPrivate instance
vi.mock('../api/axios', () => ({
  axiosPrivate: {
    get: vi.fn(),
    patch: vi.fn(),
  }
}))

describe('LiveQueue Component', () => {
    it('renders loading state initially and then shows queue data', async () => {
        // Mock the GET request to return some tickets
        const mockTickets = [
            { ticket_id: 1, ticket_number: 'Q-001', service_type: 'Clearance', status: 'WAITING', created_at: '2026-08-14T0B:00:00Z' },
            { ticket_id: 2, ticket_number: 'Q-002', service_type: 'Permit', status: 'SERVING', created_at: '2026-08-14T08:05:00Z' }
        ]
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: { results: mockTickets } })
    render(
      <BrowserRouter>
        <AuthProvider>
          <LiveQueue />
        </AuthProvider>
      </BrowserRouter>
    )
    // Should initially show loading if no tickets
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('Q-002')).toBeInTheDocument()
    })
    // Check if the serving ticket is rendered
    expect(screen.getByText(/now serving/i)).toBeInTheDocument()
    expect(screen.getByText('Permit')).toBeInTheDocument()
    // Check if the waiting list renders
    expect(screen.getByText('Waiting List')).toBeInTheDocument()
    expect(screen.getByText('Q-001')).toBeInTheDocument()
  })
})