# RadRes Daily

AI-powered radiology education platform for senior residents (R3→R4).

## Features
- **Smart Spaced Repetition**: Modified SM-2 algorithm optimized for medical boards.
- **Daily AI Digests**: Automated curation of top radiology journals (RSNA, RadioGraphics) via Claude 3.5 Sonnet.
- **Micro-Learning**: 5-minute daily sessions.
- **Zero Cost Architecture**: Hosted on GitHub Pages, Auth by Supabase (free tier), Storage in Firestore/Supabase.

## Security Setup (GitHub Secrets)

To prevent leaking credentials, we use GitHub Secrets for deployment and a local config file for development.

### 1. Local Development
1. Rename `src/api-config.example.js` to `src/api-config.js` (if it doesn't exist).
2. Add your keys to `src/api-config.js`.
3. **Note:** `src/api-config.js` is ignored by git to prevent accidental commits.

### 2. Production (GitHub Pages)
1. Go to your GitHub Repository > **Settings** > **Secrets and variables** > **Actions**.
2. Add the following repository secrets:
    - `SUPABASE_URL`: Your Supabase Project URL
    - `SUPABASE_ANON_KEY`: Your Supabase Anon Key
    - `OPENROUTER_API_KEY`: Your OpenRouter Key (for the daily digest bot)
3. When you push to `main`, the `Deploy` workflow will automatically inject these keys and deploy your site to the `gh-pages` branch.

## Architecture
- **TOON**: Custom data format for compact storage and git-friendliness.
- **Client-Side**: Vanilla JS + CSS (No frameworks).
- **Automation**: GitHub Actions run daily at 6 AM to fetch RSS and generate digests.

## License
MIT
