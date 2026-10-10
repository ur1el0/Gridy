import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BarangaySelectField } from './BarangaySelectField';

describe('BarangaySelectField', () => {
    it('associates the visible label with the required selector and preserves selection', () => {
        const onBarangayIdChange = vi.fn();

        render(
            <BarangaySelectField
                barangayId=""
                onBarangayIdChange={onBarangayIdChange}
                barangays={[
                    {
                        id: 42,
                        name: 'Barangay 143',
                        municipality: 'Lucena City',
                        province: 'Quezon',
                    },
                ]}
                loadingBarangays={false}
                isAdminMode={false}
            />,
        );

        const selector = screen.getByLabelText('LOCAL BARANGAY JURISDICTION');
        expect(selector).toBeRequired();
        expect(selector).toBeEnabled();

        fireEvent.change(selector, { target: { value: '42' } });
        expect(onBarangayIdChange).toHaveBeenCalledWith('42');
    });
});
