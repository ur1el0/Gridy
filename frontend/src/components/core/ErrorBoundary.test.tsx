import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

const BrokenScreen = () => {
    throw new Error('private database traceback');
};

describe('ErrorBoundary', () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('shows a recovery action without rendering internal exception details', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);

        render(
            <ErrorBoundary>
                <BrokenScreen />
            </ErrorBoundary>,
        );

        expect(screen.getByRole('heading', { name: 'This screen couldn’t load' })).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent('Reload the page.');
        expect(screen.queryByText('private database traceback')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
    });
});
