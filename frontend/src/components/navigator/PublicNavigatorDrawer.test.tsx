import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { PublicNavigatorDrawer } from './PublicNavigatorDrawer';
import { submitNavigatorQuery } from '../../api/navigator';
import type { NavigatorQueryResponse } from './types';

vi.mock('../../api/navigator', () => ({
    submitNavigatorQuery: vi.fn(),
}));

const escalation = {
    office_contact: '(042) 710-1234',
    hotlines: [
        { name: 'Lucena PNP', number: '(042) 710-2222', category: 'Police' },
        { name: 'Lucena BFP', number: '160', category: 'Fire' },
    ],
    barangay_hall_notice: 'For official transactions, please visit the Barangay Hall of Ibabang Dupay in person.',
};

const answered: NavigatorQueryResponse = {
    status: 'answered',
    answer: 'First-time jobseekers are exempt from the clearance fee under RA 11261.',
    reason: null,
    sources: [{
        id: 'statutory:ra-11261',
        title: 'First Time Jobseekers Assistance Act',
        category: 'statutory',
        reference: 'Republic Act No. 11261',
        updated_at: '2026-01-10T20:00:00Z',
    }],
    escalation,
};

const privacyAbstained: NavigatorQueryResponse = {
    status: 'abstained',
    answer: 'I cannot look up personal payment records.',
    reason: 'privacy_guard_payment',
    sources: [],
    escalation,
};

const outOfScope: NavigatorQueryResponse = {
    status: 'abstained',
    answer: 'That information is not in approved public records for your Barangay.',
    reason: 'no_eligible_sources',
    sources: [],
    escalation,
};

const timedOut: NavigatorQueryResponse = {
    status: 'unavailable',
    answer: 'The navigator request timed out.',
    reason: 'provider_timeout',
    sources: [{
        id: 'statutory:ra-11261',
        title: 'First Time Jobseekers Assistance Act',
        category: 'statutory',
        reference: 'Republic Act No. 11261',
        updated_at: null,
    }],
    escalation,
};

const disabled: NavigatorQueryResponse = {
    ...timedOut,
    answer: 'The navigator is offline for maintenance.',
    reason: 'feature_disabled',
};

const renderOpen = () => render(<PublicNavigatorDrawer isOpen onClose={vi.fn()} />);

const ask = (text: string) => {
    fireEvent.change(screen.getByLabelText('Your question'), { target: { value: text } });
    fireEvent.click(screen.getByRole('button', { name: 'Send question' }));
};

