import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.terresdemontaigu.fr/entreprendre/annuaire-entreprises/';
const MAX_PAGES = 120; // 120 pages detected in HTML
const DATA_DIR = path.join(process.cwd(), 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'leads.json');

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
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapePage(pageNumber: number): Promise<Lead[]> {
    const url = pageNumber === 1 ? BASE_URL : `${BASE_URL}page/${pageNumber}/`;
    console.log(`Scraping page ${pageNumber}/${MAX_PAGES}: ${url}`);

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            }
        });
        const $ = cheerio.load(data);
        const leads: Lead[] = [];

        // The modals contain the structured data we need
        $('.modal-monterritoire').each((_, element) => {
            const $modal = $(element);
            const $article = $modal.find('article.article-monterritoire');

            if ($article.length === 0) return;

            const name = $article.find('.article-title').text().trim();

            // Category extraction
            let category = '';
            $article.find('.line-tags .tag').each((_, tag) => {
                const text = $(tag).text().trim();
                if (text.startsWith('Activité :')) {
                    category = text.replace('Activité :', '').trim();
                } else if (!category) {
                    category = text;
                }
            });

            // Information list extraction
            const $infos = $article.find('ul.line-informations');
            let fullAddress = '';
            let phone = '';
            let email = '';
            let website = '';

            $infos.find('li').each((_, li) => {
                const $li = $(li);
                if ($li.find('.fa-map-marker').length > 0) {
                    fullAddress = $li.text().trim();
                } else if ($li.find('.fa-phone').length > 0) {
                    phone = $li.find('a').attr('href')?.replace('tel:', '') || $li.text().trim(); // Fallback to text if href fails
                } else if ($li.find('.fa-envelope').length > 0) {
                    email = $li.find('a').attr('href')?.replace('mailto:', '') || '';
                } else if ($li.find('.fa-globe').length > 0) {
                    website = $li.find('a').attr('href') || '';
                }
            });

            // Parse Address for City/Zip
            const zipMatch = fullAddress.match(/(85\d{3})\s+(.*)/);
            let zipCode = '';
            let city = '';
            let addressLine = fullAddress;

            if (zipMatch) {
                zipCode = zipMatch[1];
                city = zipMatch[2].trim();
                addressLine = fullAddress.replace(zipCode, '').replace(city, '').trim();
            }

            if (name) {
                leads.push({
                    name,
                    category,
                    address: addressLine,
                    zipCode,
                    city,
                    phone: phone ? phone.trim() : undefined,
                    email: email ? email.trim() : undefined,
                    website: website ? website.trim() : undefined,
                });
            }
        });

        return leads;
    } catch (error) {
        console.error(`Error scraping page ${pageNumber}:`, error);
        return [];
    }
}

async function main() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR);
    }

    let allLeads: Lead[] = [];

    // Loop through pages
    console.log(`Starting scrape for all ${MAX_PAGES} pages...`);

    for (let i = 1; i <= MAX_PAGES; i++) {
        const pageLeads = await scrapePage(i);
        if (pageLeads.length === 0) {
            console.log("No leads found on this page, likely reached end or error.");
            break;
        }
        allLeads = allLeads.concat(pageLeads);
        console.log(`Found ${pageLeads.length} leads on page ${i}. Total accumulated: ${allLeads.length}`);

        // Save periodically
        if (i % 5 === 0) {
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allLeads, null, 2));
        }

        // Rate limiting
        await sleep(1000);
    }

    // Final Save
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allLeads, null, 2));
    console.log(`\nScraping complete!`);
    console.log(`Saved ${allLeads.length} leads to ${OUTPUT_FILE}`);
}

main();
