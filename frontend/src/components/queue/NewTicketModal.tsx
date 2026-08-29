import React from 'react';
import { X, Search, ChevronsUpDown } from 'lucide-react';

interface NewTicketModalProps {
  handleCloseManualModal: () => void;
  handleCreateManualTicket: (e: React.FormEvent) => void;
  searchResident: string;
  setSearchResident: (val: string) => void;
  serviceRequired: string;
  setServiceRequired: (val: string) => void;
  priorityStatus: 'regular' | 'priority';
  setPriorityStatus: (val: 'regular' | 'priority') => void;
  notes: string;
  setNotes: (val: string) => void;
  isSubmittingNew: boolean;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  handleCloseManualModal,
  handleCreateManualTicket,
  searchResident,
  setSearchResident,
  serviceRequired,
  setServiceRequired,
  priorityStatus,
  setPriorityStatus,
  notes,
  setNotes,
  isSubmittingNew
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-[480px] w-full p-8 relative animate-fade-in text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleCloseManualModal}
          className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="pr-6">
          <h2 className="text-[22px] font-bold text-[#0f172a] tracking-tight">
            Manual Queue Entry
          </h2>
          <p className="text-[13px] text-[#64748b] mt-1 leading-snug">
            Manually register a resident into the current live queue system.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleCreateManualTicket} className="space-y-4 mt-6">
          {/* Field 1: Search Resident */}
          <div>
            <label className="block text-sm font-bold text-[#0f172a] mb-2">
              Search Resident
            </label>
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchResident}
                onChange={(e) => setSearchResident(e.target.value)}
                placeholder="Search by name or Resident ID..."
                className="w-full pl-11 pr-4 py-3 bg-[#EEF2FF]/60 hover:bg-[#EEF2FF] focus:bg-[#EEF2FF] border border-transparent focus:border-[#0047BA]/20 rounded-xl text-sm text-[#0f172a] placeholder-[#94a3b8] outline-none transition-all"
              />
            </div>
          </div>

          {/* Field 2: Service Required */}
          <div>
            <label className="block text-sm font-bold text-[#0f172a] mb-2">
              Service Required
            </label>
            <div className="relative">
              <select
                value={serviceRequired}
                onChange={(e) => setServiceRequired(e.target.value)}
                required
                className={`w-full appearance-none pl-4 pr-10 py-3 bg-[#EEF2FF]/60 hover:bg-[#EEF2FF] focus:bg-[#EEF2FF] border border-transparent focus:border-[#0047BA]/20 rounded-xl text-sm font-medium outline-none transition-all cursor-pointer ${
                  serviceRequired ? 'text-[#0f172a]' : 'text-[#94a3b8]'
                }`}
              >
                <option value="" disabled className="text-slate-400">
                  Select a service category
                </option>
                <option value="Barangay Clearance" className="text-slate-800">Barangay Clearance</option>
                <option value="Cedula / Community Tax" className="text-slate-800">Cedula / Community Tax</option>
                <option value="Certificate of Indigency" className="text-slate-800">Certificate of Indigency</option>
                <option value="Business Permit Endorsement" className="text-slate-800">Business Permit Endorsement</option>
                <option value="Barangay ID Issuance" className="text-slate-800">Barangay ID Issuance</option>
                <option value="Complaint Filing / Mediation" className="text-slate-800">Complaint Filing / Mediation</option>
                <option value="General Public Assistance" className="text-slate-800">General Public Assistance</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronsUpDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Field 3: Priority Status */}
          <div>
            <label className="block text-sm font-bold text-[#0f172a] mb-2">
              Priority Status
            </label>
            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setPriorityStatus('regular')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer text-center ${
                  priorityStatus === 'regular'
                    ? 'bg-[#DCE7FF] text-[#0047BA]'
                    : 'bg-[#EEF2FF]/60 text-[#334155] hover:bg-[#EEF2FF]'
                }`}
              >
                Regular
              </button>

              <button
                type="button"
                onClick={() => setPriorityStatus('priority')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  priorityStatus === 'priority'
                    ? 'bg-[#DCE7FF] text-[#0047BA]'
                    : 'bg-[#EEF2FF]/60 text-[#334155] hover:bg-[#EEF2FF]'
                }`}
              >
                <span className="font-bold">!</span>
                <span>Priority/Senior/PWD</span>
              </button>
            </div>
          </div>

          {/* Field 4: Notes */}
          <div>
            <label className="block text-sm font-bold text-[#0f172a] mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional details or special requests..."
              className="w-full py-3 px-4 bg-[#EEF2FF]/60 hover:bg-[#EEF2FF] focus:bg-[#EEF2FF] border border-transparent focus:border-[#0047BA]/20 rounded-xl text-sm text-[#0f172a] placeholder-[#94a3b8] outline-none transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={handleCloseManualModal}
              className="text-sm font-bold text-[#334155] hover:text-[#0f172a] px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingNew || !serviceRequired}
              className="bg-[#0052CC] hover:bg-[#0047BA] active:bg-[#003882] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-700/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingNew ? 'Adding...' : 'Add to Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

