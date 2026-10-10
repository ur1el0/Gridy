import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([type="hidden"]):not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

export const useModalFocus = <T extends HTMLElement>(
    isOpen: boolean,
    onRequestClose: () => void,
) => {
    const dialogRef = useRef<T | null>(null);
    const onRequestCloseRef = useRef(onRequestClose);
    onRequestCloseRef.current = onRequestClose;

    useEffect(() => {
        if (!isOpen || !dialogRef.current) return;

        const dialog = dialogRef.current;
        const previouslyFocused = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        const getFocusableElements = () => Array.from(
            dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((element) => (
            !element.closest('[hidden], [aria-hidden="true"]')
            && getComputedStyle(element).display !== 'none'
            && getComputedStyle(element).visibility !== 'hidden'
        ));

        (getFocusableElements()[0] ?? dialog).focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onRequestCloseRef.current();
                return;
            }

            if (event.key !== 'Tab') return;

            const focusableElements = getFocusableElements();
            if (focusableElements.length === 0) {
                event.preventDefault();
                dialog.focus();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            const activeElement = document.activeElement;

            if (event.shiftKey && (activeElement === firstElement || !dialog.contains(activeElement))) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && (activeElement === lastElement || !dialog.contains(activeElement))) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        dialog.addEventListener('keydown', handleKeyDown);
        return () => {
            dialog.removeEventListener('keydown', handleKeyDown);
            if (previouslyFocused?.isConnected) previouslyFocused.focus();
        };
    }, [isOpen]);

    return dialogRef;
};
