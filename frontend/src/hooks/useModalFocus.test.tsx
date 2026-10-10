import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useModalFocus } from './useModalFocus';

interface FocusDialogProps {
    isOpen: boolean;
    onRequestClose: () => void;
}

const FocusDialog = ({ isOpen, onRequestClose }: FocusDialogProps) => {
    const dialogRef = useModalFocus<HTMLDivElement>(isOpen, onRequestClose);
    if (!isOpen) return null;

    return (
        <div ref={dialogRef} role="dialog" aria-label="Focus test dialog" tabIndex={-1}>
            <button type="button">First action</button>
            <button type="button">Last action</button>
        </div>
    );
};

describe('useModalFocus', () => {
    it('focuses into the dialog, wraps keyboard focus, closes on Escape, and restores focus', () => {
        const onRequestClose = vi.fn();
        const { rerender } = render(
            <>
                <button type="button">Open dialog</button>
                <FocusDialog isOpen={false} onRequestClose={onRequestClose} />
            </>,
        );

        const openButton = screen.getByRole('button', { name: 'Open dialog' });
        openButton.focus();
        rerender(
            <>
                <button type="button">Open dialog</button>
                <FocusDialog isOpen onRequestClose={onRequestClose} />
            </>,
        );

        const firstAction = screen.getByRole('button', { name: 'First action' });
        const lastAction = screen.getByRole('button', { name: 'Last action' });

        expect(firstAction).toHaveFocus();

        lastAction.focus();
        fireEvent.keyDown(lastAction, { key: 'Tab' });
        expect(firstAction).toHaveFocus();

        fireEvent.keyDown(firstAction, { key: 'Tab', shiftKey: true });
        expect(lastAction).toHaveFocus();

        fireEvent.keyDown(lastAction, { key: 'Escape' });
        expect(onRequestClose).toHaveBeenCalledOnce();

        rerender(
            <>
                <button type="button">Open dialog</button>
                <FocusDialog isOpen={false} onRequestClose={onRequestClose} />
            </>,
        );

        expect(openButton).toHaveFocus();
    });
});
