import React from 'react';
import { KeyRound } from 'lucide-react';
import { TextField } from '../../ui/TextField';

interface AdminCredentialsSectionProps {
    passkey: string;
    onPasskeyChange: (val: string) => void;
    affirmation: boolean;
    onAffirmationChange: (checked: boolean) => void;
}

export const AdminCredentialsSection: React.FC<AdminCredentialsSectionProps> = ({
    passkey,
    onPasskeyChange,
    affirmation,
    onAffirmationChange,
}) => {
    return (
        <div className="space-y-4">
            <TextField
                label="LGU ADMINISTRATIVE PASSKEY"
                type="password"
                required
                value={passkey}
                onChange={(e) => onPasskeyChange(e.target.value)}
                placeholder="Enter secure LGU passkey"
                isAdminMode={true}
                icon={<KeyRound className="w-3.5 h-3.5 text-red-500" />}
            />

            <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={affirmation}
                        onChange={(e) => onAffirmationChange(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-[#091B35] rounded focus:ring-0 border-slate-300 cursor-pointer shrink-0"
                    />
                    <span className="text-xs text-slate-600 leading-relaxed">
                        I affirm that I am an authorized barangay official or personnel and agree to official LGU protocols.
                    </span>
                </label>
            </div>
        </div>
    );
};
