import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axiosPrivate } from '../../api/axios';
import { ResidentsHub } from './ResidentsHub';

vi.mock('./ResidentsManagement', () => ({
    ResidentsManagement: () => <div>Residents directory</div>,
}));

vi.mock('./ResidentVerification', () => ({
    default: () => <div>Resident verification list</div>,
}));

vi.mock('../../api/axios', () => ({
    axiosPrivate: {
        get: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('ResidentsHub pending verification count', () => {
    beforeEach(() => {
        vi.mocked(axiosPrivate.get).mockReset();
    });

    it('announces loading and shows a badge only after a successful count response', async () => {
        let resolveRequest!: (value: { data: { results: { id: number }[] } }) => void;
        vi.mocked(axiosPrivate.get).mockImplementationOnce(
            () => new Promise((resolve) => { resolveRequest = resolve; }),
        );

        render(
            <MemoryRouter>
                <ResidentsHub />
            </MemoryRouter>,
        );

        expect(screen.getByRole('status')).toHaveTextContent('Loading pending resident count');
        expect(screen.queryByLabelText(/pending resident verifications/i)).not.toBeInTheDocument();

        await act(async () => {
            resolveRequest({ data: { results: [{ id: 1 }, { id: 2 }] } });
        });

        expect(await screen.findByLabelText('2 pending resident verifications')).toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenCalledExactlyOnceWith('/auth/pending-residents/');
    });

    it('keeps failures retryable and does not show a false zero count', async () => {
        let rejectRetry!: (reason: Error) => void;
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('offline'))
            .mockImplementationOnce(
                () => new Promise((_resolve, reject) => { rejectRetry = reject; }),
            )
            .mockResolvedValueOnce({ data: { results: [{ id: 1 }] } } as never);

        render(
            <MemoryRouter>
                <ResidentsHub />
            </MemoryRouter>,
        );

        expect(await screen.findByRole('alert')).toHaveTextContent(
            "Pending resident count couldn't be loaded.",
        );
        expect(screen.queryByLabelText(/pending resident verifications/i)).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Retry pending resident count' }));
        const pendingRetry = screen.getByRole('button', { name: 'Retry pending resident count' });
        await waitFor(() => expect(pendingRetry).toBeDisabled());
        expect(pendingRetry).toHaveClass('min-h-[44px]', 'min-w-[44px]', 'focus-visible:ring-2');
        expect(screen.getByRole('status')).toHaveTextContent('Retrying pending resident count');

        await act(async () => {
            rejectRetry(new Error('offline again'));
        });

        expect(await screen.findByRole('alert')).toHaveTextContent(
            "Pending resident count couldn't be loaded.",
        );
        const secondRetry = screen.getByRole('button', { name: 'Retry pending resident count' });
        expect(secondRetry).toBeEnabled();

        fireEvent.click(secondRetry);

        expect(await screen.findByLabelText('1 pending resident verifications')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenCalledTimes(3);
        expect(vi.mocked(axiosPrivate.get).mock.calls).toEqual([
            ['/auth/pending-residents/'],
            ['/auth/pending-residents/'],
            ['/auth/pending-residents/'],
        ]);
    });

    it('treats a successful empty response as a genuine zero without showing an error', async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: { results: [] } } as never);

        render(
            <MemoryRouter>
                <ResidentsHub />
            </MemoryRouter>,
        );

        await waitFor(() => expect(axiosPrivate.get).toHaveBeenCalledOnce());
        expect(screen.queryByLabelText(/pending resident verifications/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('treats a malformed count response as unavailable instead of zero', async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: { results: 'invalid' } } as never);

        render(
            <MemoryRouter>
                <ResidentsHub />
            </MemoryRouter>,
        );

        expect(await screen.findByRole('alert')).toHaveTextContent(
            "Pending resident count couldn't be loaded.",
        );
        expect(screen.queryByLabelText(/pending resident verifications/i)).not.toBeInTheDocument();
    });
});
