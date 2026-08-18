import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ResidentVerification from "./ResidentVerification";
import { axiosPrivate } from "../api/axios";

// 1. Mock the axios instance so we don't make real network calls
vi.mock("../api/axios", () => ({
    axiosPrivate: {
        get: vi.fn(),
        patch: vi.fn(),
    },
}));

describe("ResidentVerification Component", () => {
    it("should render the loading state initially", () => {
        // Setup the mock to never resolve immediately so we can see the loading state
        vi.mocked(axiosPrivate.get).mockImplementationOnce(() => new Promise(() => {}));
        
        render(<ResidentVerification />);
        
        // We look for the spinning loader container or text if we had it
        // Since it's a CSS spinner, we can just check if it renders without crashing
        expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it("should render pending residents table when data is fetched", async () => {
        // Setup mock data simulating a pending resident
        const mockResidents = [
            {
                id: 1,
                full_name: "Juan Dela Cruz",
                birth_date: "1990-01-01",
                voter_status: true,
                contact_number: "09123456789",
                purok: "3",
                is_verified: false,
                guardian: null
            }
        ];

        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: { results: mockResidents } });

        render(<ResidentVerification />);

        // Wait for the table to render and verify the mock data appears
        await waitFor(() => {
            expect(screen.getByText("Resident Verification")).toBeInTheDocument();
            expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
            expect(screen.getAllByText("Purok 3")[0]).toBeInTheDocument();
        });
    });
});
