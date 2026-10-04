// frontend/src/components/ui/TextField.tsx
import React from 'react';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: React.ReactNode;
    isAdminMode?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
    label,
    icon,
    isAdminMode = false,
    className = '',
    ...props
}) => {
    return (
        <div className={className}>
            <label className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-1.5">
                {icon}
                {label}
            </label>
            <input
                {...props}
                className={`w-full px-4 py-3 bg-[#EEF2F6] focus:bg-white border border-transparent rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all ${
                    isAdminMode
                        ? 'focus:border-[#091B35] focus:ring-1 focus:ring-[#091B35]'
                        : 'focus:border-[#0284C7]'
                }`}
            />
        </div>
    );
};