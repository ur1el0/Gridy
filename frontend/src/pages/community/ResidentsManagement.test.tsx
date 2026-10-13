import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
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

    const renderResidentsManagement = () => render(
        <MemoryRouter>
            <ResidentsManagement />
        </MemoryRouter>,
    );

const LocationSearch = () => {
    const location = useLocation();
    return <output data-testid="location-search">{location.search}</output>;
};

    it("renders directory list and search/filter inputs", async () => {
        vi.mocked(axiosPrivate.get)
            .mockResolvedValueOnce({ data: { count: 26, results: mockResidents } })
            .mockResolvedValueOnce({ data: { count: 1, results: [mockResidents[0]] } });

        renderResidentsManagement();

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

        await waitFor(() => {
            expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
            expect(screen.queryByText("Maria Clara")).not.toBeInTheDocument();
        });
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(
            2,
            "/auth/resident/?page=1&page_size=25&search=Juan",
        );
    });

    it("keeps the resident search and unrelated URL state while changing pages", async () => {
        vi.mocked(axiosPrivate.get)
            .mockResolvedValueOnce({ data: { count: 51, results: mockResidents } })
            .mockResolvedValueOnce({ data: { count: 51, results: [mockResidents[1]] } })
            .mockResolvedValueOnce({ data: { count: 51, results: [mockResidents[1]] } });

        render(
            <MemoryRouter initialEntries={["/residents?keep=active"]}>
                <ResidentsManagement />
                <LocationSearch />
            </MemoryRouter>,
        );

        const searchInput = await screen.findByLabelText("Search residents");
        fireEvent.change(searchInput, { target: { value: "Maria" } });
        await waitFor(() => expect(axiosPrivate.get).toHaveBeenCalledTimes(2));
        expect(screen.getByTestId("location-search")).toHaveTextContent(
            "keep=active&residentSearch=Maria",
        );

        fireEvent.click(await screen.findByRole("button", { name: "Next page" }));
        await waitFor(() => expect(axiosPrivate.get).toHaveBeenCalledTimes(3));
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(
            3,
            "/auth/resident/?page=2&page_size=25&search=Maria",
        );
        expect(screen.getByTestId("location-search")).toHaveTextContent(
            "keep=active&residentSearch=Maria&residentPage=2",
        );
    });

    it("shows a retryable load error and recovers without treating failures as empty results", async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error("Network unavailable"))
            .mockRejectedValueOnce(new Error("Network unavailable"))
            .mockResolvedValueOnce({ data: { results: mockResidents } });

        renderResidentsManagement();

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "We couldn't load the resident directory.",
        );
        expect(screen.queryByText("No verified residents found.")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "We couldn't load the resident directory.",
        );
        expect(screen.queryByText("No verified residents found.")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(await screen.findByText("Juan Dela Cruz")).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenCalledTimes(3);
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(1, "/auth/resident/?page=1&page_size=25");
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(2, "/auth/resident/?page=1&page_size=25");
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(3, "/auth/resident/?page=1&page_size=25");
    });

    it("keeps the empty directory message for a successful empty response", async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: { results: [] } });

        renderResidentsManagement();

        expect(await screen.findByText("No verified residents found.")).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("disables the retry action while the directory request is pending", async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error("Network unavailable"))
            .mockImplementationOnce(() => new Promise(() => {}));

        renderResidentsManagement();
        await screen.findByRole("alert");

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(
            screen.getByRole("button", { name: "Trying again…" }),
        ).toBeDisabled();
        expect(axiosPrivate.get).toHaveBeenCalledTimes(2);
    });

    it("opens and closes resident detail modal with demographic data", async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: { results: mockResidents } });

        renderResidentsManagement();

        await screen.findByText("Juan Dela Cruz");

        fireEvent.click(screen.getByRole("button", { name: "Open Juan Dela Cruz resident details" }));

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

        renderResidentsManagement();

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

        renderResidentsManagement();

        await screen.findByText("Juan Dela Cruz");

        const deleteButtons = screen.getAllByTitle("Delete Resident");
        fireEvent.click(deleteButtons[0]);

        expect(window.confirm).toHaveBeenCalledWith(
            "Are you sure you want to remove this resident? This will revoke their login access and terminate all active sessions while preserving historical records."
        );

        await waitFor(() => {
            expect(axiosPrivate.delete).toHaveBeenCalledWith("/auth/resident/1/");
            expect(screen.queryByText("Juan Dela Cruz")).not.toBeInTheDocument();
            expect(screen.getByText("Maria Clara")).toBeInTheDocument();
        });
    });
});
