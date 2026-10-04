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
    const baseStyle = "w-full py-3.5 px-6 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed";
    const colorStyle = isAdminMode 
        ? "bg-[#091B35] hover:bg-[#0F2D59] shadow-[#091B35]/20" 
        : "bg-[#0284C7] hover:bg-[#0369A1] shadow-[#0284C7]/25";

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