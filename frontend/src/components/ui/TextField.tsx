// frontend/src/components/ui/TextField.tsx
import React, { useId } from 'react';

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
    const generatedId = useId();
    const inputId = props.id ?? generatedId;

    return (
        <div className={className}>
            <label htmlFor={inputId} className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-neutral-muted uppercase mb-1.5">
                {icon && <span aria-hidden="true">{icon}</span>}
                {label}
            </label>
            <input
                {...props}
                id={inputId}
                className={`w-full px-4 py-3 bg-surface-input focus:bg-surface border border-transparent rounded-medium text-sm font-medium text-neutral-primary placeholder-neutral-hint outline-none transition-all focus-visible:ring-2 ${
                    isAdminMode
                        ? 'focus:border-brand-admin focus-visible:ring-brand-admin/25'
                        : 'focus:border-brand-accent focus-visible:ring-brand-accent/25'
                }`}
            />
        </div>
    );
};
