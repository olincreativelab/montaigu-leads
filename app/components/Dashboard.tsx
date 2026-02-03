'use client';

import React, { useState, useMemo } from 'react';
import { LeadCard } from './LeadCard';
import MapWrapper from './MapWrapper';
import { Search, Map as MapIcon, Filter } from 'lucide-react';

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
    lat?: number;
    lng?: number;
}

interface DashboardProps {
    initialLeads: Lead[];
    zones: ZoneInfo[];
}

export function Dashboard({ initialLeads, zones }: DashboardProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedZone, setSelectedZone] = useState<string>('All');

    // unique categories
    const categories = useMemo(() => {
        const cats = new Set(initialLeads.map(l => l.category).filter(Boolean));
        return ['All', ...Array.from(cats).sort()];
    }, [initialLeads]);

    // unique zones (from leads + zones list)
    const zoneNames = useMemo(() => {
        const fromLeads = new Set(initialLeads.map(l => l.zone).filter(Boolean));
        // Also include zones from the scraped list that might not have leads yet but are relevant
        zones.forEach(z => fromLeads.add(z.name));
        return ['All', ...Array.from(fromLeads).sort()];
    }, [initialLeads, zones]);

    // Filter Logic
    const filteredLeads = useMemo(() => {
        return initialLeads.filter(lead => {
            const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lead.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || lead.category === selectedCategory;
            const matchesZone = selectedZone === 'All' || lead.zone === selectedZone;

            return matchesSearch && matchesCategory && matchesZone;
        });
    }, [initialLeads, searchQuery, selectedCategory, selectedZone]);

    return (
        <div className="flex flex-1 overflow-hidden h-full">
            {/* Left Panel: Filters & List */}
            <div className="flex w-[450px] flex-col border-r border-indigo-500/10 bg-slate-900/30 backdrop-blur-sm">

                {/* Search & Filters Header */}
                <div className="p-4 border-b border-indigo-500/10 space-y-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search companies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Filters Row */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-slate-400 ml-1 mb-1 block">Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat} className="bg-slate-900 text-white">
                                        {cat.length > 30 ? cat.substring(0, 30) + '...' : cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 ml-1 mb-1 block">Activity Zone</label>
                            <select
                                value={selectedZone}
                                onChange={(e) => setSelectedZone(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                            >
                                {zoneNames.map(zone => (
                                    <option key={zone} value={zone} className="bg-slate-900 text-white">
                                        {zone}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 px-1">
                        <span>{filteredLeads.length} matches</span>
                        {filteredLeads.length !== initialLeads.length && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('All');
                                    setSelectedZone('All');
                                }}
                                className="text-indigo-400 hover:text-indigo-300"
                            >
                                Reset filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    {filteredLeads.map((lead, idx) => (
                        <LeadCard key={idx} lead={lead} />
                    ))}
                    {filteredLeads.length === 0 && (
                        <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                            <Filter className="h-8 w-8 mb-2 opacity-50" />
                            <p>No leads found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Map */}
            <div className="flex-1 relative bg-slate-950">
                <MapWrapper leads={filteredLeads} zones={zones} />
            </div>
        </div>
    );
}
