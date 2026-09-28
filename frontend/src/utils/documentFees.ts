const FEE_EXEMPT_DOCUMENT_TYPES = new Set([
    'certificate of indigency',
    'first time job seeker certificate',
]);

export function isFeeExemptDocumentType(
    documentType: string | null | undefined,
): boolean {
    return FEE_EXEMPT_DOCUMENT_TYPES.has(
        documentType?.trim().toLowerCase() ?? '',
    );
}
