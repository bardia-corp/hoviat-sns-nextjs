# Hoviat / هویت

A people-discovery network. Persian, right-to-left, mobile-first, and now
wired to the real SNS API.

## Running it

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without a reachable backend, set `SNS_USE_MOCK=1` in `.env.local` and the whole
UI runs on local fake data - 100 profiles, the same search semantics, the same
failure modes. `.env.local` ships with the mock on.

> This project has never been executed. There is no network access in the
> environment it was written in, so there has been no `npm install`, no
> `next dev` and no type-check. Expect the first run to surface small
> mismatches; nothing here has been verified against a running server.

## Environment

| Variable | Purpose |
| --- | --- |
| `SNS_API_BASE` | API root including `/api/sns` |
| `SNS_INTERNAL_KEY` | Sent as `X-Internal-Key` to skip the per-IP rate limiter. Omitted when unset |
| `SNS_SEARCH_TTL` | Cache seconds for public search results (default 60) |
| `SNS_TIMEOUT_MS` | Per-request timeout (default 10000) |
| `SNS_USE_MOCK` | `1` runs entirely on fake data |
| `NEXT_PUBLIC_BOT_USERNAME` | Telegram bot issuing login codes (`hoviatloginbot`) |

## Shape of the thing

```
app/
  page.tsx                 dashboard
  discover/                search - the SEO-critical route
  browse/[slug]/           pre-filtered landing pages for common searches
  profiles/[id]/           public profile, crawlable
  bookmarks/  profile/  login/
  api/session|bookmarks|account/   same-origin proxies
  actions/                 server actions for every write
lib/api/                   the only code that talks to the backend
lib/                       vocab, social platforms, search URL state, dates
components/
```

### Nothing in the browser talks to the API

Every request goes through our own origin. Server components call `lib/api/*`
directly; client components call `/api/*` route handlers. That hides the JWT
from JavaScript entirely, makes CORS and the backend's TLS certificate
irrelevant to the browser, and lets the backend lock `allow_origins` down later
without touching this app.

### Sessions

Login is a one-time code from the Telegram bot, not an OAuth widget. The user
gets a 32-character code from the bot, pastes it into `/login`, and
`POST /api/session` exchanges it for a JWT which is stored in an httpOnly
cookie (`hoviat_token`, `SameSite=Lax`, `Secure` in production, 7 days - the
lifetime of the token, since there is no refresh endpoint).

A second, deliberately secret-free cookie, `hoviat_session=1`, is readable by
JavaScript so client components can tell whether to render a bookmark button or
a sign-in prompt. It is a hint about the interface, never a permission: every
actual authorisation happens server-side with the real token.

The root layout never reads cookies. Doing so would opt every route out of
static rendering, including the landing pages that exist to be crawled.

### Search

Search is the only thing that works signed out, and the only thing indexed.
`/discover` holds all its state in the URL, so every result set is linkable and
renders on the server. `/browse/[slug]` gives the common queries - doctors in
Germany, engineers in Iran - a static, pre-filtered page each.

The `q` parameter is multi-word AND, up to five words, each matched across
username, nickname, names, bio, occupation and country. Past five words the
backend silently ignores the rest, so the UI says so rather than returning
quietly wrong results.

Results are cached for `SNS_SEARCH_TTL` seconds. This is not only for speed:
the backend's 60-per-minute limit keys on client IP, and all server-side
requests share one address.

### Country is compared byte for byte

`country` is an exact match against a free-text column, and the live data holds
آلمان, المان, Deutschland, Germany, Alman, germany, Germani and 🇩🇪 as
separate countries, plus cities such as هامبورگ and Berlin filed as countries.
No client can fix this: the filter is AND-ed server-side, so one spelling is
one query.

So `lib/vocab.ts` offers one canonical Persian value per country and nothing
else. The pickers are searchable typeaheads that also accept free text - the
column has no enum, and refusing a value the API accepts would be a lie - but
the suggestions are single-spelling on purpose. Latin and variant spellings are
matched while typing so that searching "Germany" still finds آلمان.

Until the backend normalises the column, a profile stored as `Deutschland` is
unreachable through the country filter. That is a data problem, and it is the
backend's to solve.

### Privacy is not cosmetic

`null` from the API means "hidden", not "empty" - the two are indistinguishable
over the wire. And a private field stops matching in search, so hiding your
occupation removes you from every occupation filter. Each toggle on the profile
page states that consequence instead of just naming the field.

`is_profile_discoverable=false` makes your profile answer 404 to everyone,
which is why `/profiles/[id]` and the 404 page use the same wording for a
missing profile and a hidden one.

### Writes

One server action per endpoint. `PATCH /account/profile` takes only the six
editable fields and rejects anything else with a 400, so the patch is built
explicitly rather than spread from state; an empty box becomes an explicit
`null`, which is how a field gets cleared. Social links are replace-all, so the
editor always submits every row it holds. Bookmarks are optimistic with
rollback.

## Design notes

Glass, a soft blue wash, a faint grid and a glitter layer, with the blue
controls treated as lit three-dimensional orbs. Every colour is a variable in
the `THEME` block at the top of `app/globals.css` - `--accent`, `--orb-*`,
`--bg-page`, `--wash-*`, `--grid-alpha`, `--glass-*` - and the whole palette can
be changed from there.

Three near-black inks and no grey text. Blurred layers are never animated.
Vazirmatn throughout, with numerals rendered as Persian digits and dates
converted to the Jalali calendar arithmetically.

Navigation shows a progress bar immediately, because server rendering means a
real wait before the next screen paints and a frozen screen reads as a bug.

## Known gaps

- Never executed. No install, no type-check, no run.
- Desktop layout is still mobile-width centred; no wide breakpoint yet.
- Country coverage depends on backend normalisation.
- `X-Internal-Key` is sent but the backend bypass does not exist yet.
- No avatar cropping; the file goes up as chosen, under a 5MB local check.
