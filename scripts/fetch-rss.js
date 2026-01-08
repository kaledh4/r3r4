const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

// Determine path to config.toon relative to this script
// Assumes running from root as per node scripts/fetch-rss.js
const CONFIG_PATH = path.join('src', 'data', 'config.toon');

// We need the TOON parser here. Since it's an ES module or class, 
// and we are running in a Node script context which might default to CommonJS if package.json not set to module.
// However, the previous TOONParser was written in a way it exports to module.exports if defined.
// Let's copy/paste the parser or require it if possible. 
// Given the complexity of requiring local modules in mixed envs without full package.json setup, 
// a simple solution for this script is to regex-parse the config for RSS URLs directly.
// But we want to be robust. 
// Let's assume we can require it. I'll make sure TOONParser is require-able.
// Wait, I wrote TOONParser in src/modules/toon-parser.js with module.exports support.

const TOONParser = require('../src/modules/toon-parser.js');

async function fetchAllFeeds() {
    const parser = new Parser();

    if (!fs.existsSync(CONFIG_PATH)) {
        console.error(`Config not found at ${CONFIG_PATH}`);
        process.exit(1);
    }

    const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = TOONParser.parse(configContent);

    const allItems = [];

    console.log('Fetching feeds from config...');

    // Config.rss_sources is an array
    if (config.rss_sources) {
        for (const source of config.rss_sources) {
            console.log(`Fetching ${source.name}...`);
            try {
                const feed = await parser.parseURL(source.url);

                for (const item of feed.items.slice(0, 10)) {  // Top 10 per source
                    allItems.push({
                        source: source.name,
                        category: source.category,
                        title: item.title,
                        link: item.link,
                        pubDate: item.pubDate,
                        summary: item.contentSnippet ? item.contentSnippet.substring(0, 300) : ''
                    });
                }
            } catch (err) {
                console.error(`Failed to fetch ${source.name}:`, err.message);
            }
        }
    }

    if (!fs.existsSync('temp')) {
        fs.mkdirSync('temp');
    }

    fs.writeFileSync('temp/rss-items.json', JSON.stringify(allItems, null, 2));
    console.log(`Saved ${allItems.length} items to temp/rss-items.json`);
}

fetchAllFeeds();
