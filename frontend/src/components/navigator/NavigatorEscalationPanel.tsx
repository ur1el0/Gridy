import React from 'react';
import { Building2, Phone } from 'lucide-react';
import type { NavigatorEscalation } from './types';

interface NavigatorEscalationPanelProps {
    escalation: NavigatorEscalation;
}

export const NavigatorEscalationPanel: React.FC<NavigatorEscalationPanelProps> = ({ escalation }) => (
    <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
        <p className="flex items-start gap-1.5 text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{escalation.barangay_hall_notice}</span>
        </p>

        {escalation.office_contact && (
            <p className="flex items-center gap-1.5 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                <span>
                    Barangay office: <strong className="font-semibold">{escalation.office_contact}</strong>
                </span>
            </p>
        )}

        {escalation.hotlines.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
                <h5 className="font-bold text-[11px] text-slate-600 uppercase tracking-wider mb-1">
                    Emergency Hotlines
                </h5>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {escalation.hotlines.map((hotline) => (
                        <li
                            key={`${hotline.name}-${hotline.number}`}
                            className="px-2 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700"
                        >
                            <span className="block font-semibold text-slate-900">{hotline.name}</span>
                            <a
                                href={`tel:${hotline.number.replace(/[^\d+]/g, '')}`}
                                className="inline-flex items-center min-h-[44px] py-1 text-primary font-semibold underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                            >
                                {hotline.number}
                            </a>
                            <span className="block text-[10px] text-slate-500">{hotline.category}</span>
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>
);
