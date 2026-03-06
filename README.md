# IRS Mileage Calculator

Web app that calculates driving distance and IRS mileage reimbursement between two addresses.

**Live:** [irsmileagecalculator.com](https://irsmileagecalculator.com)

## Quick Start

```bash
git clone https://github.com/whiskeykilo/irs-mileage-calculator.git
cd irs-mileage-calculator
pnpm install
cp .env.example .env.local
# Add your two Google API keys to .env.local (see below)
pnpm dev
```

Runs at `http://localhost:3000`.

## Google API Keys

You need **two** keys from [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

| Key                  | Env var                             | APIs to enable                                        | Restriction                                                |
|----------------------|-------------------------------------|-------------------------------------------------------|------------------------------------------------------------|
| **Client** (browser) | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`   | Maps JavaScript API, Places API (New), Routes API       | HTTP referrers (e.g. `localhost:3000/*`, your domain)      |
| **Server** (secret)  | `GOOGLE_MAPS_API_KEY`               | Directions API only                                   | IP or none for dev. Never expose.                          |

Client key is used for address autocomplete; server key for distance calculations only. See `.env.example` for all variables (rate limits, cache TTL, daily API cap, etc.).

## Updating IRS Rates

Edit `src/lib/irs-rates.ts` and add to the `IRS_RATES` array:

```ts
{ year: 2027, rate: 0.74, label: "74¢" },
```

The rest of the app reads from this file.

## Deploy

Standard Next.js 15 app. Works on Vercel, Netlify, Railway, Docker, etc. Set env vars in your platform; the only requirement is a Node runtime for the `/api/calculate` route.

**Vercel:** Import repo at [vercel.com/new](https://vercel.com/new), add env vars, deploy. Or `npx vercel`.

## Behavior

- **Cache:** Routes cached in memory by hashed addresses; TTL and max size in env. Cache misses call Google; hits do not. Resets on cold start.
- **Rate limit:** Per-IP sliding window (req/min, req/hour) plus a global daily cap on *actual* API calls. Over limit → 429 or 503. Both in-memory (cold start resets). For alerts at 50%/80%/100% of daily cap, set `dailyApiCounter.onAlert` in `src/lib/rate-limit.ts`.
- **Provider swap:** Implement `RoutingProvider` in `src/lib/routing/` and switch the factory in `index.ts`.

## Stack

Next.js 15 (App Router), React 19, Tailwind v4, TypeScript. Google Maps (Places + Directions). No DB, no state lib, no UI kit.

## License

[MIT](LICENSE)
