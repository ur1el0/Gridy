import { useEffect, useState, type FormEvent } from 'react';
import { axiosPrivate } from '../../api/axios';

interface PaymentRecipient {
    id: number;
    provider: 'GCASH' | 'MAYA' | 'BANK' | 'OTHER';
    provider_label: string;
    display_name: string;
    recipient_name: string;
    recipient_identifier: string;
    instructions: string;
    is_active: boolean;
}

const providers = [
    { value: 'GCASH', label: 'GCash' },
    { value: 'MAYA', label: 'Maya' },
    { value: 'BANK', label: 'Bank transfer' },
    { value: 'OTHER', label: 'Other e-payment' },
] as const;
const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export function PaymentRecipientSettings() {
    const [recipients, setRecipients] = useState<PaymentRecipient[]>([]);
    const [provider, setProvider] = useState<PaymentRecipient['provider']>('GCASH');
    const [displayName, setDisplayName] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [instructions, setInstructions] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const loadRecipients = async () => {
        try {
            const response = await axiosPrivate.get('/payment-recipients/');
            setRecipients(response.data.results || response.data);
        } catch {
            setMessage('Could not load payment recipients.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void loadRecipients(); }, []);

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await axiosPrivate.post('/payment-recipients/', {
                provider,
                display_name: displayName.trim(),
                recipient_name: recipientName.trim(),
                recipient_identifier: identifier.trim(),
                instructions: instructions.trim(),
            });
            setDisplayName('');
            setRecipientName('');
            setIdentifier('');
            setInstructions('');
            setMessage('Recipient added. Residents in this barangay can now use it.');
            await loadRecipients();
        } catch (requestError: any) {
            setMessage(requestError.response?.data?.detail || 'Could not save the payment recipient.');
        } finally {
            setSaving(false);
        }
    };

    const setActive = async (recipient: PaymentRecipient) => {
        try {
            const response = await axiosPrivate.patch(`/payment-recipients/${recipient.id}/`, { is_active: !recipient.is_active });
            setRecipients((current) => current.map((item) => item.id === recipient.id ? response.data : item));
        } catch {
            setMessage('Could not update recipient availability.');
        }
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Electronic payment recipients</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Enter only the official recipient name, account or wallet identifier, and transfer instructions. Gridy does not store passwords or PINs and staff verify every reference manually.</p>
            {message && <p role="status" className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
            <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">Provider
                    <select className={inputClass} value={provider} onChange={(event) => setProvider(event.target.value as PaymentRecipient['provider'])}>
                        {providers.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                </label>
                <label className="text-sm font-medium text-slate-700">Label residents will recognize
                    <input className={inputClass} value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={100} required placeholder="Barangay Hall GCash" />
                </label>
                <label className="text-sm font-medium text-slate-700">Official recipient name
                    <input className={inputClass} value={recipientName} onChange={(event) => setRecipientName(event.target.value)} maxLength={255} required />
                </label>
                <label className="text-sm font-medium text-slate-700">Account number or wallet identifier
                    <input className={inputClass} value={identifier} onChange={(event) => setIdentifier(event.target.value)} maxLength={100} required autoComplete="off" />
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">Transfer instructions
                    <textarea className={inputClass} value={instructions} onChange={(event) => setInstructions(event.target.value)} maxLength={1000} rows={3} placeholder="Include the document request number in the transfer note." />
                </label>
                <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50 sm:col-span-2">{saving ? 'Saving…' : 'Add payment recipient'}</button>
            </form>
            <div className="mt-6 space-y-3" aria-live="polite">
                {loading ? <p className="text-sm text-slate-500">Loading configured recipients…</p> : recipients.length === 0 ? <p className="text-sm text-slate-500">No e-payment recipients configured. Cash collection remains available.</p> : recipients.map((recipient) => (
                    <article key={recipient.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4">
                        <div><h3 className="font-semibold text-slate-900">{recipient.display_name} <span className="text-xs font-normal text-slate-500">({recipient.provider_label})</span></h3><p className="text-sm text-slate-600">{recipient.recipient_name} · {recipient.recipient_identifier}</p>{recipient.instructions && <p className="mt-1 text-xs text-slate-500">{recipient.instructions}</p>}</div>
                        <button type="button" onClick={() => void setActive(recipient)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">{recipient.is_active ? 'Deactivate' : 'Activate'}</button>
                    </article>
                ))}
            </div>
        </section>
    );
}
