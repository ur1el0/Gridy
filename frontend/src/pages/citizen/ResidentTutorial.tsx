import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileText, ListOrdered, Radio, ShieldCheck, Users } from 'lucide-react';

const steps = [
    {
        title: 'Start at your Dashboard',
        description: 'After signing in, use the menu or service cards to choose what you need. You can return to the Dashboard whenever you want.',
        icon: <BookOpen className="h-6 w-6" aria-hidden="true" />,
    },
    {
        title: 'Request a document',
        description: 'Open Documents, choose the service you need, and follow the instructions on the screen. Review your information before sending. Return to Documents later to check the request status.',
        icon: <FileText className="h-6 w-6" aria-hidden="true" />,
    },
    {
        title: 'Check the queue and schedule',
        description: 'Open Queue to see available queue information. If your Barangay has posted an appointment or activity schedule, check its date, time, and location before going.',
        icon: <ListOrdered className="h-6 w-6" aria-hidden="true" />,
    },
    {
        title: 'Read community updates',
        description: 'Open the Community Bulletin to read announcements. Check the date and details, and confirm urgent information with your Barangay through a verified contact.',
        icon: <Radio className="h-6 w-6" aria-hidden="true" />,
    },
    {
        title: 'Find help',
        description: 'Use Assistance or Report Issue when you need those services. Follow the instructions shown and check the service page for updates. Local requirements and availability can differ.',
        icon: <Users className="h-6 w-6" aria-hidden="true" />,
    },
];

export const ResidentTutorial: React.FC = () => {
    const isPortalPage = useLocation().pathname === '/portal/tutorial';

    return (
    <main className="mx-auto max-w-4xl space-y-6 pb-10">
        {isPortalPage && (
            <Link
                to="/portal/documents"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to the resident portal
            </Link>
        )}
        <header className="rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8">
            <p className="text-sm font-bold uppercase tracking-wide opacity-90">Resident guide</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">How to use KapitBayan</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 opacity-95">
                Take one step at a time. You can come back to this guide whenever you need it. Button names may vary a little between the website and the mobile app.
            </p>
        </header>

        {!isPortalPage && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-xl font-bold text-slate-900">First time here?</h2>
                <p className="mt-2 text-base leading-7 text-slate-700">
                    On the sign-in screen, choose <strong>Register as Resident</strong> and follow the instructions. If the app says your account needs review, follow the message shown or contact your Barangay before making another account. If you already have an account, sign in and start at your Dashboard.
                </p>
            </section>
        )}

        <ol className="space-y-3">
            {steps.map((step) => (
                <li key={step.title} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
                        {step.icon}
                    </span>
                    <div>
                        <h2 className="text-lg font-bold leading-7 text-slate-900">{step.title}</h2>
                        <p className="mt-1 text-base leading-7 text-slate-700">{step.description}</p>
                    </div>
                </li>
            ))}
        </ol>

        <section aria-labelledby="tutorial-accessibility" className="rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6">
            <h2 id="tutorial-accessibility" className="text-xl font-bold text-blue-950">Make the app easier to use</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-7 text-blue-950">
                <li>To make text larger, use your phone’s text or display size setting. On the website, use your browser’s zoom controls.</li>
                <li>If you use a screen reader, turn on TalkBack in Android Accessibility settings and listen to button labels before choosing them.</li>
                <li>A trusted person may help you read or navigate while you stay in control. Never share your password or one-time code (OTP).</li>
                <li>If something does not load, check your connection and try again. Check request status before sending the same request again.</li>
            </ul>
        </section>

        <aside className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-base leading-7 text-slate-700">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <p>Keep your password, OTP, and identity documents private. Confirm local eligibility, fees, required documents, and office hours with your Barangay.</p>
        </aside>

        <div className="flex flex-wrap gap-3">
            {isPortalPage ? (
                <Link to="/portal/help" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    Open resident FAQs
                </Link>
            ) : (
                <>
                    <Link to="/login" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                        Sign in
                    </Link>
                    <Link to="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-900 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                        Register as a resident
                    </Link>
                </>
            )}
        </div>
    </main>
    );
};
