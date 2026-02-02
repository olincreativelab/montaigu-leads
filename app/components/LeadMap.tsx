'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';

// Fix for default marker icon in Next.js
const defaultIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface Lead {
    name: string;
    category: string;
    address: string;
    city: string;
    zipCode: string;
    phone?: string;
    lat?: number;
    lng?: number;
}

interface LeadMapProps {
    leads: Lead[];
}

const LeadMap: React.FC<LeadMapProps> = ({ leads }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="h-full w-full animate-pulse bg-slate-800/50" />;
    }

    // Montaigu Center
    const center = [46.973, -1.313] as [number, number];

    // Filter leads with valid coordinates (mock logic for now as we don't have lat/lng yet)
    // TODO: Add geocoding step
    const validLeads = leads.filter(l => l.lat && l.lng);

    return (
        <div className="h-full w-full overflow-hidden rounded-2xl border border-white/20">
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {validLeads.map((lead, idx) => (
                    <Marker
                        key={idx}
                        position={[lead.lat!, lead.lng!]}
                        icon={defaultIcon}
                    >
                        <Popup>
                            <div className="font-sans text-sm">
                                <strong className="block text-base font-bold text-slate-800">{lead.name}</strong>
                                <p className="text-slate-600">{lead.category}</p>
                                <p className="mt-1 text-xs text-slate-500">{lead.address}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default LeadMap;
