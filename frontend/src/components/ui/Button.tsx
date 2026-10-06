import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isAdminMode?: boolean;
    loading?: boolean;
    loadingText?: string;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    isAdminMode = false,
    loading = false,
    loadingText = 'Loading...',
    className = '',
    disabled,
    ...props
}) => {
    const baseStyle = "w-full py-3.5 px-6 text-white font-bold text-sm rounded-medium shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed";
    const colorStyle = isAdminMode
        ? "bg-brand-admin hover:bg-brand-admin-hover shadow-brand-admin/20"
        : "bg-brand-accent hover:bg-brand-accent-hover shadow-brand-accent/25";

    return (
        <button
            disabled={disabled || loading}
            className={`${baseStyle} ${colorStyle} ${className}`}
            {...props}
        >
            <span>{loading ? loadingText : children}</span>
        </button>
    );
};
