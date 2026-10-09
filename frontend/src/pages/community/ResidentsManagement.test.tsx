import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResidentsManagement } from "./ResidentsManagement";
import { axiosPrivate } from "../../api/axios";

vi.mock("../../api/axios", () => ({
    axiosPrivate: {
        get: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        post: vi.fn(),
    },
}));

describe("ResidentsManagement Component", () => {
    const mockResidents = [
        {
            id: 1,
            username: "juandc",
            email: "juan@example.com",
            full_name: "Juan Dela Cruz",
            birth_date: "1990-05-15",
            voter_status: true,
            contact_number: "09171234567",
            purok: "Purok 1",
            is_verified: true,
            philsys_id_number: "1234-5678-9012-3456",
        },
        {
            id: 2,
            username: "mariac",
            email: "maria@example.com",
            full_name: "Maria Clara",
            birth_date: "1995-10-20",
            voter_status: false,
            contact_number: "09187654321",
            purok: "Purok 2",
            is_verified: false,
            philsys_id_number: null,
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders directory list and search/filter inputs", async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: { results: mockResidents } });

        render(<ResidentsManagement />);

        expect(screen.getByText("Loading directory...")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("Residents Directory & RBI")).toBeInTheDocument();
            expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
            expect(screen.getByText("Maria Clara")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("Search name, PhilSys ID, purok...")).toBeInTheDocument();
        });

        // Test search filter
        const searchInput = screen.getByPlaceholderText("Search name, PhilSys ID, purok...");
        fireEvent.change(searchInput, { target: { value: "Juan" } });

        expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
        expect(screen.queryByText("Maria Clara")).not.toBeInTheDocument();
    });

    it("opens and closes resident detail modal with demographic data", async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: { results: mockResidents } });

        render(<ResidentsManagement />);

        await screen.findByText("Juan Dela Cruz");

        // Click on the resident row to open detail modal
        fireEvent.click(screen.getByText("Juan Dela Cruz"));

        await waitFor(() => {
            expect(screen.getByText("Personal Demographics")).toBeInTheDocument();
            expect(screen.getByText("1990-05-15")).toBeInTheDocument();
            expect(screen.getByText("Registered Voter")).toBeInTheDocument();
            expect(screen.getByDisplayValue("juan@example.com")).toBeInTheDocument();
        });

        // Close modal
        fireEvent.click(screen.getByRole("button", { name: "Close Dossier" }));

        await waitFor(() => {
            expect(screen.queryByText("Personal Demographics")).not.toBeInTheDocument();
        });
    });

    it("opens and closes import CSV modal", async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: { results: mockResidents } });

        render(<ResidentsManagement />);

        await screen.findByText("Residents Directory & RBI");

        fireEvent.click(screen.getByRole("button", { name: /import csv/i }));

        expect(screen.getByText("Import Census / RBI Records")).toBeInTheDocument();
        expect(screen.getByText("Download Template")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

        await waitFor(() => {
            expect(screen.queryByText("Import Census / RBI Records")).not.toBeInTheDocument();
        });
    });

    it("triggers delete resident flow and removes record on confirmation", async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: { results: mockResidents } });
        vi.mocked(axiosPrivate.delete).mockResolvedValueOnce({ data: {} });
        vi.spyOn(window, "confirm").mockReturnValue(true);

        render(<ResidentsManagement />);

        await screen.findByText("Juan Dela Cruz");

        const deleteButtons = screen.getAllByTitle("Delete Resident");
        fireEvent.click(deleteButtons[0]);

        expect(window.confirm).toHaveBeenCalledWith(
            "Are you sure you want to permanently remove this resident? This will revoke all their access."
        );

        await waitFor(() => {
            expect(axiosPrivate.delete).toHaveBeenCalledWith("/auth/resident/1/");
            expect(screen.queryByText("Juan Dela Cruz")).not.toBeInTheDocument();
            expect(screen.getByText("Maria Clara")).toBeInTheDocument();
        });
    });
});
