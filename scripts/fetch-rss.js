const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

// Hardcoded high-yield radiology sources to ensure reliable daily fetches
const RSS_SOURCES = [
    { name: 'RSNA Radiology', url: 'https://pubs.rsna.org/action/showFeed?type=etoc&feed=rss&jc=radiology', category: 'journal' },
    { name: 'RadioGraphics', url: 'https://pubs.rsna.org/action/showFeed?type=etoc&feed=rss&jc=radiographics', category: 'journal' },
    { name: 'AuntMinnie', url: 'https://www.auntminnie.com/rss.xml', category: 'news' },
    { name: 'Radiopaedia', url: 'https://radiopaedia.org/cases.rss', category: 'cases' }
];

async function fetchAllFeeds() {
    const parser = new Parser();
    const allItems = [];

    console.log('Fetching feeds...');

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
