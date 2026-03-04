# IRS Mileage Calculator

A fast, minimal web app that calculates driving distance and IRS mileage reimbursement between any two addresses.

**Live:** [irsmileagecalculator.com](https://irsmileagecalculator.com)

## Features

- Address autocomplete (Google Places)
- Driving distance via Google Directions API (server-side only)
- IRS standard business mileage rates 2020–2026
- Round trip toggle
- Copy-to-clipboard for each result value
- Per-IP rate limiting + daily API cap
- In-memory caching to prevent duplicate paid API calls
- SEO optimized with JSON-LD structured data, sitemap, robots.txt
- Mobile-first responsive design

## Quick Start

```bash
git clone https://github.com/whiskeykilo/irs-mileage-calculator.git
cd irs-mileage-calculator
pnpm install
cp .env.example .env.local
# Fill in your Google Maps API keys (see below)
pnpm dev
```

The app starts at `http://localhost:3000`.

## Google Maps API Keys

You need **two** API keys from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

### 1. Client-side key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)

Used for the Places Autocomplete widget in the browser.

- Enable: **Maps JavaScript API**, **Places API**
- Restrict by: **HTTP referrers** (e.g., `irsmileagecalculator.com/*`, `localhost:3000/*`)
- This key is visible in the browser (standard for Google Maps JS API)

### 2. Server-side key (`GOOGLE_MAPS_API_KEY`)

Used for Directions API calls on the server. Never sent to the browser.

- Enable: **Directions API**
- Restrict by: **IP addresses** (your server IPs, or leave unrestricted for local dev)
- Keep this secret

## Environment Variables

See [`.env.example`](.env.example) for all variables with descriptions.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes | — | Client-side Maps API key (autocomplete) |
| `GOOGLE_MAPS_API_KEY` | Yes | — | Server-side Maps API key (directions) |
| `RATE_LIMIT_MAX_PER_MINUTE` | No | `20` | Max requests per IP per minute |
| `RATE_LIMIT_MAX_PER_HOUR` | No | `100` | Max requests per IP per hour |
| `DAILY_API_CAP` | No | `1000` | Global daily cap on upstream API calls |
| `CACHE_TTL_SECONDS` | No | `604800` | Cache TTL (default 7 days) |
| `NEXT_PUBLIC_SITE_URL` | No | `https://irsmileagecalculator.com` | Base URL for sitemap/canonical |

## How to Update IRS Rates

Edit `src/lib/irs-rates.ts`. Add a new entry to the `IRS_RATES` array:

```typescript
{ year: 2027, rate: 0.74, label: "74¢" },
```

That's it. The year selector, rates page, and calculator all read from this single array.

## How Caching Works

- Route distances are cached in server memory using a SHA-256 hash of the normalized addresses
- Cache entries expire after `CACHE_TTL_SECONDS` (default 7 days)
- Max 10,000 entries with LRU eviction
- Cache resets on serverless cold starts (acceptable for MVP, swap to Redis for persistence)
- Cache hits skip the Google Directions API call entirely (no cost)

## How Rate Limiting Works

Two layers protect against cost overruns:

1. **Per-IP sliding window:** Configurable requests per minute and per hour. Returns `429 Too Many Requests` with `Retry-After` header when exceeded.
2. **Daily global API cap:** Counts only actual upstream API calls (not cache hits). When hit, new uncached requests return `503` until midnight UTC.

Both are in-memory (reset on cold start). For multi-instance deployments, swap to Redis-backed rate limiting.

### Usage Alerts

The daily API counter fires alerts at **50%**, **80%**, and **100%** usage thresholds. By default these log to `console.warn`/`console.error`. To hook in your own alerting (Discord, email, etc.), set a custom hook:

```typescript
import { dailyApiCounter } from "@/lib/rate-limit";

dailyApiCounter.onAlert = (alert) => {
  // alert: { level: "warning"|"critical"|"exhausted", used, cap, percentUsed, date }
  fetch("https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `⚠️ API usage ${alert.level}: ${alert.used}/${alert.cap} (${alert.percentUsed}%)`,
    }),
  });
};
```

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in the Vercel dashboard
4. Deploy

Or via CLI:

```bash
npx vercel
```

### Other Platforms

The app is a standard Next.js 15 project. It works on any platform that supports Next.js (Netlify, Railway, Docker, etc.). The only platform-specific thing is the API route (`/api/calculate`) which requires a Node.js runtime.

## Architecture

```
src/
├── app/                    # Next.js App Router pages + API
│   ├── api/calculate/      # POST endpoint (rate limit → cache → Google → calculate)
│   ├── rates/              # IRS rates table page
│   ├── about/              # About page
│   ├── privacy/            # Privacy policy
│   ├── sitemap.ts          # Dynamic sitemap.xml
│   └── robots.ts           # robots.txt
├── components/             # React components
│   ├── calculator.tsx      # Main form (composes all inputs)
│   ├── address-input.tsx   # Google Places Autocomplete input
│   ├── results.tsx         # Results display with copy buttons
│   └── ...
└── lib/                    # Server-side utilities
    ├── irs-rates.ts        # Single source of truth for IRS rates
    ├── cache.ts            # In-memory route cache (SHA-256 keys, TTL, LRU)
    ├── rate-limit.ts       # Per-IP rate limiter + daily API counter
    └── routing/            # Provider interface + Google implementation
        ├── provider.ts     # Abstract interface
        ├── google.ts       # Google Directions API
        └── index.ts        # Factory (swap providers here)
```

## Swapping Routing Providers

The routing layer uses a provider interface. To switch from Google to another provider:

1. Create `src/lib/routing/mapbox.ts` implementing `RoutingProvider`
2. Update `src/lib/routing/index.ts` to return your new provider
3. Update environment variables

## Tech Stack

- **Next.js 15** (App Router, React 19)
- **Tailwind CSS v4**
- **Google Maps Platform** (Places Autocomplete + Directions API)
- **TypeScript 5**

No database. No state management library. No UI component library. Minimal dependencies.

## License

MIT
