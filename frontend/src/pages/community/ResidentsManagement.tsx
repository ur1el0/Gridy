import toast from 'react-hot-toast';
import React, { useEffect, useState } from "react";
import { axiosPrivate } from "../../api/axios";
import { 
    Search, Trash2, Mail, Phone, Upload, Download, FileSpreadsheet, 
    X, ShieldCheck, CheckCircle2, User, 
    ExternalLink, FileText, Home
} from "lucide-react";

interface Resident {
    id: number;
    username?: string;
    email?: string;
    full_name: string;
    birth_date: string;
    voter_status: boolean;
    contact_number: string;
    purok?: string | number | null;
    is_verified?: boolean;
    guardian?: number | null;
    philsys_id_number?: string | null;
    philsys_id_photo?: string | null;
    secondary_id_type?: string | null;
    secondary_id_photo?: string | null;
    utility_billing_type?: string | null;
    utility_billing_photo?: string | null;
}

interface ImportSummary {
    imported: number;
    skipped_due_to_duplicate: number;
    errors: string[];
}

export const ResidentsManagement: React.FC = () => {
    const [residents, setResidents] = useState<Resident[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Detail Modal State
    const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

    // Import Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

    const fetchResidents = async () => {
        try {
            const response = await axiosPrivate.get('/auth/resident/');
            setResidents(response.data.results || response.data);
        } catch (err) {
            console.error("Failed to fetch directory:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResidents();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to permanently remove this resident? This will revoke all their access.")) return;
        try {
            await axiosPrivate.delete(`/auth/resident/${id}/`);
            setResidents(prev => prev.filter(r => r.id !== id));
            if (selectedResident?.id === id) {
                setSelectedResident(null);
            }
            toast.success('Resident record deleted.');
        } catch (err) {
            console.error("Failed to delete resident", err);
            toast.error('Failed to delete resident.');
        }
    };

    const getAge = (birthDateStr: string) => {
        if (!birthDateStr) return 'N/A';
        const birth = new Date(birthDateStr);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return `${age} years old`;
    };

    const handleDownloadTemplate = () => {
        const header = "username,email,full_name,birth_date,contact_number,purok,voter_status,philsys_id_number\n";
        const sample1 = "juandelacruz,juan@example.com,Juan Dela Cruz,1990-05-15,09171234567,Purok 1,True,1234-5678-9012-3456\n";
        const sample2 = "mariasantos,,Maria Santos,1985-11-20,,Purok 2,False,\n";
        const csvContent = "data:text/csv;charset=utf-8," + header + sample1 + sample2;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "barangay_rbi_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.csv')) {
                toast.error('Please upload a valid .csv file.');
                return;
            }
            setCsvFile(file);
            setImportSummary(null);
        }
    };

    const handleImportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!csvFile) {
            toast.error('Please select a CSV file to import.');
            return;
        }

        try {
            setImporting(true);
            const formData = new FormData();
            formData.append('file', csvFile);

            const res = await axiosPrivate.post('/auth/import-residents/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setImportSummary(res.data);
            toast.success(`Successfully imported ${res.data.imported} resident records!`);
            fetchResidents();
        } catch (err: any) {
            const errorData = err.response?.data;
            if (errorData && errorData.imported !== undefined) {
                setImportSummary(errorData);
                toast.error('Import completed with validation warnings.');
                fetchResidents();
            } else {
                toast.error(errorData?.detail || 'Failed to import CSV file.');
            }
        } finally {
            setImporting(false);
        }
    };

    const filteredResidents = residents.filter(r => 
        r.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (r.username && r.username.toLowerCase().includes(search.toLowerCase())) ||
        (r.purok && String(r.purok).toLowerCase().includes(search.toLowerCase())) ||
        (r.philsys_id_number && r.philsys_id_number.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            {/* Header and Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Residents Directory & RBI</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Click any resident row to view their complete dossier and identification proofs.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search name, PhilSys ID, purok..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-2xs"
                        />
                    </div>

                    <button
                        onClick={() => {
                            setIsImportModalOpen(true);
                            setImportSummary(null);
                            setCsvFile(null);
                        }}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-sm font-bold shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Import CSV</span>
                    </button>
                </div>
            </div>

            {/* Resident Directory Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-[#64748b] text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                                <th className="py-3.5 px-6">Resident Info</th>
                                <th className="py-3.5 px-6">Purok / Zone</th>
                                <th className="py-3.5 px-6">Account ID</th>
                                <th className="py-3.5 px-6">Contact</th>
                                <th className="py-3.5 px-6 text-center">PhilSys / Verification</th>
                                <th className="py-3.5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="py-12 text-center text-slate-400">Loading directory...</td></tr>
                            ) : filteredResidents.length === 0 ? (
                                <tr><td colSpan={6} className="py-12 text-center text-slate-400">No verified residents found.</td></tr>
                            ) : (
                                filteredResidents.map(resident => (
                                    <tr 
                                        key={resident.id} 
                                        onClick={() => setSelectedResident(resident)}
                                        className="hover:bg-primary/5 transition-colors cursor-pointer group"
                                    >
                                        <td className="py-3.5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary-text flex items-center justify-center font-bold text-sm shadow-2xs">
                                                    {resident.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 group-hover:text-primary-text transition-colors">{resident.full_name}</div>
                                                    <div className="text-xs text-slate-500">Born: {resident.birth_date} ({getAge(resident.birth_date)})</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-6 font-medium text-slate-700">
                                            {resident.purok ? String(resident.purok) : <span className="text-slate-400 italic">Unassigned</span>}
                                        </td>
                                        <td className="py-3.5 px-6 text-slate-600 font-mono text-xs">
                                            {resident.username ? `@${resident.username}` : 'None'}
                                        </td>
                                        <td className="py-3.5 px-6 text-slate-600">
                                            <div className="flex flex-col gap-0.5 text-xs">
                                                {resident.contact_number && (
                                                    <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> {resident.contact_number}</span>
                                                )}
                                                {resident.email && (
                                                    <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> {resident.email}</span>
                                                )}
                                                {!resident.contact_number && !resident.email && <span className="text-slate-400 italic">No contact info</span>}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-6 text-center">
                                            {resident.philsys_id_number ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary-text border border-primary/20">
                                                    <ShieldCheck className="w-3.5 h-3.5 text-primary-text" />
                                                    PhilSys: {resident.philsys_id_number.slice(0, 4)}••••
                                                </span>
                                            ) : resident.is_verified ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                    Verified Resident
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                    Pending PhilSys
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-6 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(resident.id);
                                                }}
                                                title="Delete Resident"
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Resident Profile Inspection Modal */}
            {selectedResident && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
                                    {selectedResident.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{selectedResident.full_name}</h3>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                                        <span className="font-mono">Account ID: @{selectedResident.username || 'resident'}</span>
                                        <span>•</span>
                                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Citizen
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedResident(null)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Personal & Contact Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-primary-text" /> Personal Demographics
                                    </div>
                                    <div className="space-y-1.5 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Birth Date:</span>
                                            <span className="font-semibold text-slate-800">{selectedResident.birth_date}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Age:</span>
                                            <span className="font-semibold text-slate-800">{getAge(selectedResident.birth_date)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Purok / Zone:</span>
                                            <span className="font-semibold text-slate-800">{selectedResident.purok || 'Not Specified'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Voter Status:</span>
                                            <span className={`font-semibold ${selectedResident.voter_status ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                {selectedResident.voter_status ? 'Registered Voter' : 'Non-Voter'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-primary-text" /> Contact Information
                                    </div>
                                    <div className="space-y-1.5 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Contact Number:</span>
                                            <span className="font-semibold text-slate-800">{selectedResident.contact_number || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Email Address:</span>
                                            <span className="font-semibold text-slate-800 truncate max-w-[160px]">{selectedResident.email || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">System Role:</span>
                                            <span className="font-semibold text-primary-text">Resident</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Official Identification & PhilSys Proof */}
                            <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-bold text-primary-text uppercase tracking-wider flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4 text-primary-text" /> Philippine National ID (PhilSys)
                                    </div>
                                    {selectedResident.philsys_id_number ? (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary-text">
                                            Verified Card
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                                            No PhilSys on Record
                                        </span>
                                    )}
                                </div>

                                <div className="bg-white p-3.5 rounded-xl border border-blue-100 flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] text-slate-500">PhilSys Card Number</div>
                                        <div className="font-mono font-bold text-slate-900 text-sm">
                                            {selectedResident.philsys_id_number || 'Not registered via PhilSys'}
                                        </div>
                                    </div>
                                    {selectedResident.philsys_id_photo && (
                                        <a 
                                            href={selectedResident.philsys_id_photo} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-bold text-primary-text hover:underline"
                                        >
                                            <span>View ID Photo</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Secondary Valid ID & Utility Billing Proofs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-slate-500" /> Secondary Valid ID
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-slate-500">Type: </span>
                                        <span className="font-semibold text-slate-800">{selectedResident.secondary_id_type || 'None provided'}</span>
                                    </div>
                                    {selectedResident.secondary_id_photo ? (
                                        <a 
                                            href={selectedResident.secondary_id_photo} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-bold text-primary-text hover:underline mt-1"
                                        >
                                            <span>View Attached ID Photo</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <div className="text-xs text-slate-400 italic">No secondary photo uploaded.</div>
                                    )}
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Home className="w-3.5 h-3.5 text-slate-500" /> Proof of Residency
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-slate-500">Type: </span>
                                        <span className="font-semibold text-slate-800">{selectedResident.utility_billing_type || 'Utility / House Billing'}</span>
                                    </div>
                                    {selectedResident.utility_billing_photo ? (
                                        <a 
                                            href={selectedResident.utility_billing_photo} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-bold text-primary-text hover:underline mt-1"
                                        >
                                            <span>View Billing Receipt</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <div className="text-xs text-slate-400 italic">No utility billing attached.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                            <button
                                onClick={() => setSelectedResident(null)}
                                className="px-5 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                            >
                                Close Dossier
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSV Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-2.5">
                                <FileSpreadsheet className="w-5 h-5 text-primary-text" />
                                <h3 className="text-base font-bold text-slate-900">Import Census / RBI Records</h3>
                            </div>
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleImportSubmit} className="p-6 space-y-5">
                            <div className="flex items-center justify-between p-3.5 bg-primary/5 border border-primary/20 rounded-xl">
                                <div className="text-xs text-slate-700">
                                    <span className="font-bold block">Need the standard format?</span>
                                    Download the pre-structured RBI template.
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDownloadTemplate}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-primary/10 border border-primary/20 text-primary-text text-xs font-bold rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download Template</span>
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Upload CSV File (.csv)
                                </label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded-xl p-2 bg-slate-50/50"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Supported format: UTF-8 CSV containing username, email, full_name, birth_date, purok, etc.
                                </p>
                            </div>

                            {importSummary && (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                    <div className="text-xs font-bold text-slate-700">Import Summary:</div>
                                    <div className="flex gap-4 text-xs">
                                        <span className="text-emerald-700 font-bold">Imported: {importSummary.imported}</span>
                                        <span className="text-amber-700 font-bold">Duplicates Skipped: {importSummary.skipped_due_to_duplicate}</span>
                                    </div>
                                    {importSummary.errors.length > 0 && (
                                        <div className="text-xs text-rose-600 max-h-24 overflow-y-auto mt-1">
                                            {importSummary.errors.map((err, i) => (
                                                <div key={i}>• {err}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsImportModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={importing || !csvFile}
                                    className="px-5 py-2 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                                >
                                    {importing ? 'Processing Import...' : 'Import Records'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};