---
name: add-place
description: Add a tennis facility (place) to the courts index — discover provider params, write the place JSON under places/, and run the build to validate and regenerate items.json / INDEX.md. Use when onboarding a new courtreserve/activenet/rec/clubautomation organization or a new facility under an existing one.
---

# Add a place

`courts` is the open index of tennis courts. A "place" is one facility. Every
place belongs to a **provider** — a `platform:organization` pair — and every
provider is one JSON file under `places/`.

Adding a place means, in the worst case:

1. discover the provider's API parameters,
2. create the provider file (once per organization),
3. append the place object to that file,
4. run `bun run build` to validate and regenerate the index.

If the provider file already exists (e.g. another Seattle Parks court), skip
steps 1–2 — you only do step 3.

Platforms: `courtreserve`, `activenet`, `rec`, `clubautomation`.

`docs/EXPANSION.md` is a standing survey of which West Coast cities run on
which platform — consult it when picking *what* to onboard next.

## Architecture (where things live)

| Thing | File | Scope |
|---|---|---|
| Provider file (`{provider, places[]}`) | `places/<platform>-<organization>.json` | one per organization |
| Composed item list | `items.json` | **generated** — never hand-edit |
| Human-readable index | `INDEX.md` | **generated** — never hand-edit |
| Validator + composer | `scripts/build-items.ts` | run via `bun run build` |

`places/` is the single source of truth. `bun run build` reads every
`places/*.json`, validates each place, and rewrites `items.json` + `INDEX.md`.
A place is live in the index only after the build runs and the change is
committed.

## Step 0 — gather inputs

Ask the user for, or confirm:

- **Platform** and **organization** (existing provider file or new?).
- **Facility name** as it should display.

Get the Apple Place ID, coordinate, and timezone with the bundled script —
never hand-pick coordinates:

```bash
bun "$CLAUDE_SKILL_DIR/find-apple-places.ts" "Woodinville Sports Club Woodinville WA"
```

`find-apple-places.ts` sits next to this SKILL.md; it runs under `bun`
(no Apple creds, no extra deps). It prints `applePlaceId`, `lat,lng`, and
timezone for each candidate (`--limit N` for more). Pick the right one with
the user.

Mint the `placeId`: `hashid(applePlaceId)` = first 10 hex of SHA-256.

```bash
node -e 'console.log(require("crypto").createHash("sha256").update("I7944210006A10082").digest("hex").slice(0,10))'
```

## Step 1 — discover provider params

Skip this if the organization already has a `places/*.json` file.

### courtreserve

Open the org's CourtReserve scheduler in a browser, intercept the availability
XHR, and read the `jsonData` query param. Extract: `orgId`, `CostTypeId`,
`CustomSchedulerId` (one per location/scheduler), `SelectedCourtIds`,
`ReservationMinInterval`.

Two public, auth-free endpoints — test both, use whichever the org serves:

```bash
# Consolidated — availability by court type (scheduleType: "consolidated")
curl -s "https://app.courtreserve.com/Online/Reservations/ReadConsolidated/<orgId>" \
  -X POST -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' \
  --data-urlencode "sort=" --data-urlencode "group=" --data-urlencode "filter=" \
  --data-urlencode 'jsonData={"startDate":"...","orgId":"<orgId>","TimeZone":"America/Los_Angeles","KendoDate":{"Year":2026,"Month":3,"Day":1},"UiCulture":"en-US","CostTypeId":"<costTypeId>","CustomSchedulerId":"<schedulerId>","ReservationMinInterval":"60"}'

# Expanded — bookings by court label (scheduleType: "expanded")
curl -s "https://memberschedulers.courtreserve.com/SchedulerApi/ReadExpandedApi?id=<orgId>&uiCulture=en-US&jsonData=<urlEncodedJsonData>"
```

From the responses get: court labels (`CourtLabel`), operating hours (earliest/
latest slot, converted to local time), slot interval (usually 1800s). Skip
permanently-closed courts (`IsCourtClosed: true`) and `WAITLIST<id>` court types.

### activenet

Org slug is the URL path segment (e.g. `seattle`). Public endpoints, no auth —
require header `page_info: {"page_number":1,"total_records_per_page":20}`:

