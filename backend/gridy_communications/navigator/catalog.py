"""
Curated statutory document catalog for the Public Information AI Navigator.

Contains verified document requirements and statutory fee exemptions pursuant to
national legislation (e.g., First Time Jobseekers Assistance Act - RA 11261,
Local Government Code - RA 7160). Ordinary local clearance fees are not hardcoded
and must always be directed to the Barangay Hall.
"""

STATUTORY_CATALOG = [
    {
        "id": "statutory:first_time_jobseeker",
        "title": "First Time Jobseeker Certificate",
        "category": "statutory",
        "reference": "Republic Act No. 11261 (First Time Jobseekers Assistance Act), Sec. 4-5; RA 11261 IRR",
        "updated_at": None,
        "content": (
            "Under Republic Act No. 11261 Section 4, eligible first-time jobseekers are statutorily exempt from paying "
            "government fees for barangay clearances and certifications requested in connection with first-time employment. "
            "Section 5 limits this statutory fee exemption to one-time availment and requires a barangay certification "
            "attesting to first-time jobseeker status. Implementing guidelines (RA 11261 IRR) provide for the execution "
            "of an Oath of Undertaking before the barangay. Specific documentary proof of residency and issuance procedures "
            "are administered by the Barangay Hall. Clearances for non-employment purposes are not covered."
        ),
    },
    {
        "id": "statutory:barangay_clearance",
        "title": "Barangay Clearance",
        "category": "statutory",
        "reference": "Local Government Code of 1991 (RA 7160), Sec. 152(c) & Local Sangguniang Barangay Tax Ordinances",
        "updated_at": None,
        "content": (
            "Under Section 152(c) of Republic Act No. 7160, a Barangay Clearance is statutorily required before a city or "
            "municipality may issue any license or permit for a business or commercial activity within the barangay. "
            "Sangguniang Barangay ordinances establish clearance fees within statutory limits. For personal or general "
            "clearances (such as employment, identification, or residency), requirements and fees are governed by local "
            "barangay ordinances rather than a uniform national schedule. Specific documentary requirements and applicable "
            "fees must be confirmed directly at the Barangay Hall."
        ),
    },
    {
        "id": "statutory:certificate_of_indigency",
        "title": "Certificate of Indigency",
        "category": "statutory",
        "reference": "Barangay Administrative Policy & Local Social Welfare Guidelines",
        "updated_at": None,
        "content": (
            "A Certificate of Indigency is an administrative certification issued by the Barangay to low-income residents "
            "for social welfare assistance, medical assistance, legal aid (such as the Public Attorney's Office / PAO), or "
            "scholarship applications. Qualifications, income thresholds, required supporting proof, and fee waiver "
            "policies are governed by municipal and barangay social welfare guidelines and local ordinances. Specific "
            "document requirements and fee exemptions must be verified directly with the Barangay Hall."
        ),
    },
    {
        "id": "statutory:certificate_of_residency",
        "title": "Certificate of Residency",
        "category": "statutory",
        "reference": "Barangay Administrative Policy & Local Sangguniang Barangay Ordinance",
        "updated_at": None,
        "content": (
            "A Certificate of Residency certifies that an individual is a bona fide resident within the barangay jurisdiction. "
            "Specific documentary proof of address (such as utility bills, lease agreements, or voter registration) and "
            "administrative fees are governed by local barangay ordinances and policy. Inquiries regarding applicable fees "
            "and document requirements must be confirmed directly at the Barangay Hall."
        ),
    },
    {
        "id": "statutory:business_clearance",
        "title": "Barangay Business Clearance",
        "category": "statutory",
        "reference": "Local Government Code of 1991 (RA 7160), Sec. 152(c) & Local Barangay Revenue Code",
        "updated_at": None,
        "content": (
            "Pursuant to RA 7160 Section 152(c), obtaining a Barangay Business Clearance is mandatory prior to the "
            "issuance or renewal of a Mayor's or Municipal Business Permit. Clearance fees are determined by the local "
            "Sangguniang Barangay tax ordinance, commonly scaled by business capitalization, business type, or gross sales. "
            "Contact the Barangay Treasurer or visit the Barangay Hall for local requirements and fee assessment."
        ),
    },
]
