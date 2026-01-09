const axios = require('axios');
const fs = require('fs');
const path = require('path');

const DIGEST_DIR = 'src/data/digest';
const FLASHCARDS_PATH = 'src/data/flashcards.toon';

const CARD_PROMPT = `You are a medical educator. Based on the following radiology news digest, create 5 high-yield flashcards for senior residents.

OUTPUT FORMAT: TOON (Token-Oriented Object Notation).
SCHEMA:
cards[5]{id,category,difficulty,front,back,source,tags}:
  card_id,category,difficulty,"Question text","Answer text",source,"tag1;tag2"

Example:
cards[1]{id,category,difficulty,front,back,source,tags}:
  card_new_001,neuro,hard,"What is the sign of X?","The answer is Y",RSNA 2025,neuro;sign
`;

async function generateCards() {
    const date = new Date().toISOString().split('T')[0];
    const digestPath = path.join(DIGEST_DIR, `${date}.toon`);

    if (!fs.existsSync(digestPath)) {
        console.error(`No digest found for today (${date}). Run llm-curator.js first.`);
        process.exit(1);
    }

    const digestContent = fs.readFileSync(digestPath, 'utf8');
    console.log('Generating flashcards from today\'s digest...');

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'meta-llama/llama-3.1-405b-instruct:free',
            messages: [{
                role: 'user',
                content: `${CARD_PROMPT}\n\nDIGEST CONTENT:\n${digestContent}`
            }],
            max_tokens: 2000
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const newCardsTOON = response.data.choices[0].message.content;

        // Clean up response
        let cleanTOON = newCardsTOON;
        if (newCardsTOON.includes('```')) {
            cleanTOON = newCardsTOON.split('```')[1].split('```')[0].replace('toon', '').trim();
        }

        // Append to existing flashcards or create new
        if (fs.existsSync(FLASHCARDS_PATH)) {
            fs.appendFileSync(FLASHCARDS_PATH, `\n\n# Added on ${date}\n${cleanTOON}`);
        } else {
            fs.writeFileSync(FLASHCARDS_PATH, `metadata:\n  version: 1.0.0\n  last_updated: ${date}\n\n${cleanTOON}`);
        }

        console.log(`Flashcards generated and appended to ${FLASHCARDS_PATH}`);

    } catch (error) {
        console.error('LLM Error:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

generateCards();
