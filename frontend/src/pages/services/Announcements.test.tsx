import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axiosPrivate } from '../../api/axios';
import { useAuth } from '../../context/auth-context';
import { Announcements } from './Announcements';

vi.mock('qrcode.react', async () => {
    const React = await import('react');
    return {
        QRCodeCanvas: React.forwardRef<HTMLCanvasElement, { value: string; title: string }>(
            ({ value, title }, ref) => React.createElement('canvas', {
                ref,
                'data-testid': 'announcement-qr',
                'data-value': value,
                'aria-label': title,
            }),
        ),
    };
});

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

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

const announcement = {
    id: 12,
    title: 'Water service interruption',
    content: 'Water service will be unavailable this afternoon.',
    image: null,
    is_pinned: false,
    created_at: '2026-10-12T08:00:00Z',
};

const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
const originalCanvasToDataUrlDescriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'toDataURL');

afterEach(() => {
    vi.restoreAllMocks();
    if (originalClipboardDescriptor) {
        Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor);
    } else {
        Reflect.deleteProperty(navigator, 'clipboard');
    }
    if (originalCanvasToDataUrlDescriptor) {
        Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', originalCanvasToDataUrlDescriptor);
    } else {
        Reflect.deleteProperty(HTMLCanvasElement.prototype, 'toDataURL');
    }
});

describe('Announcements', () => {
    beforeEach(() => {
        vi.mocked(axiosPrivate.get).mockReset();
        vi.mocked(axiosPrivate.post).mockReset();
        vi.mocked(axiosPrivate.delete).mockReset();
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'ADMIN', barangay_id: 1 } } as never);
        vi.mocked(axiosPrivate.get).mockResolvedValue({ data: [] } as never);
    });

    it('shows an accessible list error and keeps the page and create action available', async () => {
        vi.mocked(axiosPrivate.get).mockRejectedValueOnce(new Error('Network unavailable'));

        render(<Announcements />);

        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load announcements.");
        expect(screen.queryByText('No announcements active right now.')).not.toBeInTheDocument();
        expect(screen.getByText('Active Broadcasts')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'New Announcement' }));
        expect(screen.getByRole('dialog', { name: 'Broadcast Announcement' })).toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenCalledExactlyOnceWith('/announcements/');
        expect(axiosPrivate.post).not.toHaveBeenCalled();
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });

    it('retries only the list GET after repeated failures and renders announcements after recovery', async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockResolvedValueOnce({ data: { results: [announcement] } } as never);

        render(<Announcements />);
        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load announcements.");

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        await waitFor(() => expect(axiosPrivate.get).toHaveBeenCalledTimes(2));
        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load announcements.");

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(await screen.findByText('Water service interruption')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.queryByText('No announcements active right now.')).not.toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(1, '/announcements/');
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(2, '/announcements/');
        expect(axiosPrivate.get).toHaveBeenNthCalledWith(3, '/announcements/');
        expect(axiosPrivate.post).not.toHaveBeenCalled();
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });

    it('preserves loaded cards when the post-create list refresh fails', async () => {
        vi.mocked(axiosPrivate.get)
            .mockResolvedValueOnce({ data: [announcement] } as never)
            .mockRejectedValueOnce(new Error('Network unavailable'));
        vi.mocked(axiosPrivate.post).mockResolvedValueOnce({ data: {} } as never);

        render(<Announcements />);
        expect(await screen.findByText('Water service interruption')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'New Announcement' }));
        fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'Community cleanup' } });
        fireEvent.change(screen.getByLabelText('Full Content'), { target: { value: 'Meet at the barangay hall.' } });
        fireEvent.click(screen.getByRole('button', { name: 'Broadcast Now' }));

        await waitFor(() => expect(axiosPrivate.get).toHaveBeenCalledTimes(2));
        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load announcements.");
        expect(screen.getByText('Water service interruption')).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(axiosPrivate.post).toHaveBeenCalledTimes(1);
        expect(axiosPrivate.post).toHaveBeenCalledWith('/announcements/', expect.any(FormData), {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });

    it('shows the genuine empty state when a retry successfully returns no announcements', async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockResolvedValueOnce({ data: { results: [] } } as never);

        render(<Announcements />);
        await screen.findByRole('alert');
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByText('No announcements active right now.')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(axiosPrivate.get).toHaveBeenCalledTimes(2);
    });

    it('disables retry while the GET is pending without issuing mutations', async () => {
        vi.mocked(axiosPrivate.get)
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockImplementationOnce(() => new Promise(() => {}));

        render(<Announcements />);
        await screen.findByRole('alert');
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByRole('button', { name: 'Trying again…' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'New Announcement' })).toBeEnabled();
        expect(axiosPrivate.get).toHaveBeenCalledTimes(2);
        expect(axiosPrivate.post).not.toHaveBeenCalled();
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });

    it('opens a per-announcement QR share kit with manual Facebook guidance', async () => {
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: [announcement] } as never);

        render(<Announcements />);
        await screen.findByText('Water service interruption');
        fireEvent.click(screen.getByRole('button', { name: 'Share announcement' }));

        const dialog = screen.getByRole('dialog', { name: 'Announcement share kit' });
        const expectedUrl = `${window.location.origin}/notice/12`;
        expect(dialog).toBeInTheDocument();
        expect(screen.getByLabelText('Public announcement link')).toHaveValue(expectedUrl);
        expect(screen.getByTestId('announcement-qr')).toHaveAttribute('data-value', expectedUrl);
        expect(screen.getByText(/Posting is manual/)).toBeInTheDocument();
        expect(screen.getByText(/does not publish Facebook posts or read comments/)).toBeInTheDocument();
        expect(axiosPrivate.post).not.toHaveBeenCalled();
        expect(axiosPrivate.delete).not.toHaveBeenCalled();
    });

    it('copies Facebook-ready text containing the exact public announcement URL', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText },
        });
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: [announcement] } as never);

        render(<Announcements />);
        await screen.findByText('Water service interruption');
        fireEvent.click(screen.getByRole('button', { name: 'Share announcement' }));
        fireEvent.click(screen.getByRole('button', { name: 'Copy post text' }));

        await waitFor(() => expect(writeText).toHaveBeenCalledWith(
            `Water service interruption\n\nWater service will be unavailable this afternoon.\n\nRead the official KapitBayan announcement: ${window.location.origin}/notice/12`,
        ));
    });

    it('downloads the QR canvas as a PNG asset', async () => {
        const toDataURL = vi.fn().mockReturnValue('data:image/png;base64,qr');
        Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
            configurable: true,
            value: toDataURL,
        });
        const clickDownload = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: [announcement] } as never);

        render(<Announcements />);
        await screen.findByText('Water service interruption');
        fireEvent.click(screen.getByRole('button', { name: 'Share announcement' }));
        fireEvent.click(screen.getByRole('button', { name: 'Download QR PNG' }));

        expect(toDataURL).toHaveBeenCalledWith('image/png');
        expect(clickDownload).toHaveBeenCalledOnce();
    });
});
