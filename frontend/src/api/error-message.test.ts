import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { getSafeApiErrorMessage } from './error-message';

const apiError = (status: number, data: unknown) => Object.assign(
    new AxiosError('Request failed'),
    { response: { status, data } },
);

describe('getSafeApiErrorMessage', () => {
    it('keeps server and network details out of user-facing messages', () => {
        expect(getSafeApiErrorMessage(
            apiError(500, { detail: 'Database password and traceback' }),
            'Please try again.',
        )).toBe('Please try again.');

        expect(getSafeApiErrorMessage(new Error('socket details'), 'Please try again.'))
            .toBe('Please try again.');
    });

    it('shows a bounded client validation message', () => {
        expect(getSafeApiErrorMessage(apiError(400, { detail: 'Purpose is required.' }), 'Please try again.'))
            .toBe('Purpose is required.');
    });
});
