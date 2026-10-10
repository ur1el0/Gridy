import React from 'react';
import { NavLink } from 'react-router-dom';
import type { ActivityItem } from './types';

interface AppointmentsTableProps {
    activities: ActivityItem[];
}

export const AppointmentsTable: React.FC<AppointmentsTableProps> = ({ activities }) => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-12 bg-surface rounded-large p-6 shadow-xs border border-border/80 flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base lg:text-lg font-bold text-neutral-primary">
                        Today's Appointments
                    </h2>
                    <NavLink
                        to="/communications"
                        className="text-xs lg:text-sm font-semibold text-primary-text hover:underline"
                    >
                        View All Schedule
                    </NavLink>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-surface-table/70 text-neutral-muted text-[11px] font-bold uppercase tracking-wider">
                                <th className="py-2.5 px-4 rounded-l-lg">TIME / DATE</th>
                                <th className="py-2.5 px-4">EVENT</th>
                                <th className="py-2.5 px-4">LOCATION</th>
                                <th className="py-2.5 px-4 rounded-r-lg">STATUS</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-surface-subtle">
                            {activities.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-sm text-neutral-hint font-medium">
                                        No appointments or activities scheduled.
                                    </td>
                                </tr>
                            ) : (
                                activities.slice(0, 5).map((act) => {
                                    const dateObj = new Date(act.event_datetime);
                                    const isValidDate = !isNaN(dateObj.getTime());
                                    const timeFormatted = isValidDate
                                        ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : act.event_datetime;
                                    const dateFormatted = isValidDate
                                        ? dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })
                                        : '';
                                    const isUpcoming = isValidDate ? dateObj.getTime() >= Date.now() : true;
                                    const initial = act.title ? act.title.charAt(0).toUpperCase() : 'A';

                                    return (
                                        <tr key={act.id} className="hover:bg-background/60 transition-colors">
                                            <td className="py-3.5 px-4 font-semibold text-neutral-primary whitespace-nowrap">
                                                <div>{timeFormatted}</div>
                                                {dateFormatted && (
                                                    <div className="text-xs text-neutral-hint font-normal">{dateFormatted}</div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-pill bg-primary/15 text-primary-text font-bold text-xs flex items-center justify-center shrink-0">
                                                        {initial}
                                                    </div>
                                                    <span className="font-bold text-neutral-primary">{act.title}</span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-neutral-secondary font-medium whitespace-nowrap">
                                                {act.location || '--'}
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span
                                                    className={`px-3 py-1 rounded-pill text-xs font-semibold inline-block ${
                                                        isUpcoming
                                                            ? 'bg-primary/10 text-primary-text'
                                                            : 'bg-surface-waiting text-neutral-muted'
                                                    }`}
                                                >
                                                    {isUpcoming ? 'Upcoming' : 'Completed'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
);
