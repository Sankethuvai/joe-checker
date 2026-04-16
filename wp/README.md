# Vercel Deployment

This project is now configured for Vercel with a static frontend and a serverless backend API.

## Files
- `index.html` — static frontend
- `api/api.js` — Vercel serverless function replacing `api.php`
- `package.json` — Node dependency manifest
- `vercel.json` — Vercel route for `/api`

## Run locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start local Vercel development:
   ```bash
   npx vercel dev
   ```

## Deploy to Vercel
1. Sign in to Vercel and connect the repository or run:
   ```bash
   npx vercel
   ```
2. Follow the prompts to deploy.

## Notes
- Vercel does not support PHP directly, so the backend was converted to Node.
- The frontend now sends requests to `/api`.
- Keep your API and proxy settings private.
