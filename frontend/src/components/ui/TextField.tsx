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
            <label className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-neutral-muted uppercase mb-1.5">
                {icon}
                {label}
            </label>
            <input
                {...props}
                className={`w-full px-4 py-3 bg-surface-input focus:bg-surface border border-transparent rounded-medium text-sm font-medium text-neutral-primary placeholder-neutral-hint outline-none transition-all ${
                    isAdminMode
                        ? 'focus:border-brand-admin focus:ring-1 focus:ring-brand-admin'
                        : 'focus:border-brand-accent'
                }`}
            />
        </div>
    );
};
