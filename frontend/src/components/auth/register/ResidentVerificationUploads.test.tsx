import { render, screen } from '@testing-library/react';
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
    });
});
