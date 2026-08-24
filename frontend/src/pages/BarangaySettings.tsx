import React, { useEffect, useState } from 'react';
import { axiosPrivate } from '../api/axios';
import { useAuth } from '../context/AuthContext';

export const BarangaySettings: React.FC = () => {
  const { user } = useAuth();
  
  const [barangayId, setBarangayId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [officeContact, setOfficeContact] = useState('');
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [sealPreview, setSealPreview] = useState<string | null>(null);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [sealFile, setSealFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axiosPrivate.get('/auth/barangay/');
        // The endpoint returns a paginated list or an array since it's a ViewSet list route
        const data = response.data.results ? response.data.results[0] : response.data[0];
        
        if (data) {
          setBarangayId(data.id);
          setName(data.name || '');
          setCaptainName(data.captain_name || '');
          setOfficeContact(data.office_contact || '');
          setLogoPreview(data.logo);
          setSealPreview(data.city_seal);
        }
      } catch (err) {
        console.error("Failed to fetch barangay settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'seal') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === 'logo') {
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      } else {
        setSealFile(file);
        setSealPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barangayId) return;
    
    setSaving(true);
    setMessage({ text: '', type: '' });

    const formData = new FormData();
    formData.append('captain_name', captainName);
    formData.append('office_contact', officeContact);
    
    if (logoFile) formData.append('logo', logoFile);
    if (sealFile) formData.append('city_seal', sealFile);

    try {
      await axiosPrivate.patch(`/auth/barangay/${barangayId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage({ text: 'Settings updated successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to update settings. Please try again.', type: 'error' });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-600">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Barangay Identity Settings</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your Barangay's official seals, contact information, and leadership details used in generated documents.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-8 space-y-8">
          
          {/* General Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">General Information</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Barangay Name (Read-only)</label>
                <input type="text" value={name} disabled className="mt-1 block w-full bg-slate-50 border border-slate-300 rounded-md shadow-sm py-2 px-3 text-slate-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Punong Barangay (Captain's Name)</label>
                <input 
                  type="text" 
                  value={captainName} 
                  onChange={(e) => setCaptainName(e.target.value)}
                  placeholder="e.g. Juan Dela Cruz"
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" 
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Office Contact Detail / Sub-header</label>
                <input 
                  type="text" 
                  value={officeContact} 
                  onChange={(e) => setOfficeContact(e.target.value)}
                  placeholder="e.g. Office of the Punong Barangay | Tel: 123-4567"
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" 
                />
              </div>
            </div>
          </div>

          {/* Official Seals */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Official Seals (Used in PDFs)</h3>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              
              {/* City Seal */}
              <div className="flex flex-col items-center p-6 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <span className="text-sm font-medium text-slate-700 mb-4">City / Municipality Seal (Left)</span>
                {sealPreview ? (
                  <img src={sealPreview} alt="City Seal Preview" className="h-32 w-32 object-contain mb-4 rounded-md shadow-sm" />
                ) : (
                  <div className="h-32 w-32 bg-slate-200 rounded-md mb-4 flex items-center justify-center text-slate-400">No Image</div>
                )}
                <label className="cursor-pointer bg-white border border-slate-300 px-4 py-2 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Upload City Seal
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'seal')} />
                </label>
              </div>

              {/* Barangay Logo */}
              <div className="flex flex-col items-center p-6 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <span className="text-sm font-medium text-slate-700 mb-4">Barangay Logo (Right)</span>
                {logoPreview ? (
                  <img src={logoPreview} alt="Barangay Logo Preview" className="h-32 w-32 object-contain mb-4 rounded-md shadow-sm" />
                ) : (
                  <div className="h-32 w-32 bg-slate-200 rounded-md mb-4 flex items-center justify-center text-slate-400">No Image</div>
                )}
                <label className="cursor-pointer bg-white border border-slate-300 px-4 py-2 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Upload Barangay Logo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
                </label>
              </div>

            </div>
          </div>

        </div>

        <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
