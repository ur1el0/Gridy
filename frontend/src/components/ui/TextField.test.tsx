import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextField } from './TextField';

describe('TextField', () => {
    it('exposes its input through the visible label', () => {
        render(<TextField label="Resident name" name="full_name" />);

        const input = screen.getByLabelText('Resident name');

        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('id');
    });
});
