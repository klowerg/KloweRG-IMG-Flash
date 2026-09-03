# KloweRG IMG Flash

Modern image generation studio built with Vue 3, Vercel Functions, Supabase and Cavoti.

## Requirements

- Node.js 20+
- A Supabase project for authentication, database and Storage
- A Cavoti API key

## Development

```bash
npm install
npm run dev
```

The Vite app runs on `http://localhost:5173`. In production, Vercel serves the Vue
build and the Node/TypeScript functions in `api/` from the same domain.

## Supabase

Run the SQL in `supabase/migrations/001_initial.sql` in the Supabase SQL editor.
Create two private Storage buckets named `generation-images` and `reference-images`.
Set the matching frontend and backend environment variables from the examples.

Generation requests require a configured `CAVOTI_API_KEY`. Add the variables in
Vercel Project Settings, keeping `SUPABASE_SERVICE_ROLE_KEY` and `CAVOTI_API_KEY`
server-only. The frontend only receives the Supabase URL and anon key.