describe('PublicNavigatorDrawer', () => {
    beforeEach(() => {
        vi.mocked(submitNavigatorQuery).mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders nothing when closed', () => {
        render(<PublicNavigatorDrawer isOpen={false} onClose={vi.fn()} />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('opens as a labelled modal with the privacy notice, status live region inside dialog, and focuses input', () => {
        renderOpen();

        const dialog = screen.getByRole('dialog', { name: 'Ask Barangay' });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAccessibleDescription(/public information only/i);
        expect(within(dialog).getByRole('status')).toBeInTheDocument();
        expect(screen.getByLabelText('Your question')).toHaveFocus();
        expect(screen.getByLabelText('Your question')).toHaveAttribute('maxLength', '500');
    });

    it('closes on the close button and on Escape', () => {
        const onClose = vi.fn();
        render(<PublicNavigatorDrawer isOpen onClose={onClose} />);

        fireEvent.click(screen.getByRole('button', { name: 'Close Ask Barangay' }));
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

        expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('disables sending an empty or whitespace-only question', () => {
        renderOpen();
        const send = screen.getByRole('button', { name: 'Send question' });

        expect(send).toBeDisabled();
        fireEvent.change(screen.getByLabelText('Your question'), { target: { value: '   ' } });
        expect(send).toBeDisabled();
        expect(submitNavigatorQuery).not.toHaveBeenCalled();
    });

    it('renders an answered turn with cited sources in Manila time and the escalation toggle collapsed', async () => {
        vi.mocked(submitNavigatorQuery).mockResolvedValueOnce(answered);
        renderOpen();

        ask('  Jobseeker exemption?  ');

        expect(await screen.findByText(answered.answer)).toBeInTheDocument();
        expect(submitNavigatorQuery).toHaveBeenCalledWith('Jobseeker exemption?');
        expect(screen.getByText('Answer from public records')).toBeInTheDocument();
        expect(screen.getByText('Sources cited')).toBeInTheDocument();
        expect(screen.getByText('Reference: Republic Act No. 11261')).toBeInTheDocument();
        // 2026-01-10T20:00Z is 11 Jan 2026 in Asia/Manila (UTC+8).
        expect(screen.getByText(/Updated Jan 11, 2026/)).toBeInTheDocument();

        const toggle = screen.getByRole('button', { name: /barangay hall & emergency contacts/i });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        fireEvent.click(toggle);
        expect(screen.getByText(escalation.barangay_hall_notice)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '(042) 710-2222' })).toHaveAttribute('href', 'tel:0427102222');
    });

    it('distinguishes a privacy abstention and expands the escalation contacts', async () => {
        vi.mocked(submitNavigatorQuery).mockResolvedValueOnce(privacyAbstained);
        renderOpen();

        ask('Check my GCash payment');

        expect(await screen.findByText('Privacy notice')).toBeInTheDocument();
        expect(screen.queryByText('Sources cited')).not.toBeInTheDocument();
        expect(screen.getByText(escalation.barangay_hall_notice)).toBeInTheDocument();
        expect(screen.getByText('(042) 710-1234')).toBeInTheDocument();
    });

    it('distinguishes an out-of-scope abstention from a privacy abstention', async () => {
        vi.mocked(submitNavigatorQuery).mockResolvedValueOnce(outOfScope);
        renderOpen();

        ask('Who won the election?');

        expect(await screen.findByText('Not in public records')).toBeInTheDocument();
        expect(screen.queryByText('Privacy notice')).not.toBeInTheDocument();
    });

    it('does not label degraded fallback records as cited sources and offers retry for transient failures', async () => {
        vi.mocked(submitNavigatorQuery)
            .mockResolvedValueOnce(timedOut)
            .mockResolvedValueOnce(answered);
        renderOpen();

        ask('Jobseeker exemption?');

        expect(await screen.findByText('Assistant unavailable')).toBeInTheDocument();
        expect(screen.getByText('Public records you can check')).toBeInTheDocument();
        expect(screen.queryByText('Sources cited')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByText(answered.answer)).toBeInTheDocument();
        expect(submitNavigatorQuery).toHaveBeenNthCalledWith(2, 'Jobseeker exemption?');
    });

    it('does not offer retry when the feature is disabled', async () => {
        vi.mocked(submitNavigatorQuery).mockResolvedValueOnce(disabled);
        renderOpen();

        ask('Anything');

        expect(await screen.findByText('Assistant unavailable')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    });

    it('shows a rate-limit alert on 429 and retries the same question', async () => {
        const throttled = new AxiosError('Too Many Requests', 'ERR_BAD_REQUEST', undefined, undefined, {
            status: 429,
            statusText: 'Too Many Requests',
            headers: {},
            config: { headers: new AxiosHeaders() },
            data: { detail: 'Request was throttled.' },
        });
        vi.mocked(submitNavigatorQuery)
            .mockRejectedValueOnce(throttled)
            .mockResolvedValueOnce(answered);
        renderOpen();

        ask('Clearance requirements');

        expect(await screen.findByRole('alert')).toHaveTextContent(/too many questions/i);
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByText(answered.answer)).toBeInTheDocument();
        expect(submitNavigatorQuery).toHaveBeenNthCalledWith(2, 'Clearance requirements');
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows a connection alert on network failure and allows retry', async () => {
        vi.mocked(submitNavigatorQuery)
            .mockRejectedValueOnce(new Error('Network Error'))
            .mockResolvedValueOnce(answered);
        renderOpen();

        ask('Clearance requirements');

        expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach the assistant/i);
        expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByText(answered.answer)).toBeInTheDocument();
        expect(submitNavigatorQuery).toHaveBeenNthCalledWith(2, 'Clearance requirements');
    });

    it('offers retry for transient HTTP 5xx server errors', async () => {
        const serverError = new AxiosError('Internal Server Error', 'ERR_BAD_RESPONSE', undefined, undefined, {
            status: 500,
            statusText: 'Internal Server Error',
            headers: {},
            config: { headers: new AxiosHeaders() },
            data: { detail: 'Server failure' },
        });
        vi.mocked(submitNavigatorQuery)
            .mockRejectedValueOnce(serverError)
            .mockResolvedValueOnce(answered);
        renderOpen();

        ask('Clearance requirements');

        expect(await screen.findByRole('alert')).toHaveTextContent(/temporary error/i);
        expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByText(answered.answer)).toBeInTheDocument();
    });

    it('does not offer retry for non-transient HTTP 400 bad request error', async () => {
        const badRequest = new AxiosError('Bad Request', 'ERR_BAD_REQUEST', undefined, undefined, {
            status: 400,
            statusText: 'Bad Request',
            headers: {},
            config: { headers: new AxiosHeaders() },
            data: { detail: 'Invalid parameter' },
        });
        vi.mocked(submitNavigatorQuery).mockRejectedValueOnce(badRequest);
        renderOpen();

        ask('Malformed question');

        expect(await screen.findByRole('alert')).toHaveTextContent(/could not be processed/i);
        expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    });

    it('does not offer retry for non-transient HTTP 401 unauthorized error', async () => {
        const unauth = new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, undefined, {
            status: 401,
            statusText: 'Unauthorized',
            headers: {},
            config: { headers: new AxiosHeaders() },
            data: { detail: 'Credentials required' },
        });
        vi.mocked(submitNavigatorQuery).mockRejectedValueOnce(unauth);
        renderOpen();

        ask('Secret info');

        expect(await screen.findByRole('alert')).toHaveTextContent(/session has expired/i);
        expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    });

    it('does not offer retry for non-transient HTTP 403 forbidden error', async () => {
        const forbidden = new AxiosError('Forbidden', 'ERR_BAD_REQUEST', undefined, undefined, {
            status: 403,
            statusText: 'Forbidden',
            headers: {},
            config: { headers: new AxiosHeaders() },
            data: { detail: 'Access restricted' },
        });
        vi.mocked(submitNavigatorQuery).mockRejectedValueOnce(forbidden);
        renderOpen();

        ask('Restricted info');

        expect(await screen.findByRole('alert')).toHaveTextContent(/access restricted/i);
        expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    });

    it('sends a suggested question when it is chosen', async () => {
        vi.mocked(submitNavigatorQuery).mockResolvedValueOnce(answered);
        renderOpen();

        fireEvent.click(screen.getByRole('button', { name: 'What are the emergency hotlines?' }));

        await waitFor(() => {
            expect(submitNavigatorQuery).toHaveBeenCalledWith('What are the emergency hotlines?');
        });
    });

    it('keeps the conversation in memory only, resets input query, and clears turns on request', async () => {
        const setItem = vi.spyOn(Storage.prototype, 'setItem');
        const pushState = vi.spyOn(window.history, 'pushState');
        const replaceState = vi.spyOn(window.history, 'replaceState');
        vi.mocked(submitNavigatorQuery).mockResolvedValueOnce(answered);
        renderOpen();

        const input = screen.getByLabelText('Your question');
        ask('Jobseeker exemption?');
        expect(await screen.findByText(answered.answer)).toBeInTheDocument();

        expect(setItem).not.toHaveBeenCalled();
        expect(pushState).not.toHaveBeenCalled();
        expect(replaceState).not.toHaveBeenCalled();

        // Resident types a draft before clicking clear
        fireEvent.change(input, { target: { value: 'Unsent draft' } });
        expect(input).toHaveValue('Unsent draft');

        fireEvent.click(screen.getByRole('button', { name: 'Clear conversation' }));

        expect(screen.queryByText(answered.answer)).not.toBeInTheDocument();
        expect(input).toHaveValue('');
        expect(screen.getByRole('button', { name: 'What are the emergency hotlines?' })).toBeInTheDocument();
    });

    it('clears conversation, input query, and active error state on clear button click', async () => {
        const throttled = new AxiosError('Too Many Requests', 'ERR_BAD_REQUEST', undefined, undefined, {
            status: 429,
            statusText: 'Too Many Requests',
            headers: {},
            config: { headers: new AxiosHeaders() },
            data: { detail: 'Throttled' },
        });
        vi.mocked(submitNavigatorQuery)
            .mockResolvedValueOnce(answered)
            .mockRejectedValueOnce(throttled);
        renderOpen();

        ask('First question');
        expect(await screen.findByText(answered.answer)).toBeInTheDocument();

        ask('Rapid second question');
        expect(await screen.findByRole('alert')).toBeInTheDocument();

        const input = screen.getByLabelText('Your question');
        fireEvent.change(input, { target: { value: 'Draft while error active' } });
        expect(input).toHaveValue('Draft while error active');

        fireEvent.click(screen.getByRole('button', { name: 'Clear conversation' }));

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.queryByText(answered.answer)).not.toBeInTheDocument();
        expect(input).toHaveValue('');
    });

    it('ensures close and clear buttons and hotline links have adequate touch targets', async () => {
        vi.mocked(submitNavigatorQuery).mockResolvedValueOnce(answered);
        renderOpen();

        ask('Jobseeker exemption?');
        expect(await screen.findByText(answered.answer)).toBeInTheDocument();

        const closeBtn = screen.getByRole('button', { name: 'Close Ask Barangay' });
        const clearBtn = screen.getByRole('button', { name: 'Clear conversation' });
        expect(closeBtn).toHaveClass('min-h-[44px]', 'min-w-[44px]');
        expect(clearBtn).toHaveClass('min-h-[44px]', 'min-w-[44px]');

        // Open escalation panel to inspect hotline links
        const toggle = screen.getByRole('button', { name: /barangay hall & emergency contacts/i });
        fireEvent.click(toggle);

        const phoneLink = screen.getByRole('link', { name: '(042) 710-2222' });
        expect(phoneLink).toHaveClass('min-h-[44px]');
    });
});
