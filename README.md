# RadRes Daily 🧠

AI-powered radiology education platform for senior residents (R3→R4), now running on **Cloudflare Pages**.

## Why Cloudflare Pages?
We have transitioned from GitHub Pages to Cloudflare Pages for several reasons:
- **Cloudflare Functions**: Native serverless backend without needing a separate server.
- **Cloudflare Access**: Robust, enterprise-grade authentication (SSO) that works "on top" of the site.
- **Improved Performance**: Global edge network for faster loading.

## Architecture
- **Authentication**: Secured by Cloudflare Access. Identity is verified via headers.
- **Backend**: API routes located in `/functions/api/`.
- **Database**: We use Cloudflare KV (Key-Value) for persisting user statistics.
- **AI Engine**: Daily digests and flashcard generation powered by OpenRouter (Llama 3.1 405B).
- **Format**: Data uses **TOON** (Token-Oriented Object Notation) for efficiency.

## Setup & Deployment

### 1. Repository Secrets (GitHub Actions)
For the daily cron job (GitHub Actions) to work, add these in **Settings > Secrets and variables > Actions**:
- `OPENROUTER_API_KEY`: Your key for AI generation.

### 2. Cloudflare Pages Configuration
In your Cloudflare Dashboard:
1. **Environment Variables**: Add `OPENROUTER_API_KEY` under **Settings > Functions**.
2. **KV Namespace**: Create a KV namespace named `RADRES_STATS` and bind it to your project with the variable name `STATS_KV`.
3. **Access**: Enable Cloudflare Access for your domain to protect the platform.

### 3. PIN Fallback (Emergency Access)
If Cloudflare Access is not configured (e.g., during local testing or custom deployment), the site supports a **PIN** login. 
- Default PIN can be configured in `functions/api/identity.js`.

## Features
- **Smart Spaced Repetition**: Modified SM-2 algorithm.
- **Daily AI Digests**: Automated curation of RSNA, RadioGraphics, etc.
- **Dynamic Flashcards**: Generate new cards using AI from news articles.

## License
MIT

