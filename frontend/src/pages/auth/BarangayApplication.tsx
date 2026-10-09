import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { axiosPublic } from '../../api/axios';

const fieldClass = 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

export function BarangayApplication() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        const form = new FormData(event.currentTarget);
        const payload = Object.fromEntries(form.entries());

        setIsSubmitting(true);
        try {
            await axiosPublic.post('/auth/barangay-applications/', payload);
            setSubmitted(true);
        } catch (requestError: any) {
            const details = requestError.response?.data;
            setError(details?.name?.[0] || details?.detail || 'Could not submit the application. Please review the information and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
            <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-text">KapitBayan barangay onboarding</p>
                <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Apply to register your barangay</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    DILG reviews the barangay and official contact details before creating a tenant or staff account. This form does not activate an account immediately.
                </p>

                {submitted ? (
                    <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                        Application received. DILG must verify your details. If approved, KapitBayan will email instructions for setting your first official account password.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
                        <fieldset className="grid gap-4 sm:grid-cols-2">
                            <legend className="mb-3 text-sm font-bold text-slate-800">Barangay identity</legend>
                            <label className="text-sm font-medium text-slate-700">Barangay name
                                <input className={fieldClass} name="name" maxLength={255} required autoComplete="organization" />
                            </label>
                            <label className="text-sm font-medium text-slate-700">Municipality or city
                                <input className={fieldClass} name="municipality" maxLength={120} required autoComplete="address-level2" />
                            </label>
                            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Province
                                <input className={fieldClass} name="province" maxLength={120} required autoComplete="address-level1" />
                            </label>
                        </fieldset>
                        <fieldset className="grid gap-4 sm:grid-cols-2">
                            <legend className="mb-3 text-sm font-bold text-slate-800">Authorized contact</legend>
                            <label className="text-sm font-medium text-slate-700">Full name
                                <input className={fieldClass} name="applicant_name" maxLength={255} required autoComplete="name" />
                            </label>
                            <label className="text-sm font-medium text-slate-700">Official position
                                <input className={fieldClass} name="applicant_position" maxLength={120} required autoComplete="organization-title" />
                            </label>
                            <label className="text-sm font-medium text-slate-700">Official email
                                <input className={fieldClass} type="email" name="applicant_email" maxLength={254} required autoComplete="email" />
                            </label>
                            <label className="text-sm font-medium text-slate-700">Office contact number
                                <input className={fieldClass} type="tel" name="applicant_phone" maxLength={30} required autoComplete="tel" />
                            </label>
                        </fieldset>
                        <p className="text-xs leading-5 text-slate-500">DILG must independently verify the applicant and official contact through existing channels. Do not enter payment passwords, PINs, or one-time codes.</p>
                        <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">
                            {isSubmitting ? 'Submitting…' : 'Submit for DILG review'}
                        </button>
                    </form>
                )}
                <Link to="/register" className="mt-6 inline-block text-sm font-semibold text-primary-text underline">Back to account registration</Link>
            </section>
        </main>
    );
}
