import fs from 'fs';
import path from 'path';
import axios from 'axios';

const DATA_DIR = path.join(process.cwd(), 'data');
const INPUT_FILE = path.join(DATA_DIR, 'leads.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'leads.json'); // Overwrite safely

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

// Rate limiting: 10-50 calls per second allowed by the API, but let's be safe with 100ms delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function geocodeAddress(address: string, city: string, zipCode: string): Promise<{ lat: number; lng: number } | null> {
    try {
        // Construct query: "Address City ZipCode"
        const query = `${address} ${city} ${zipCode}`;
        const encodedQuery = encodeURIComponent(query);
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodedQuery}&limit=1`;

        const response = await axios.get(url);

        if (response.data && response.data.features && response.data.features.length > 0) {
            const coordinates = response.data.features[0].geometry.coordinates;
            // API returns [long, lat], we want { lat, lng }
            return {
                lng: coordinates[0],
                lat: coordinates[1]
            };
        }
        return null;
    } catch (error: any) {
        console.error(`Error geocoding ${address}:`, error.message);
        return null;
    }
}

async function main() {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error("Leads file not found!");
        return;
    }

    const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
    let leads: Lead[] = JSON.parse(rawData);

    console.log(`Loaded ${leads.length} leads.`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Process in batches to save progress
    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];

        // Skip if already geocoded
        if (lead.lat && lead.lng) {
            skippedCount++;
            continue;
        }

        // Skip if no address
        if (!lead.address && !lead.city) {
            console.log(`Skipping ${lead.name} (no address)`);
            continue;
        }

        console.log(`Geocoding (${i + 1}/${leads.length}): ${lead.name}...`);

        const coords = await geocodeAddress(lead.address, lead.city, lead.zipCode);

        if (coords) {
            leads[i].lat = coords.lat;
            leads[i].lng = coords.lng;
            updatedCount++;
        } else {
            console.log(`❌ Could not geocode: ${lead.name}`);
        }

        // Rate limit
        await sleep(100);

        // Save progress every 20 items
        if (i % 20 === 0) {
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(leads, null, 2));
        }
    }

    // Final save
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(leads, null, 2));
    console.log(`\nGeocoding complete!`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Previously Geocoded/Skipped: ${skippedCount}`);
    console.log(`Total: ${leads.length}`);
}

main();
