import React, { useEffect, useState} from "react";
import { axiosPrivate } from "../api/axios";
import { Search, Trash2, ShieldCheck, Mail, Phone } from "lucide-react";

interface Resident {
    id: number;
    username?: string;
    email?: string;
    full_name: string;
    birth_date: string;
    voter_status: boolean;
    contact_number: string;
    purok?: string | number | null;
}

export const ResidentsManagement: React.FC = () => {
    const [residents, setResidents] = useState<Resident[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    const fetchResidents = async () => {
        try {
            const response = await axiosPrivate.get('/auth/resident/')
            setResidents(response.data.results || response.data)
        } catch (err) {
            console.error("Failed to fetch directory:", err)
        } finally {
            setLoading(false)
        }
    }  
    
    useEffect(() => {
    fetchResidents();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to permanently remove this resident? This will revoke all their access.")) return;
    try {
      await axiosPrivate.delete(`/auth/resident/${id}/`);
      setResidents(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Failed to delete resident", err);
      alert("Failed to delete resident.");
    }
  };

  const filteredResidents = residents.filter(r => 
    (r.full_name || '').toLowerCase().includes(search.toLowerCase()) || 
    (r.username || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">Residents Directory</h1>
          <p className="text-[#64748b] text-sm mt-1">Manage all verified barangay residents.</p>
        </div>
        
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
          />
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-[#64748b] text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-6">Resident Info</th>
                <th className="py-3.5 px-6">Account ID</th>
                <th className="py-3.5 px-6">Contact</th>
                <th className="py-3.5 px-6 text-center">Voter Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400">Loading directory...</td></tr>
              ) : filteredResidents.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400">No verified residents found.</td></tr>
              ) : (
                filteredResidents.map(resident => (
                  <tr key={resident.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          {resident.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{resident.full_name}</div>
                          <div className="text-xs text-slate-500">Born: {resident.birth_date}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6 font-medium text-slate-700">
                      @{resident.username || 'resident'}
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex flex-col gap-1">
                        {resident.email && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Mail className="w-3 h-3 text-slate-400" /> {resident.email}
                          </div>
                        )}
                        {resident.contact_number && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" /> {resident.contact_number}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center">
                      {resident.voter_status ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                          <ShieldCheck className="w-3 h-3" /> Registered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Unregistered
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      <button
                        onClick={() => handleDelete(resident.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        title="Delete Resident"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
