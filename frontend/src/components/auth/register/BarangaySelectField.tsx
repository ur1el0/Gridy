import React from 'react';
import { Link } from 'react-router-dom';

export interface PublicBarangay {
    id: number;
    name: string;
    municipality: string;
    province: string;
}

interface BarangaySelectFieldProps {
    barangayId: string;
    onBarangayIdChange: (val: string) => void;
    barangays: PublicBarangay[];
    loadingBarangays: boolean;
    barangayDirectoryError?: string;
    isAdminMode: boolean;
}

export const BarangaySelectField: React.FC<BarangaySelectFieldProps> = ({
    barangayId,
    onBarangayIdChange,
    barangays,
    loadingBarangays,
    barangayDirectoryError,
    isAdminMode,
}) => {
    return (
        <div>
            <div>
                <label className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                    LOCAL BARANGAY JURISDICTION
                </label>
                <select
                    required
                    value={barangayId}
                    disabled={loadingBarangays || barangays.length === 0}
                    onChange={(e) => onBarangayIdChange(e.target.value)}
                    className={`w-full px-4 py-3 bg-[#EEF2F6] focus:bg-white border border-transparent rounded-xl text-sm font-medium text-slate-900 outline-none transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                        isAdminMode ? 'focus:border-[#091B35] focus:ring-1 focus:ring-[#091B35]' : 'focus:border-[#0284C7]'
                    }`}
                >
                    <option value="">{loadingBarangays ? 'Loading approved barangays…' : 'Select your Barangay'}</option>
                    {barangays.map((barangay) => (
                        <option key={barangay.id} value={barangay.id}>
                            {barangay.name}{barangay.municipality ? ` (${barangay.municipality}${barangay.province ? `, ${barangay.province}` : ''})` : ''}
                        </option>
                    ))}
                </select>
                {barangayDirectoryError && <p role="alert" className="mt-2 text-xs text-rose-700">{barangayDirectoryError}</p>}
            </div>

            {isAdminMode && (
                <p className="text-xs text-slate-600 mt-2">
                    Registering a new barangay? <Link to="/register/barangay" className="font-bold text-primary-text underline">Apply for DILG review</Link>.
                </p>
            )}
        </div>
    );
};
