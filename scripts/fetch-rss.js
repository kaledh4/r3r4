const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

// Verified High-Yield Radiology Feeds (2026)
const RSS_SOURCES = [
    // RSNA Journals (PubMed RSS is more reliable than direct site)
    { name: 'Radiology (PubMed)', url: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/1J9v_4U-1-1-1-1-1-1/?term=%22Radiology%22%5BJournal%5D&limit=20', category: 'journal' },
    { name: 'RadioGraphics (PubMed)', url: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/1J9v_4U-1-1-1-1-1-1/?term=%22Radiographics%22%5BJournal%5D&limit=20', category: 'journal' },
    // AuntMinnie (Often blocks, trying alternative aggregator or specific topic feed)
    { name: 'ScienceDaily Radiology', url: 'https://www.sciencedaily.com/rss/health_medicine/radiology.xml', category: 'news' },
    // Radiopaedia (New Case Feed)
    { name: 'Radiopaedia Cases', url: 'https://radiopaedia.org/cases/feed', category: 'cases' },
    // European Society of Radiology
    { name: 'Eur. Radiology', url: 'https://link.springer.com/search.rss?facet-content-type=Article&facet-journal-id=330&channel-name=European+Radiology', category: 'journal' }
];

async function fetchAllFeeds() {
    // Add User-Agent to avoid 403 Forbidden
    const parser = new Parser({
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        requestOptions: {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        }
    });

    const allItems = [];

    console.log('Fetching feeds with defined User-Agent...');

    for (const source of RSS_SOURCES) {
        console.log(`Fetching ${source.name}...`);
        try {
            const feed = await parser.parseURL(source.url);

            for (const item of feed.items.slice(0, 15)) {  // Fetch top 15 to ensure plenty of content
                allItems.push({
                    source: source.name,
                    category: source.category,
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate,
                    contentSnippet: item.contentSnippet ? item.contentSnippet.substring(0, 500) : ''
                });
            }
        } catch (err) {
            console.error(`Failed to fetch ${source.name}:`, err.message);
        }
    }

    if (!fs.existsSync('temp')) {
        fs.mkdirSync('temp');
    }

    // Save with a timestamp to help debugging
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Successfully fetched ${allItems.length} items.`);

    fs.writeFileSync('temp/rss-items.json', JSON.stringify(allItems, null, 2));
}

fetchAllFeeds();
