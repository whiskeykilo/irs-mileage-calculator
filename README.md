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

This app uses [OpenNext for Cloudflare](https://opennext.js.org/cloudflare) and deploys as a **Cloudflare Worker** (static assets + serverless functions), not a static export. `pnpm build` runs the stock Next.js build; **`pnpm build:cf`** is the full OpenNext build used in CI and before deploy.

**Cloudflare (recommended for this repo):**

1. Install the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (already a dev dependency).
2. `npx wrangler login` (or set `CLOUDFLARE_API_TOKEN` for CI).
3. Set the same environment variables as in [`.env.example`](.env.example) in the [Cloudflare dashboard](https://developers.cloudflare.com/workers/configuration/environment-variables/) (or with `wrangler secret put` for sensitive values).
4. `pnpm run deploy` (runs `opennextjs-cloudflare build` then `opennextjs-cloudflare deploy`).

To connect this repository in the Cloudflare dashboard, use a **Workers** (or **Workers + Pages**–style) Git project and the build command `pnpm install && pnpm run build:cf` with Wrangler-based deploy, or use your own pipeline that runs `pnpm run deploy`. See the [OpenNext Cloudflare get-started guide](https://opennext.js.org/cloudflare/get-started) for details.

**Other hosts:** Any platform that can run a standard Next.js production build (`next build` + `next start`) with a Node server can still host the app; configure the same env vars. This repo is no longer tuned for Vercel-specific headers, but it remains portable.

## Behavior

- **Cache:** Routes cached in memory by hashed addresses; TTL and max size in env. Cache misses call Google; hits do not. Resets on cold start.
- **Rate limit:** Per-IP sliding window (req/min, req/hour) plus a global daily cap on *actual* API calls. Over limit → 429 or 503. Both in-memory (cold start resets). For alerts at 50%/80%/100% of daily cap, set `dailyApiCounter.onAlert` in `src/lib/rate-limit.ts`.
- **Provider swap:** Implement `RoutingProvider` in `src/lib/routing/` and switch the factory in `index.ts`.

## Stack

Next.js 16 (App Router), React 19, Tailwind v4, TypeScript. Google Maps (Places + Directions). No DB, no state lib, no UI kit.

## License

[MIT](LICENSE)
