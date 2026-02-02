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

interface MapWrapperProps {
    leads: Lead[];
}

export default function MapWrapper({ leads }: MapWrapperProps) {
    return <LeadMap leads={leads} />;
}
