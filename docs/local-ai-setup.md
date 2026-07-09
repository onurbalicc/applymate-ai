# Local AI Integration Setup

To enable real-time AI matching analysis on `/analyze`, you need to configure your local development environment variables.

## Step 1: Create `.env.local`
In the root directory of the `applymate-ai` project, create a new file named `.env.local`:

```bash
touch .env.local
```

## Step 2: Add Gemini API Key
Add your Google Gemini API key to the newly created file:

```env
GEMINI_API_KEY=your_real_api_key_here
```

> **Warning:** Never commit `.env.local` to git. The project's `.gitignore` is already configured to ignore `.env*` files to protect credentials.

## Step 3: Restart Dev Server
If the Next.js development server is currently running, stop it (Ctrl+C) and restart it to load the new environment variables:

```bash
npm run dev
```

---

## Verifying Integration

1. Open your browser to `/analyze` (e.g., `http://localhost:3000/analyze`).
2. Paste any text for a candidate CV and a Job Description.
3. Click **Analyze job**.
4. Check the badge under **Analysis Results**:
   - **`✓ AI Analysis Active`** indicates the system successfully parsed your `GEMINI_API_KEY` and generated live LLM matching results.
   - **`⚠️ Demo Fallback Mode`** indicates the key is missing, and the app fell back to secure mock demo data.
