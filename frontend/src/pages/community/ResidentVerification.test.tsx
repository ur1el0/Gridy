import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ResidentVerification from "./ResidentVerification";
import { axiosPrivate } from "../../api/axios";

// 1. Mock the axios instance so we don't make real network calls
vi.mock("../../api/axios", () => ({
    axiosPrivate: {
        get: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
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

    it("requires a reason and sends it with the rejection request", async () => {
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
        vi.mocked(axiosPrivate.delete).mockResolvedValueOnce({ data: {} });

        render(<ResidentVerification />);

        await screen.findByText("Juan Dela Cruz");
        fireEvent.click(screen.getByRole("button", { name: "Reject" }));

        const reasonField = screen.getByRole("textbox", { name: /reason for rejection/i });
        fireEvent.click(screen.getByRole("button", { name: "Confirm Rejection" }));
        expect(axiosPrivate.delete).not.toHaveBeenCalled();

        fireEvent.change(reasonField, {
            target: { value: "  Identity document could not be verified.  " },
        });
        fireEvent.click(screen.getByRole("button", { name: "Confirm Rejection" }));

        await waitFor(() => {
            expect(axiosPrivate.delete).toHaveBeenCalledWith(
                "auth/reject-resident/1/",
                { data: { rejection_reason: "Identity document could not be verified." } },
            );
        });
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
