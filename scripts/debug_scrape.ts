import axios from 'axios';
import * as cheerio from 'cheerio';

const ZONES_URL = 'https://simplanter.fr/departements/vendee/zones-activite';

async function debug() {
    try {
        const { data } = await axios.get(ZONES_URL);
        const $ = cheerio.load(data);

        console.log("Page title:", $('title').text());
        console.log("Number of h3 tags:", $('h3').length);

        const firstH3 = $('h3').first();
        console.log("First H3 text:", firstH3.text());
        console.log("First H3 parent html:", firstH3.parent().html()?.substring(0, 500));
        console.log("First H3 next siblings:", firstH3.nextAll().slice(0, 3).map((_, e) => $(e).prop('tagName')).get());

        // Try to find any link containing "zone-activites"
        const zoneLinks = $('a[href*="/zone-activites/"]');
        console.log("Number of links with /zone-activites/:", zoneLinks.length);
        if (zoneLinks.length > 0) {
            console.log("First zone link href:", zoneLinks.first().attr('href'));
            console.log("First zone link text:", zoneLinks.first().text());
            console.log("First zone link parent:", zoneLinks.first().parent().prop('tagName'));
        }

    } catch (e) {
        console.error(e);
    }
}

debug();
