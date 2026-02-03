import fs from 'fs';
import path from 'path';
import axios from 'axios';

const DATA_DIR = path.join(process.cwd(), 'data');
const INPUT_FILE = path.join(DATA_DIR, 'leads.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'leads_geocoded.json');

// Interface for the Lead model
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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function geocodeAddress(lead: Lead): Promise<{ lat: number; lng: number } | null> {
    // Construct a clean query
    // Priority: "Address City Zip"
    const query = `${lead.address} ${lead.zipCode} ${lead.city}`.trim();

    try {
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`;
        const response = await axios.get(url);

        if (response.data && response.data.features && response.data.features.length > 0) {
            const geometry = response.data.features[0].geometry;
            const [lng, lat] = geometry.coordinates; // GeoJSON is [lon, lat]
            return { lat, lng };
        }
    } catch (error) {
        console.error(`Error geocoding ${query}: ${(error as Error).message}`);
    }
    return null;
}

async function main() {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`Input file not found: ${INPUT_FILE}`);
        return;
    }

    const rawData = fs.readFileSync(INPUT_FILE, 'utf-8');
    const leads: Lead[] = JSON.parse(rawData);
    const geocodedLeads: Lead[] = [];

    console.log(`Starting geocoding for ${leads.length} leads...`);

    let successCount = 0;

    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];

        // Skip if already has coordinates (idempotency)
        if (lead.lat && lead.lng) {
            geocodedLeads.push(lead);
            continue;
        }

        console.log(`[${i + 1}/${leads.length}] Geocoding: ${lead.name}...`);
        const coords = await geocodeAddress(lead);

        if (coords) {
            lead.lat = coords.lat;
            lead.lng = coords.lng;
            successCount++;
        } else {
            console.warn(`Could not geocode: ${lead.name}`);
        }

        geocodedLeads.push(lead);

        // Save periodically
        if (i % 10 === 0) {
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geocodedLeads, null, 2));
        }

        // Rate limiting (respect the free API)
        await sleep(200); // 5 request per second is safe for this API
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geocodedLeads, null, 2));
    console.log(`Geocoding complete. Enriched ${successCount} leads. Saved to ${OUTPUT_FILE}`);
}

main();
