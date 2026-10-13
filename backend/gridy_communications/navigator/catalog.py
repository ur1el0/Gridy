"""
Curated statutory document catalog for the Public Information AI Navigator.

Contains verified document requirements, statutory fee exemptions, and local administrative
policies pursuant to national legislation (e.g., First Time Jobseekers Assistance Act - RA 11261,
Local Government Code of 1991 - RA 7160) and local Sangguniang Barangay tax ordinances. Ordinary local
clearance fees are not hardcoded and must always be directed to the Barangay Hall or local tax ordinance.
"""

STATUTORY_CATALOG = [
    {
        "id": "statutory:first_time_jobseeker",
        "title": "First Time Jobseeker Certificate",
        "category": "statutory",
        "reference": "Republic Act No. 11261 (First Time Jobseekers Assistance Act), Sec. 3, 4, 5; RA 11261 IRR",
        "updated_at": None,
        "content": (
            "Under Section 3 of Republic Act No. 11261, eligible first-time jobseekers are statutorily exempt "
            "from paying government fees and charges for barangay clearances and certifications requested in "
            "connection with first-time employment, provided that this fee waiver may be availed of only once. "
            "Section 4 lists the covered government certifications and clearances, subject to Section 5. "
            "Section 5 requires the applicant to secure a Barangay Certification attesting that the applicant "
            "is a first-time jobseeker residing in the barangay. Pursuant to the RA 11261 IRR, applicants execute "
            "an Oath of Undertaking before the Punong Barangay or authorized official. This statutory exemption is "
            "strictly limited to first-time jobseekers for employment-related applications; ordinary or general "
            "clearances for non-employment purposes are not exempt under RA 11261 and remain subject to local fees."
        ),
    },
    {
        "id": "statutory:barangay_clearance",
        "title": "Barangay Clearance",
        "category": "statutory",
        "reference": "Local Sangguniang Barangay Tax Ordinances & Local Government Code of 1991 (RA 7160)",
        "updated_at": None,
        "content": (
            "Section 152(c) of Republic Act No. 7160 is strictly limited to the required Barangay Clearance "
            "before a city or municipality may issue any license or permit for a business or commercial activity "
            "within the barangay. It does not establish ordinary personal-clearance fees. For personal or general "
            "clearances (such as for employment, identification, or residency), requirements and fees are governed "
            "exclusively by local Sangguniang Barangay tax ordinances rather than a uniform national statutory schedule. "
            "Specific documentary requirements and applicable clearance fees must be confirmed directly at the Barangay Hall."
        ),
    },
    {
        "id": "administrative_policy:certificate_of_indigency",
        "title": "Certificate of Indigency",
        "category": "administrative_policy",
        "reference": "Barangay Administrative Policy & Local Social Welfare Guidelines",
        "updated_at": None,
        "content": (
            "A Certificate of Indigency is governed by local administrative policy and municipal or barangay social "
            "welfare guidelines rather than a national statutory mandate. It is an administrative certification issued "
            "by the Barangay to low-income residents for social welfare assistance, medical assistance, legal aid "
            "(such as the Public Attorney's Office / PAO), or scholarship applications. Qualifications, income thresholds, "
            "required supporting proof, and fee waiver policies are determined at the local level. Specific document "
            "requirements and fee exemptions must be verified directly with the Barangay Hall."
        ),
    },
    {
        "id": "administrative_policy:certificate_of_residency",
        "title": "Certificate of Residency",
        "category": "administrative_policy",
        "reference": "Barangay Administrative Policy & Local Sangguniang Barangay Ordinance",
        "updated_at": None,
        "content": (
            "A Certificate of Residency is governed by local administrative policy and local Sangguniang Barangay "
            "ordinances rather than a national statutory mandate. It certifies that an individual is a bona fide resident "
            "within the barangay jurisdiction. Specific documentary proof of address (such as utility bills, lease agreements, "
            "or voter registration) and administrative fees are governed solely by local policy and ordinances. Inquiries "
            "regarding applicable fees and document requirements must be confirmed directly at the Barangay Hall."
        ),
    },
    {
        "id": "statutory:business_clearance",
        "title": "Barangay Business Clearance",
        "category": "statutory",
        "reference": "Local Government Code of 1991 (RA 7160), Sec. 152(c) & Local Sangguniang Barangay Tax Ordinances",
        "updated_at": None,
        "content": (
            "Pursuant to Republic Act No. 7160 Section 152(c), obtaining a Barangay Clearance is mandatory before a "
            "city or municipality may issue any license or permit for a business or commercial activity located within "
            "the barangay. Applicable clearance fees and documentary requirements are established by the local Sangguniang "
            "Barangay tax ordinance. Residents and business operators should consult the applicable local ordinance or "
            "visit the Barangay Hall or Barangay Treasurer for local fee assessments."
        ),
    },
]
