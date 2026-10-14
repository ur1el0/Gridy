import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, it, expect, vi } from "vitest";
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
    beforeEach(() => {
        vi.mocked(axiosPrivate.get).mockReset();
        vi.mocked(axiosPrivate.patch).mockReset();
        vi.mocked(axiosPrivate.delete).mockReset();
    });

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
        expect(
            screen.getByRole("combobox", { name: "Filter residents by purok" }),
        ).toBeInTheDocument();
    });

    it("shows a retryable load error and recovers without reporting zero pending residents", async () => {
        const resident = {
            id: 9,
            full_name: "Lina Reyes",
            birth_date: "1994-05-07",
            voter_status: true,
            contact_number: "09123456789",
            purok: "2",
            is_verified: false,
            guardian: null,
        };
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error("Network unavailable"))
            .mockRejectedValueOnce(new Error("Network unavailable"))
            .mockResolvedValueOnce({ data: { results: [resident] } });

        render(<ResidentVerification />);

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "We couldn't load pending resident verifications.",
        );
        expect(screen.queryByText("0 Pending Verification")).not.toBeInTheDocument();
        expect(
            screen.queryByText("No pending verifications match your filters."),
        ).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "We couldn't load pending resident verifications.",
        );

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(await screen.findByText("Lina Reyes")).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenCalledTimes(3);
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(1, "auth/pending-residents/");
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(2, "auth/pending-residents/");
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(3, "auth/pending-residents/");
    });

    it("keeps the verification empty state for a successful empty response", async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: { results: [] } });

        render(<ResidentVerification />);

        expect(
            await screen.findByText("No pending verifications match your filters."),
        ).toBeInTheDocument();
        expect(screen.getByText("0 Pending Verification")).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("opens the resident dossier and approves from the inspected view", async () => {
        const resident = {
            id: 3,
            full_name: "Ana Santos",
            birth_date: "1992-03-04",
            voter_status: true,
            contact_number: "09123456789",
            purok: "4",
            is_verified: false,
            guardian: null,
        };
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: { results: [resident] } });
        vi.mocked(axiosPrivate.patch).mockResolvedValueOnce({ data: {} });

        render(<ResidentVerification />);

        await screen.findByText("Ana Santos");
        fireEvent.click(screen.getByRole("button", { name: "Inspect" }));

        const dossier = screen.getByRole("dialog", { name: "Ana Santos" });
        expect(dossier).toHaveTextContent("Applicant Dossier & Verification Proofs");
        fireEvent.click(screen.getByRole("button", { name: "Approve Registration" }));

        await waitFor(() => {
            expect(axiosPrivate.patch).toHaveBeenCalledWith("auth/verify-resident/3/");
            expect(screen.queryByRole("dialog", { name: "Ana Santos" })).not.toBeInTheDocument();
            expect(screen.queryByText("Ana Santos")).not.toBeInTheDocument();
        });
    });
});
