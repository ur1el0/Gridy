from django.db import migrations


RESIDENT_FAQS = [
    {
        "question": "How do I get started with KapitBayan?",
        "answer": "Sign in with your account, then use the Dashboard and the menu to open services such as Documents, Queue, Community Bulletin, Assistance, and Help. If a service is not available in your account, contact your Barangay office for guidance.",
        "category": "GETTING_STARTED",
        "order": 10,
    },
    {
        "question": "I cannot sign in or I forgot my password. What can I do?",
        "answer": "Check that you entered the username or email linked to your account. Use the Forgot Password link if it is available. Never send your password or one-time code (OTP) to another person. If you still cannot sign in, ask your Barangay office how to get account help.",
        "category": "ACCOUNT",
        "order": 20,
    },
    {
        "question": "How do I request a barangay document?",
        "answer": "Open Documents, choose the request option, complete the form, and submit it. Follow the status shown in your account. The Barangay sets the accepted documents, steps, fees, and processing time, so check its current instructions before you travel or pay.",
        "category": "DOCUMENTS",
        "order": 30,
    },
    {
        "question": "How can I check the status of my request?",
        "answer": "Open Documents and select your request to review its latest status and any instructions. If the status is unclear or does not change, contact the Barangay office using a contact it has verified. Check the existing request before submitting another one.",
        "category": "DOCUMENTS",
        "order": 40,
    },
    {
        "question": "How do fees and payments work?",
        "answer": "Use only the fee and payment instructions shown for your request and confirmed by the Barangay. Do not send money to a personal account or pay based only on an unsolicited message. Keep any official receipt or confirmation, and contact the Barangay if the amount or instructions are unclear.",
        "category": "PAYMENTS",
        "order": 50,
    },
    {
        "question": "How do I use the queue or check an appointment?",
        "answer": "Open Queue to use the queue options available to your account. Open Schedule to review activities and appointment information. Follow the date, time, and instructions shown by your Barangay; availability and walk-in procedures can vary.",
        "category": "QUEUE",
        "order": 60,
    },
    {
        "question": "Where can I read announcements and community schedules?",
        "answer": "Open Community Bulletin or Announcements for notices, and Schedule for upcoming activities. Refresh the page to check for updates. For an urgent or conflicting notice, confirm it with the Barangay through an official contact.",
        "category": "COMMUNITY",
        "order": 70,
    },
    {
        "question": "Where can I ask about assistance for seniors, PWDs, solo parents, jobseekers, students, or families?",
        "answer": "Open Assistance to see the options available in KapitBayan, or ask the Barangay office for current programs and application steps. Programs, eligibility, required documents, and schedules vary. Confirm the current rules with the responsible office before sharing documents or making a trip.",
        "category": "ASSISTANCE",
        "order": 80,
    },
    {
        "question": "How can I make the text easier to read?",
        "answer": "On Android, open the phone's Settings and look for Display or Accessibility to increase Font size or Display size. Menu names differ by phone. On the web, use your browser's zoom controls. The app should reflow larger text; if a control is hard to use, ask the Barangay office for help.",
        "category": "ACCESSIBILITY",
        "order": 90,
    },
    {
        "question": "Can a family member or trusted person help me use the app?",
        "answer": "A trusted person can help you read instructions or navigate while you stay in control of your account. Do not tell them your password or OTP, and do not send identity documents through personal chat. Sign out on a device you do not own when you finish.",
        "category": "ACCESSIBILITY",
        "order": 100,
    },
    {
        "question": "What should I do if a page will not load?",
        "answer": "Check your internet connection and use Try again. If the problem continues, close and reopen the app, then check the request or notice before repeating an action. Contact the Barangay through a verified channel if you need help. Do not assume a failed request was submitted.",
        "category": "GETTING_STARTED",
        "order": 110,
    },
    {
        "question": "How do I protect my account and personal information?",
        "answer": "Use a password that only you know. Never share your password or OTP. Submit identity documents only through an official KapitBayan form when the service asks for them, and avoid posting private information in public comments or messages.",
        "category": "PRIVACY",
        "order": 120,
    },
]


def seed_resident_faqs(apps, schema_editor):
    FAQ = apps.get_model("gridy_communications", "FAQ")
    FAQ.objects.all().update(
        audience="STAFF",
        category="OTHER",
        is_published=False,
        barangay_id=None,
    )
    FAQ.objects.bulk_create([
        FAQ(
            question=item["question"],
            answer=item["answer"],
            audience="RESIDENT",
            category=item["category"],
            is_published=True,
            barangay_id=None,
            order=item["order"],
        )
        for item in RESIDENT_FAQS
    ])


def unseed_resident_faqs(apps, schema_editor):
    FAQ = apps.get_model("gridy_communications", "FAQ")
    for item in RESIDENT_FAQS:
        FAQ.objects.filter(
            question=item["question"],
            answer=item["answer"],
            audience="RESIDENT",
            barangay_id=None,
        ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("gridy_communications", "0008_alter_faq_options_faq_audience_faq_barangay_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_resident_faqs, unseed_resident_faqs),
    ]
