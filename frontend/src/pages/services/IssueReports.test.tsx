import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axiosPrivate } from '../../api/axios';
import { IssueReports } from './IssueReports';

vi.mock('../../api/axios', () => ({
    axiosPrivate: {
        get: vi.fn(),
        patch: vi.fn(),
    },
}));

const report = {
    id: 34,
    title: 'Damaged streetlight',
    description: 'The streetlight near the covered court is not working.',
    location: 'Purok 2',
    image: null,
    status: 'PENDING',
    urgency: 'HIGH',
    created_at: '2026-10-12T08:00:00Z',
};

describe('IssueReports', () => {
    beforeEach(() => {
        vi.mocked(axiosPrivate.get).mockReset();
        vi.mocked(axiosPrivate.patch).mockReset();
        vi.mocked(axiosPrivate.get).mockResolvedValue({ data: [] } as never);
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const renderIssueReports = () => render(
        <MemoryRouter>
            <IssueReports />
        </MemoryRouter>,
    );

    it('shows an accessible list error while keeping the heading and table context', async () => {
        vi.mocked(axiosPrivate.get).mockRejectedValueOnce(new Error('Network unavailable'));

        renderIssueReports();

        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load issue reports.");
        expect(screen.getByRole('heading', { name: 'Issue Reports' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument();
        expect(screen.queryByText('No issue reports found.')).not.toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenCalledExactlyOnceWith('/reports/?page=1&page_size=25');
        expect(axiosPrivate.patch).not.toHaveBeenCalled();
    });

    it('retries only GET after repeated failures and displays reports on recovery', async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockResolvedValueOnce({ data: { results: [report] } } as never);

        renderIssueReports();
        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load issue reports.");

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        await waitFor(() => expect(axiosPrivate.get).toHaveBeenCalledTimes(2));
        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load issue reports.");

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(await screen.findByText('Damaged streetlight')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.queryByText('No issue reports found.')).not.toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(1, '/reports/?page=1&page_size=25');
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(2, '/reports/?page=1&page_size=25');
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(3, '/reports/?page=1&page_size=25');
        expect(axiosPrivate.patch).not.toHaveBeenCalled();
    });

    it('shows the successful empty state after a retry returns no reports', async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockResolvedValueOnce({ data: [] } as never);

        renderIssueReports();
        await screen.findByRole('alert');
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByText('No issue reports found.')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenCalledTimes(2);
    });

    it('disables retry while the GET is pending without issuing status mutations', async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockImplementationOnce(() => new Promise(() => {}));

        renderIssueReports();
        await screen.findByRole('alert');
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByRole('button', { name: 'Trying again…' })).toBeDisabled();
        expect(screen.getByRole('heading', { name: 'Issue Reports' })).toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenCalledTimes(2);
        expect(axiosPrivate.patch).not.toHaveBeenCalled();
    });

    it('loads the next page and requests only that page of issue reports', async () => {
        vi.mocked(axiosPrivate.get)
            .mockResolvedValueOnce({ data: { count: 26, results: [report] } } as never)
            .mockResolvedValueOnce({ data: { count: 26, results: [report] } } as never);

        renderIssueReports();
        fireEvent.click(await screen.findByRole('button', { name: 'Next page' }));

        await waitFor(() => expect(axiosPrivate.get).toHaveBeenCalledTimes(2));
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(1, '/reports/?page=1&page_size=25');
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(2, '/reports/?page=2&page_size=25');
        expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();
    });
});