```bash
# Per-resource detail (amenities, reservability)
curl -s 'https://anc.apm.activecommunities.com/<org>/rest/reservation/resource/detail/<resourceId>?locale=en-US' \
  -H 'page_info: {"page_number":1,"total_records_per_page":20}' -H 'X-Requested-With: XMLHttpRequest'

# Daily availability
curl -s 'https://anc.apm.activecommunities.com/<org>/rest/reservation/resource/availability/daily/<resourceId>?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&locale=en-US'
```

Each tennis court is a `resource` under a `center`. Get the `center` id and the
`resource` ids from the org's reservation site. The detail endpoint returns an
empty body without the `page_info` header.

Derive resource tags by hand from the detail response:

| Source field | Tag |
|---|---|
| `amenities[]` contains `"Lighted Court/Field"` | `lighted` |
| `general_information.no_internet_permits === false` | `reservable` |

`no_internet_permits: true` means the court can't be booked online (walk-up /
phone only) — still listable, but omit the `reservable` tag.

### rec

Org slug is the `rec.us/organizations/<slug>` path. Public API:

```bash
# Location detail — courts live here
curl -s 'https://api.rec.us/v1/locations/<locationId>?publishedSites=true'

# Schedule for a day
curl -s 'https://api.rec.us/v1/locations/<locationId>/schedule?startDate=YYYY-MM-DD'
```

Get the `locationId` (UUID) and each court's UUID + name from the location
detail response.

### clubautomation

ClubAutomation has no public availability API — model it with a single
synthetic `court/default` resource. Use an existing `clubautomation-*.json` as
the template; the org slug is a short human key (e.g. `tcsp`).

## Step 2 — create the provider file (once per organization)

Skip if `places/<platform>-<organization>.json` already exists.

Create it with the provider id and an empty places array:

```json
{
  "provider": "<platform>:<organization>",
  "places": []
}
```

The `provider` string is `<platform>:<organization>` — the org slug for
activenet/rec/clubautomation, the numeric `orgId` for courtreserve.

## Step 3 — add the place

Append a place object to the provider file's `places[]` array. One object per
facility. The `mrn` formats are platform-specific:

| Platform | Place `mrn` | Resource `mrn` |
|---|---|---|
| courtreserve | `courtreserve:<org>:scheduler/<schedulerId>` | `…/courtlabel/<Court Label>` |
| activenet | `activenet:<org>:center/<centerId>` | `…/resource/<resourceId>` |
| rec | `rec:<org>:location/<locationId>` | `…/court/<courtId>` |
| clubautomation | `clubautomation:<org>:court` | `…/court/default` |

Place object shape:

```json
{
  "PK": "PLACE#<placeId>",
  "SK": "PROFILE",
  "placeId": "<hashid(applePlaceId)>",
  "applePlaceId": "<from find-apple-places>",
  "displayName": "<Facility Name>",
  "coordinate": { "lat": 0, "lng": 0 },
  "timezone": "America/Los_Angeles",
  "tags": ["indoor"],
  "mrn": "<place mrn>",
  "provider": {
    "platform": "<platform>",
    "name": "<Provider display name>",
    "city": "<organization>",
    "resources": [
      { "id": "<court id>", "name": "<Court name>", "slots": [],
        "mrn": "<resource mrn>", "tags": ["outdoor"] }
    ]
  }
}
```

Resource `tags` use the values `indoor`, `outdoor`, `lighted`, `reservable`,
`walk-in`. `slots` is always `[]` in the index — availability is filled at
runtime, not stored here.

## Step 4 — build and verify

```bash
bun run build
```

This validates every place (required fields, no duplicate `placeId`) and
regenerates `items.json` + `INDEX.md`. A failed validation prints
`<file> places[i]: <reason>` — fix the place object and rerun.

Review the diff (`items.json`, `INDEX.md`, the provider file), then commit /
open a PR.

## Checklist

- [ ] `applePlaceId` / coordinate / timezone from `find-apple-places.ts`
- [ ] `placeId` = `hashid(applePlaceId)`
- [ ] `places/<platform>-<organization>.json` exists (created for a new org)
- [ ] place object appended to `places[]` with correct place + resource mrns
- [ ] `bun run build` green; `items.json` + `INDEX.md` regenerated
- [ ] diff reviewed and committed
