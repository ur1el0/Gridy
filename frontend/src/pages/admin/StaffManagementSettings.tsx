import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { axiosPrivate } from '../../api/axios';
import { InlineErrorState } from '../../components/ui/InlineErrorState';
import { ShieldCheck, UserPlus, Users } from 'lucide-react';

export interface StaffMember {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    role: string;
    is_active: boolean;
    date_joined: string;
    last_login: string | null;
}

const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary';

export function StaffManagementSettings() {
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');

    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const loadStaff = useCallback(async (isRetry = false) => {
        if (isRetry) setRetrying(true);

        try {
            const response = await axiosPrivate.get('/auth/staff/');
            const data = response.data.results || response.data;
            setStaffList(Array.isArray(data) ? data : []);
            setLoadError(false);
        } catch {
            setLoadError(true);
        } finally {
            setLoading(false);
            setRetrying(false);
        }
    }, []);

    useEffect(() => {
        void loadStaff();
    }, [loadStaff]);

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const response = await axiosPrivate.post('/auth/staff/', {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                username: username.trim(),
                email: email.trim().toLowerCase(),
            });
            setStaffList((current) => [response.data, ...current]);
            setFirstName('');
            setLastName('');
            setUsername('');
            setEmail('');
            setMessage({
                text: `Field official account created. Setup instructions are being sent to ${response.data.email}. If the email does not arrive or the link expires, they can use Forgot Password.`,
                type: 'success',
            });
        } catch (err: unknown) {
            let errorText = 'Could not create field official account. Please check the inputs.';
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: Record<string, unknown> } };
                const data = axiosErr.response?.data;
                if (data && typeof data === 'object') {
                    const firstKey = Object.keys(data)[0];
                    const val = data[firstKey];
                    if (Array.isArray(val) && val.length > 0) {
                        errorText = `${firstKey}: ${val[0]}`;
                    } else if (typeof val === 'string') {
                        errorText = val;
                    }
                }
            }
            setMessage({ text: errorText, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (staff: StaffMember) => {
        setTogglingId(staff.id);
        setMessage(null);
        try {
            const response = await axiosPrivate.post(`/auth/staff/${staff.id}/toggle-status/`);
            setStaffList((current) =>
                current.map((item) => (item.id === staff.id ? response.data : item))
            );
            setMessage({
                text: `Field official '${staff.username}' is now ${response.data.is_active ? 'active' : 'inactive'}.`,
                type: 'success',
            });
        } catch {
            setMessage({
                text: `Could not change status for ${staff.username}.`,
                type: 'error',
            });
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Users className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Barangay Field Officials & Staff</h2>
                    <p className="mt-0.5 text-sm leading-6 text-slate-600">
                        Create mobile operations accounts for Barangay Tanods, field officers, and desk inspectors. Field officials set their own password using the emailed setup link and use the KapitBayan mobile app for their work. They do not have an admin web workspace.
                    </p>
                </div>
            </div>

            {message && (
                <div
                    role="alert"
                    className={`mt-4 rounded-lg p-3 text-sm ${
                        message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                    }`}
                >
                    {message.text}
                </div>
            )}

            <form onSubmit={submit} className="mt-6 rounded-lg border border-slate-100 bg-slate-50/50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-4">
                    <UserPlus className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>Add New Field Official</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">
                        First Name
                        <input
                            className={inputClass}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            maxLength={150}
                            required
                            placeholder="e.g. Ricardo"
                        />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                        Last Name
                        <input
                            className={inputClass}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            maxLength={150}
                            required
                            placeholder="e.g. Dalisay"
                        />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                        Username
                        <input
                            className={inputClass}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            maxLength={150}
                            required
                            autoComplete="off"
                            placeholder="e.g. tanod_carding"
                        />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                        Email Address
                        <input
                            type="email"
                            className={inputClass}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            maxLength={254}
                            required
                            placeholder="e.g. carding@barangay.gov.ph"
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={saving}
                        className="min-h-11 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground outline-none disabled:opacity-50 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors sm:col-span-2"
                    >
                        {saving ? 'Creating Account…' : 'Register Field Official'}
                    </button>
                </div>
            </form>

            <div className="mt-8 space-y-3" aria-live="polite">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    Barangay Field Personnel
                </h3>

                {loadError && (
                    <InlineErrorState
                        message="Could not load field officials list."
                        onRetry={() => void loadStaff(true)}
                        retrying={retrying}
                    />
                )}

                {loading ? (
                    <p className="text-sm text-slate-500">Loading registered personnel…</p>
                ) : !loadError && staffList.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
                        <ShieldCheck className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
                        <p className="mt-2 text-sm font-medium text-slate-700">No field officials registered yet</p>
                        <p className="mt-1 text-xs text-slate-500">
                            Use the form above to onboard Barangay Tanods and field inspectors for your jurisdiction.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                        {staffList.map((staff) => (
                            <article
                                key={staff.id}
                                className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 hover:bg-slate-50/50 transition-colors"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-slate-900 text-sm">{staff.full_name}</h4>
                                        <span className="text-xs text-slate-400">@{staff.username}</span>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                staff.is_active
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}
                                        >
                                            {staff.is_active ? 'Active' : 'Deactivated'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">{staff.email}</p>
                                </div>
                                <button
                                    type="button"
                                    disabled={togglingId === staff.id}
                                    onClick={() => void toggleStatus(staff)}
                                    className={`min-h-11 min-w-11 rounded-md border px-3 py-1.5 text-xs font-semibold outline-none transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                                        staff.is_active
                                            ? 'border-red-200 text-red-700 hover:bg-red-50'
                                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                    }`}
                                >
                                    {togglingId === staff.id
                                        ? 'Updating…'
                                        : staff.is_active
                                        ? 'Deactivate'
                                        : 'Activate'}
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
