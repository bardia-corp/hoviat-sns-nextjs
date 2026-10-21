# Hoviat / هویت

A Persian, RTL business directory starting in Germany. Business listings and
business contact visibility are separate from personal accounts and privacy.

## Run locally

Start the FastAPI backend on port 18743 with its local development database and
`DISABLE_BACKGROUND_WORKERS=true`. In this directory:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:18745`. Set `SNS_API_BASE` to the API root including
`/api/sns`. The public business root is derived as `/api/services`; override it
with `SERVICES_API_BASE` only when those APIs use different hosts. Keep
`SNS_USE_MOCK=0` for actual account, owner and business bookmark integration.
The older personal-profile mock fixtures do not simulate business writes.

## Current journeys

- `/`: business-first home and recent German listings.
- `/discover`: URL-based text/category/location/relevance filters and pagination.
- `/businesses/[id]`: published business details and visible contact methods.
- `/business-bookmarks`: private saved businesses after login.
- `/my-businesses`: listings assigned to the signed-in owner.
- `/my-businesses/[id]`: business bio/name/location/contact visibility editor.
- `/profile`: personal account/profile privacy, separate from business details.
- `/login`: exchange the one-time code issued by the configured Telegram bot.

Existing personal-profile pages and profile bookmarks remain at `/profiles`
and `/bookmarks`; they are not used as business records.

## API and privacy boundaries

Server-only adapters call the backend; browser requests use same-origin route
handlers/server actions. JWTs stay in an HttpOnly cookie. Authenticated reads
and public profile/business reads use `no-store` so withdrawn fields are not
served from a shared Next cache.

Public business responses do not include personal owner identifiers, private
business contacts or import provenance. Owners can see their hidden contacts
for editing. Staff control ownership assignment, publication, categories and
relevance. Owner saves use `expected_updated_at`; a 409 asks the owner to reload.
New contact rows start hidden until the owner chooses to show them.

Business bookmark endpoints require backend migration 17. See the backend
`docs/sns-business-api.md` and `docs/sns-product.md` for the agreed contracts.
Posts and broader social features are outside the current functionality.

## Validation

```sh
npm run typecheck
npm run build
```

Next.js and React are pinned to patched releases. The compatible PostCSS patch
override addresses dependency advisories without a framework major upgrade.
No backend secret belongs in a `NEXT_PUBLIC_*` variable.
