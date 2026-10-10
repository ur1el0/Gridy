import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FileUploadZone } from './FileUploadZone';

describe('FileUploadZone', () => {
    it('exposes a keyboard-focusable file input under its specific evidence label', () => {
        const onFileChange = vi.fn();

        render(
            <FileUploadZone
                label="Upload PhilSys ID card photo"
                file={null}
                onFileChange={onFileChange}
            />,
        );

        const input = screen.getByLabelText(/Upload PhilSys ID card photo/);

        expect(input).toHaveAttribute('type', 'file');
        expect(input).toHaveClass('sr-only');
        expect(input).not.toHaveClass('hidden');

        input.focus();
        expect(input).toHaveFocus();

        const file = new File(['id image'], 'philsys.png', { type: 'image/png' });
        fireEvent.change(input, { target: { files: [file] } });
        expect(onFileChange).toHaveBeenCalledWith(file);
    });
});
