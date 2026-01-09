const axios = require('axios');
const fs = require('fs');
const path = require('path');

const RSS_ITEMS_PATH = 'temp/rss-items.json';
const OUTPUT_DIR = 'src/data/digest';

const CURATOR_PROMPT = `You are an expert radiology educator curating daily news for senior residents (R3-R4 level).

INPUT: RSS feed items from RSNA, RadioGraphics, AuntMinnie, Radiopaedia, ACR (provided as JSON)

TASK:
1. Select the 8 most clinically relevant articles for senior residents
2. Rank all articles by importance (1-100 scale)
3. Write a 2-sentence daily summary
4. For top 8 stories, write 50-word summaries focusing on:
   - Clinical implications
   - How it changes practice
   - Board exam relevance

OUTPUT FORMAT: TOON (Token-Oriented Object Notation). Use the exact schema below. Do not use JSON.

SCHEMA:
digest:
  date: YYYY-MM-DD
  generated_at: ISO8601_TIMESTAMP
  curator_model: meta-llama/llama-3.1-405b-instruct:free
  total_articles: NUMBER
  
summary:
  Multi-line text summary here.

top_stories[8]{title,source,url,category,importance,ai_summary}:
  Title,Source,URL,Category,ImportanceScore,"AI Summary in quotes"

articles[]{id,title,source,category,relevance_score}:
  id_1,Title,Source,Category,Score

CRITERIA:
- Prioritize: practice-changing findings, new guidelines, breakthrough AI/tech, high-yield review topics
- Avoid: basic anatomy, first-year topics, purely administrative news
- Categories: neuro, chest, msk, abdomen, physics, ir
`;

async function curateDigest() {
    if (!fs.existsSync(RSS_ITEMS_PATH)) {
        console.error('No RSS items found. Run fetch-rss.js first.');
        process.exit(1);
    }

    const rssItems = JSON.parse(fs.readFileSync(RSS_ITEMS_PATH));

    console.log('Calling LLM to curate content...');

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemma-3n-e4b-it:free',
            messages: [{
                role: 'user',
                content: `${CURATOR_PROMPT}\n\nRSS ITEMS:\n${JSON.stringify(rssItems, null, 2)}`
            }],
            max_tokens: 3000
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const digestTOON = response.data.choices[0].message.content;
        const date = new Date().toISOString().split('T')[0];

        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        // Clean up response if it contains markdown code blocks
        let cleanTOON = digestTOON;
        if (digestTOON.includes('```toon')) {
            cleanTOON = digestTOON.split('```toon')[1].split('```')[0].trim();
        } else if (digestTOON.includes('```')) {
            cleanTOON = digestTOON.split('```')[1].split('```')[0].trim();
        }

        fs.writeFileSync(path.join(OUTPUT_DIR, `${date}.toon`), cleanTOON);
        console.log(`Digest generated at ${path.join(OUTPUT_DIR, `${date}.toon`)}`);

    } catch (error) {
        console.error('LLM Error:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

curateDigest();
