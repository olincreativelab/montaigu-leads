import React from 'react';
import { MapPin, Phone, Globe, Mail } from 'lucide-react';

interface Lead {
    name: string;
    category: string;
    address: string;
    city: string;
    zipCode: string;
    phone?: string;
    email?: string;
    website?: string;
    zone?: string;
}

interface LeadCardProps {
    lead: Lead;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead }) => {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-lg transition-all duration-300 hover:border-white/40 hover:bg-white/20 hover:shadow-xl hover:shadow-indigo-500/10">
            <div className="flex flex-col gap-4">
                {/* Header */}
                <div>
                    <span className="mb-2 inline-block rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 backdrop-blur-sm">
                        {lead.category || 'Business'}
                    </span>
                    <h3 className="line-clamp-2 text-xl font-bold text-white group-hover:text-indigo-200">
                        {lead.name}
                    </h3>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2 text-sm text-slate-300">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                    <span>
                        {lead.address}
                        <br />
                        {lead.zipCode} {lead.city}
                    </span>
                </div>

                {/* Actions */}
                <div className="mt-2 flex flex-wrap gap-2">
                    {lead.phone && (
                        <a
                            href={`tel:${lead.phone}`}
                            className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500/20 hover:text-indigo-300"
                        >
                            <Phone className="h-4 w-4" />
                            Call
                        </a>
                    )}
                    {lead.website && (
                        <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500/20 hover:text-indigo-300"
                        >
                            <Globe className="h-4 w-4" />
                            Website
                        </a>
                    )}
                    {lead.email && (
                        <a
                            href={`mailto:${lead.email}`}
                            className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500/20 hover:text-indigo-300"
                        >
                            <Mail className="h-4 w-4" />
                            Email
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};
