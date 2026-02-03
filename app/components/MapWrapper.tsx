'use client';

import dynamic from 'next/dynamic';

const LeadMap = dynamic(() => import('./LeadMap'), { ssr: false });

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
    lat?: number;
    lng?: number;
}

interface ZoneInfo {
    name: string;
    url?: string;
    companiesUrl?: string; // Optional
    companies?: string[];
    lat?: number;
    lng?: number;
    city?: string;
}

interface MapWrapperProps {
    leads: Lead[];
    zones?: ZoneInfo[];
}

export default function MapWrapper({ leads, zones = [] }: MapWrapperProps) {
    return <LeadMap leads={leads} zones={zones} />;
}
