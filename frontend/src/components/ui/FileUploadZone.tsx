import React from "react";
import { Upload, X } from "lucide-react";

interface FileUploadZoneProps {
    label: string;
    file: File | null;
    onFileChange: (file: File | null) => void;
    placeholder?: string;
    disabled?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
    label,
    file,
    onFileChange,
    placeholder = 'Choose photo...',
    disabled = false
}) => {
    return (
        <div>
            <label className="block text-[10px] font-bold tracking-wider text-neutral-secondary uppercase mb-1">
                {label}
            </label>
            <div className="flex items-center gap-2">
                <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-surface border border-dashed rounded-small text-xs transition-all ${
                    disabled
                        ? 'border-border text-neutral-hint cursor-not-allowed opacity-75'
                        : 'border-border-strong hover:border-brand-accent text-neutral-secondary hover:text-brand-accent cursor-pointer'
                }`}>
                    <Upload className="w-3.5 h-3.5" />
                    <span className="truncate">{file ? file.name : placeholder}</span>
                    <input 
                        type="file" 
                        accept="image/*" 
                        disabled={disabled}
                        className="hidden" 
                        onChange={(e) => onFileChange(e.target.files?.[0] || null)} 
                    />
                </label>
                {file && !disabled && (
                    <button
                        type="button"
                        onClick={() => onFileChange(null)}
                        className="p-2 text-neutral-hint hover:text-red-500 rounded-small hover:bg-red-50 transition-colors"
                        title="Remove attachment"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
