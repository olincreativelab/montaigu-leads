import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://simplanter.fr';
const ZONES_URL = 'https://simplanter.fr/departements/vendee/zones-activite';
const DATA_DIR = path.join(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const ZONES_FILE = path.join(DATA_DIR, 'zones.json');

interface Lead {
    name: string;
    category: string;
    address: string;
    city: string;
    zipCode: string;
    phone?: string;
    email?: string;
    website?: string;
    description?: string;
    zone?: string;
    lat?: number;
    lng?: number;
}

interface ZoneInfo {
    name: string;
    url: string;
    companiesUrl?: string;
    companies: string[];
    lat?: number;
    lng?: number;
    city?: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .replace(/^(sarl|sas|sci|eurl|sa)\s+/i, "")
        .replace(/\s+(sarl|sas|sci|eurl|sa)$/i, "")
        .trim();
}

async function geocodeZone(name: string, city: string): Promise<{ lat: number; lng: number } | null> {
    const query = `${name} ${city}`;
    try {
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`;
        const response = await axios.get(url);
        if (response.data && response.data.features && response.data.features.length > 0) {
            const [lng, lat] = response.data.features[0].geometry.coordinates;
            return { lat, lng };
        }
    } catch (e) {
        // ignore
    }
    return null;
}

async function scrapeZonesList(): Promise<ZoneInfo[]> {
    console.log(`Scraping zones list from ${ZONES_URL}...`);
    try {
        const { data } = await axios.get(ZONES_URL);
        const $ = cheerio.load(data);
        const zones: ZoneInfo[] = [];

        const $h3s = $('h3');
        const $links = $('a[href*="/zone-activites/"]');

        console.log(`Found ${$h3s.length} H3s and ${$links.length} Links.`);

        // Use the smaller length to avoid out-of-bounds, though they should be equal
        const count = Math.min($h3s.length, $links.length);

        for (let i = 0; i < count; i++) {
            const $h3 = $h3s.eq(i);
            const $link = $links.eq(i);

            const name = $h3.text().trim();
            const href = $link.attr('href');

            // Find city in the paragraph immediately following the H3
            let city = '';
            const desc = $h3.next('p').text();
            if (desc) {
                const cityMatch = desc.match(/-\s+([A-Z\s\-]+)\s+\(/);
                city = cityMatch ? cityMatch[1].trim() : '';
            }

            if (name && href) {
                zones.push({
                    name,
                    url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
                    companies: [],
                    city: city
                });
            }
        }

        console.log(`Successfully parsed ${zones.length} zones.`);
        return zones;
    } catch (error) {
        console.error("Error scraping zones list:", (error as Error).message);
        return [];
    }
}

async function scrapeZoneCompanies(zoneUrl: string): Promise<string[]> {
    try {
        const { data: zoneData } = await axios.get(zoneUrl);
        const $zone = cheerio.load(zoneData);

        const companiesLink = $zone('a[href$="/entreprises"]').attr('href');

        if (!companiesLink) {
            return [];
        }

        const fullCompaniesUrl = companiesLink.startsWith('http') ? companiesLink : `${BASE_URL}${companiesLink}`;

        await sleep(200);
        const { data: companiesData } = await axios.get(fullCompaniesUrl);
        const $companies = cheerio.load(companiesData);

        const companyNames: string[] = [];

        $companies('.list-group-item h4, .card-title, h4, h5').each((_, el) => {
            const text = $companies(el).text().trim();
            if (text && text.length > 2 &&
                !text.startsWith('Répartition') &&
                !text.startsWith('Toutes') &&
                !text.startsWith('Les zones')) {
                companyNames.push(text);
            }
        });

        return [...new Set(companyNames)];
    } catch (error: any) {
        // console.error(`Error scraping companies for zone ${zoneUrl}:`, error.message);
        return [];
    }
}

async function main() {
    if (!fs.existsSync(LEADS_FILE)) {
        console.error(`Leads file not found at ${LEADS_FILE}`);
        return;
    }
    const leads: Lead[] = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
    console.log(`Loaded ${leads.length} leads.`);

    const zones = await scrapeZonesList();

    // Filter Relevant Zones
    const targetZips = new Set(leads.map(l => l.zipCode).filter(Boolean));
    const targetCities = new Set(leads.map(l => l.city.toUpperCase().trim()).filter(Boolean));

    const relevantZones = zones.filter(z => {
        if (z.city && targetCities.has(z.city.toUpperCase().trim())) return true;
        const text = z.name.toUpperCase();
        return Array.from(targetCities).some(city => text.includes(city)) ||
            Array.from(targetZips).some(zip => text.includes(zip));
    });

    console.log(`Filtered down to ${relevantZones.length} relevant zones.`);

    let matchCount = 0;
    const enrichedZones: ZoneInfo[] = [];

    // Increase batch size or parallelism slightly if too slow? 
    // We'll stick to sequential but maybe no sleep for companies list if it's failing

    for (let i = 0; i < relevantZones.length; i++) {
        const zone = relevantZones[i];
        console.log(`[${i + 1}/${relevantZones.length}] Processing ${zone.name}...`);

        const coords = await geocodeZone(zone.name, zone.city || '');
        if (coords) {
            zone.lat = coords.lat;
            zone.lng = coords.lng;
        }

        const companyNames = await scrapeZoneCompanies(zone.url);
        zone.companies = companyNames;

        if (companyNames.length > 0) {
            for (const companyName of companyNames) {
                const normalizedZoneCompany = normalizeName(companyName);

                const matchIndex = leads.findIndex(lead => {
                    const leadName = normalizeName(lead.name);
                    return leadName === normalizedZoneCompany ||
                        leadName.startsWith(normalizedZoneCompany) ||
                        normalizedZoneCompany.startsWith(leadName);
                });

                if (matchIndex !== -1) {
                    if (!leads[matchIndex].zone) {
                        leads[matchIndex].zone = zone.name;
                        matchCount++;
                        console.log(`   -> MATCH: ${leads[matchIndex].name} in ${zone.name}`);
                    }
                }
            }
        }

        enrichedZones.push(zone);
        await sleep(100);
    }

    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
    fs.writeFileSync(ZONES_FILE, JSON.stringify(enrichedZones, null, 2));

    console.log(`\nDone!`);
    console.log(`Matched ${matchCount} leads to zones.`);
}

main();
