# ExamMind

AI Mental Wellness Companion for NEET/JEE/CAT/GATE/UPSC students.

## Quick Start

1. Copy .env.example to .env.local
2. Add ONE API key (GEMINI_API_KEY recommended)
3. npm run dev

## API Keys
Set ONE in .env.local:
- GEMINI_API_KEY (Google Gemini - free tier)
- ANTHROPIC_API_KEY (Claude)
- OPENAI_API_KEY (GPT-4o-mini)

## No-Auth Design (Intentional)
All data stored in localStorage only. Anonymous deviceId generated on first load via crypto.randomUUID(). Nothing sent to server except per-request AI analysis. No accounts, no data retention.

## Safety Layer
Every input checked via crisis-detector.ts before AI. On alert/watch: AI flow interrupted, Tele-MANAS (14416) and KIRAN (1800-599-0019) shown.

## Demo Data
Click Load Demo in header to seed 7 days of sample entries.

## Tests
npm test

## Deploy
vercel deploy - set API key in Vercel env vars.