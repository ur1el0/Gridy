import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Book, Loader2 } from 'lucide-react';
import { axiosPrivate } from '../../api/axios';

interface FAQItem {
    id?: number;
    question: string;
    answer: string;
}

const DEFAULT_FAQS: FAQItem[] = [
    {
        question: "How do I process a walk-in document request?",
        answer: "Navigate to the 'Documents' tab on the left sidebar. Click the 'New Request' button in the top right corner. Fill out the resident's name, document type, and purpose, then click 'Submit Manual Log'. The document will instantly appear in the processing queue."
    },
    {
        question: "How do I advance the Live Queue?",
        answer: "Go to the 'Queue' tab. You can click 'Call Next Resident' to automatically advance the queue sequentially. Alternatively, you can manually select 'Serve' on any waiting ticket in the list to jump them to the front."
    },
    {
        question: "What happens when I reject a resident's verification?",
        answer: "If you reject a resident in the 'Verifications' tab, they will receive an immediate notification stating their ID was invalid. They will have to re-upload their identification through the resident portal."
    },
    {
        question: "Can I delete a resident from the system completely?",
        answer: "Yes. In the 'Directory' tab, you can search for the verified resident and click the red trash icon. Note that this action is permanent and will immediately revoke their mobile app access."
    }
];

export const Faqs: React.FC = () => {
    const [faqs, setFaqs] = useState<FAQItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const response = await axiosPrivate.get('/faqs/');
                const data = response.data.results || response.data;
                if (Array.isArray(data) && data.length > 0) {
                    setFaqs(data);
                } else {
                    setFaqs(DEFAULT_FAQS);
                }
            } catch (err) {
                console.error("Failed to load FAQs from backend, using defaults:", err);
                setFaqs(DEFAULT_FAQS);
            } finally {
                setLoading(false);
            }
        };

        fetchFaqs();
    }, []);

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">Help & FAQs</h1>
                    <p className="text-[#64748b] text-sm mt-1">Frequently asked questions and support for Barangay Officials.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Main FAQ Accordion */}
                <div className="md:col-span-2 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Book className="w-5 h-5 text-primary-text" />
                                Quick Start Guide
                            </h2>
                        </div>
                        
                        {loading ? (
                            <div className="p-12 flex items-center justify-center text-slate-400">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                <span>Loading FAQs...</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {faqs.map((faq, index) => (
                                    <div key={faq.id || index} className="p-2">
                                        <button 
                                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 rounded-xl transition-colors"
                                        >
                                            <span className="font-semibold text-slate-800 pr-4">{faq.question}</span>
                                            {openIndex === index ? (
                                                <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                                            )}
                                        </button>
                                        
                                        {openIndex === index && (
                                            <div className="px-4 pb-4 pt-1 text-sm text-slate-600 leading-relaxed">
                                                {faq.answer}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Support Sidebar */}
                <div className="space-y-4">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-sm">
                        <HelpCircle className="w-8 h-8 mb-4 text-blue-200" />
                        <h3 className="text-lg font-bold mb-2">Still need help?</h3>
                        <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                            Our technical support team is available 24/7 to assist barangay administrators with the Gridy platform.
                        </p>
                    </div>

                    {/* Legal & Compliance Guidelines */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            <h3 className="text-lg font-bold text-slate-900">Legal Compliance</h3>
                        </div>
                        <ul className="space-y-3">
                            <li className="text-sm">
                                <span className="font-bold text-slate-800 block">RA 10173 (Data Privacy Act of 2012)</span>
                                <span className="text-slate-500 leading-relaxed">Strict adherence to data minimization, secure storage of IDs, and explicit resident consent for data processing.</span>
                            </li>
                            <li className="text-sm">
                                <span className="font-bold text-slate-800 block">RA 11261 (First Time Jobseekers Act)</span>
                                <span className="text-slate-500 leading-relaxed">Waiver of fees for barangay clearances requested by verified first-time jobseekers.</span>
                            </li>
                            <li className="text-sm">
                                <span className="font-bold text-slate-800 block">RA 11055 (PhilSys Act)</span>
                                <span className="text-slate-500 leading-relaxed">Acceptance and secure verification of the Philippine Identification System (PhilSys) as primary proof of identity.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};