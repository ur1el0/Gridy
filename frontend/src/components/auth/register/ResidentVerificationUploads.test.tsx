import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResidentVerificationUploads } from './ResidentVerificationUploads';

describe('ResidentVerificationUploads', () => {
    it('associates each residency-proof selector with its visible label', () => {
        render(
            <ResidentVerificationUploads
                isExpanded
                onToggleExpand={vi.fn()}
                philsysIdNumber=""
                onPhilsysIdNumberChange={vi.fn()}
                philsysPhoto={null}
                onPhilsysPhotoChange={vi.fn()}
                utilityBillingType="Electric Bill"
                onUtilityBillingTypeChange={vi.fn()}
                utilityBillingPhoto={null}
                onUtilityBillingPhotoChange={vi.fn()}
                secondaryIdType=""
                onSecondaryIdTypeChange={vi.fn()}
                secondaryIdPhoto={null}
                onSecondaryIdPhotoChange={vi.fn()}
            />,
        );

        expect(screen.getByLabelText('SELECT PRIMARY RESIDENCY PROOF')).toBeInTheDocument();
        expect(screen.getByLabelText('SECONDARY ID Optional')).toBeInTheDocument();
        expect(screen.getByText(/Upload at least one image to register/i)).toBeInTheDocument();
    });

    it('exposes the collapsed and expanded states of the verification disclosure', () => {
        const onToggleExpand = vi.fn();
        const props = {
            onToggleExpand,
            philsysIdNumber: '',
            onPhilsysIdNumberChange: vi.fn(),
            philsysPhoto: null,
            onPhilsysPhotoChange: vi.fn(),
            utilityBillingType: 'Electric Bill',
            onUtilityBillingTypeChange: vi.fn(),
            utilityBillingPhoto: null,
            onUtilityBillingPhotoChange: vi.fn(),
            secondaryIdType: '',
            onSecondaryIdTypeChange: vi.fn(),
            secondaryIdPhoto: null,
            onSecondaryIdPhotoChange: vi.fn(),
        };
        const { rerender } = render(
            <ResidentVerificationUploads {...props} isExpanded={false} />,
        );

        const collapsedButton = screen.getByRole('button', {
            name: /Identity & Residency Verification.*Required: upload at least one ID or proof of residency/i,
        });
        expect(collapsedButton).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByLabelText('SELECT PRIMARY RESIDENCY PROOF')).not.toBeInTheDocument();

        fireEvent.click(collapsedButton);
        expect(onToggleExpand).toHaveBeenCalledOnce();

        rerender(<ResidentVerificationUploads {...props} isExpanded />);
        expect(screen.getByRole('button', { name: /Tap to collapse verification documents/i }))
            .toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByLabelText('SELECT PRIMARY RESIDENCY PROOF')).toBeVisible();
    });
});
