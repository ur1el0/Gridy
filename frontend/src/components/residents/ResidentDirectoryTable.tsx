import React from 'react';
import { Trash2, Mail, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { Resident } from './types';

interface ResidentDirectoryTableProps {
    residents: Resident[];
    loading: boolean;
    onSelectResident: (resident: Resident) => void;
    onDeleteResident: (id: number) => void;
    getAge: (birthDateStr: string) => string;
}

export const ResidentDirectoryTable: React.FC<ResidentDirectoryTableProps> = ({
    residents,
    loading,
    onSelectResident,
    onDeleteResident,
    getAge,
}) => {
    return (
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
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-slate-400">Loading directory...</td>
                            </tr>
                        ) : residents.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-slate-400">No verified residents found.</td>
                            </tr>
                        ) : (
                            residents.map((resident) => (
                                <tr
                                    key={resident.id}
                                    onClick={() => onSelectResident(resident)}
                                    className="hover:bg-primary/5 transition-colors cursor-pointer group"
                                >
                                    <td className="py-3.5 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary-text flex items-center justify-center font-bold text-sm shadow-2xs">
                                                {resident.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 group-hover:text-primary-text transition-colors">
                                                    {resident.full_name}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    Born: {resident.birth_date} ({getAge(resident.birth_date)})
                                                </div>
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
                                                <span className="flex items-center gap-1.5">
                                                    <Phone className="w-3 h-3 text-slate-400" /> {resident.contact_number}
                                                </span>
                                            )}
                                            {resident.email && (
                                                <span className="flex items-center gap-1.5">
                                                    <Mail className="w-3 h-3 text-slate-400" /> {resident.email}
                                                </span>
                                            )}
                                            {!resident.contact_number && !resident.email && (
                                                <span className="text-slate-400 italic">No contact info</span>
                                            )}
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
                                                onDeleteResident(resident.id);
                                            }}
                                            aria-label={`Delete ${resident.full_name}`}
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
    );
};
