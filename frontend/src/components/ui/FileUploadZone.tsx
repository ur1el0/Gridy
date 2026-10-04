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
            <label className="block text-[10px] font-bold tracking-wider text-slate-600 uppercase mb-1">
                {label}
            </label>
            <div className="flex items-center gap-2">
                <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed rounded-lg text-xs transition-all ${
                    disabled 
                        ? 'border-slate-200 text-slate-400 cursor-not-allowed opacity-75' 
                        : 'border-slate-300 hover:border-[#0284C7] text-slate-600 hover:text-[#0284C7] cursor-pointer'
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
                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove attachment"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}