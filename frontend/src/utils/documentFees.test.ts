import { describe, expect, it } from 'vitest';
import { isFeeExemptDocumentType } from './documentFees';

describe('isFeeExemptDocumentType', () => {
    it.each([
        'Certificate of Indigency',
        'First Time Job Seeker Certificate',
    ])('exempts %s', (documentType) => {
        expect(isFeeExemptDocumentType(documentType)).toBe(true);
    });

    it('trims whitespace and ignores letter case', () => {
        expect(
            isFeeExemptDocumentType('  CERTIFICATE OF INDIGENCY  '),
        ).toBe(true);
    });

    it.each(['Barangay Clearance', 'Business Permit'])(
        'does not exempt %s',
        (documentType) => {
            expect(isFeeExemptDocumentType(documentType)).toBe(false);
        },
    );
});
