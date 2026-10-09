import React from 'react';
import { FileSpreadsheet, X, Download } from 'lucide-react';
import type { ImportSummary } from './types';

interface ResidentImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    csvFile: File | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDownloadTemplate: () => void;
    onSubmit: (e: React.FormEvent) => void;
    importing: boolean;
    importSummary: ImportSummary | null;
}

export const ResidentImportModal: React.FC<ResidentImportModalProps> = ({
    isOpen,
    onClose,
    csvFile,
    onFileChange,
    onDownloadTemplate,
    onSubmit,
    importing,
    importSummary,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2.5">
                        <FileSpreadsheet className="w-5 h-5 text-primary-text" />
                        <h3 className="text-base font-bold text-slate-900">Import Census / RBI Records</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-5">
                    <div className="flex items-center justify-between p-3.5 bg-primary/5 border border-primary/20 rounded-xl">
                        <div className="text-xs text-slate-700">
                            <span className="font-bold block">Need the standard format?</span>
                            Download the pre-structured RBI template.
                        </div>
                        <button
                            type="button"
                            onClick={onDownloadTemplate}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-primary/10 border border-primary/20 text-primary-text text-xs font-bold rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Template</span>
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Upload CSV File (.csv)
                        </label>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={onFileChange}
                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded-xl p-2 bg-slate-50/50"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                            Supported format: UTF-8 CSV containing username, email, full_name, birth_date, purok, etc.
                        </p>
                    </div>

                    {importSummary && (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="text-xs font-bold text-slate-700">Import Summary:</div>
                            <div className="flex gap-4 text-xs">
                                <span className="text-emerald-700 font-bold">Imported: {importSummary.imported}</span>
                                <span className="text-amber-700 font-bold">Duplicates Skipped: {importSummary.skipped_due_to_duplicate}</span>
                            </div>
                            {importSummary.errors.length > 0 && (
                                <div className="text-xs text-rose-600 max-h-24 overflow-y-auto mt-1">
                                    {importSummary.errors.map((err, i) => (
                                        <div key={i}>• {err}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={importing || !csvFile}
                            className="px-5 py-2 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                        >
                            {importing ? 'Processing Import...' : 'Import Records'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
