---
name: add-place
description: Scout for tennis facilities or add a known facility to the courts index. Use when searching an area with Google Maps, researching public facility and booking websites, onboarding an organization or platform, or adding one or more places under an existing provider. Discover provider parameters, write provider JSON, and rebuild items.json and INDEX.md.
---

# Data Model

`Platform`: a short string derived from the booking domain

`Organization`: the tenant identifier the platform uses (subdomain or path segment), e.g. the org slug for activenet/rec/clubautomation, the numeric `orgId` for courtreserve

`Provider`: a court provider that owns at least one `Place`, represented by a `platform:organization` pair

`Place`: represents a physical location that maps 1-to-1 with an Apple Place ID and has at least one court

`Resource`: a court, owned by a place

An `mrn` fully addresses a resource by walking the ownership chain:

```
rec:sfrecpark:location/12/court/3
└┬┘ └───┬───┘ └──┬───┘ └──┬──┘
 │      │        │        └ Resource segment: <resourceLabel>/<resourceId>
 │      │        └ Place segment: <placeLabel>/<placeId>
 │      └ organization
 └ platform
```

Place segment `<placeLabel>/<placeId>` and Resource segment `<resourceLabel>/<resourceId>` are labels in platform's native term for each entity (rec calls a place a `location` and a court a `court`; courtreserve calls them `scheduler` and `courtlabel`; activenet `center` and `resource`). Pick the term the platform's own API/URLs use, and make sure the thing you map to `Place` is genuinely 1-to-1 with a physical location and the thing you map to `Resource` is genuinely a single court.

## Step 0 - choose the workflow

For a known facility, confirm its display name and any known platform or
organization. For scouting, confirm the search area or radius and any access
requirements. The platform may be unknown at this point.

Review `INDEX.md` and `providers/*/places.json` before browsing so existing
coverage and likely duplicates are clear.

## Step 1 - scout and verify facilities

Use an interactive browser to search Google Maps for `tennis courts`, `public
tennis courts`, `tennis club`, and `park tennis courts` across the target area.
Pan through the full area instead of relying only on the initial ranked results.

Treat Maps as candidate discovery, not as the source of truth. Open each likely
listing, capture its name, address, and linked website, and remove duplicates,
closed facilities, residences, and pickleball-only venues. Check each candidate
against `INDEX.md` and provider JSON by name and location.

Follow the listing to the facility operator, parks department, school district,
club, and reservation portal. Browse or fetch the relevant public pages and
documents to collect:

- operator and facility identity, address, and official URL
- court count, indoor/outdoor status, lighting, and public access
- walk-in, reservation, membership, and operating rules
- booking platform, organization, place/resource ids, and portal URLs
- availability window, advance rules, durations, and cancellation policy

Prefer operator pages, official facility inventories, court diagrams, and the
booking portal. Use directories, Maps attributes, reviews, and photos only as
leads. Never invent a court count, tag, policy, or platform parameter; leave a
candidate out when required facts cannot be verified. Do not create an account
or access authenticated pages. Keep evidence URLs in the work summary and in a
new platform document when they explain reusable discovery steps.

Group accepted candidates by `platform:organization`, then continue once per
platform and provider before adding each place.

Get every accepted facility's Apple Place ID, coordinate, and timezone with the
bundled script; never copy coordinates from Google Maps or hand-pick them:

```bash
bun .agents/skills/add-place/find-apple-places.ts "Woodinville Sports Club Woodinville WA"
```

Mint the `placeId`: `hashid(applePlaceId)` = first 10 hex of SHA-256.

```bash
node -e 'console.log(require("crypto").createHash("sha256").update("I7944210006A10082").digest("hex").slice(0,10))'
```

## Step 2 - `platforms/<platform>.md`

Each platform's reservation websites, public endpoints (curl), and MRN formats
are documented in its `platforms/<platform>.md`. List what's available:

```bash
ls platforms/
```

If `platforms/<platform>.md` **already exists**, skip to Step 3.

If it does **not** exist, onboard the platform now (a platform usually has many
tenants; the tenant/organization id is embedded in the URL as a subdomain or
path segment):

1. Probe the portal with `curl` or an interactive browser. Some providers require auth for
   court availability, some don't - find out which.
2. Write `platforms/<platform>.md` following the template below.

When filling in `## MRN`, use the platform's **native terms** as the place and
resource segment labels, and confirm the entity you label as the place is
1-to-1 with a physical location and the one you label as the resource is a
single court - if the platform's hierarchy doesn't line up that way, work out
the right mapping before writing the doc.

````markdown
# <Platform Name>

<1-3 sentences: what this platform is, who uses it, and whether court
availability is public or login-gated.>

- Website: <marketing/home URL>
- Portal: `<reservation URL with the <org> placeholder>`
- Provider id: `<platform>:<org>` - <how the org slug/id is derived from the URL>.

## Discover params

<How to find a provider's places and resources. Prefer auth-free public
endpoints; show the actual curl commands and say what to extract (place ids,
court labels/ids, operating hours, slot interval, tags). If there is no public
availability API, say so and describe the fallback source - never instruct
creating or using an account.>

```bash
curl -s '<list places / resources for a provider>'
curl -s '<resource availability for a day>'
```

## MRN

| | Format |
|---|---|
| Place `mrn` | `<platform>:<org>:<placeLabel>/<placeId>` |
| Resource `mrn` | `…/<resourceLabel>/<resourceId>` |

<Optional: notes on any synthetic ids, slugging rules, or courts to skip.>
````

Then continue to Step 3.

## Step 3 - discover provider params

Skip this if the organization already has a `providers/<platform>-<org>/`
directory.

Open `platforms/<platform>.md` and follow its discovery steps to extract this
facility's court labels/ids, operating hours, and tags, plus the provider config
that goes in `config.json` (Step 5): portal URLs, calendar behavior, booking
policies, duration constraints, and any platform-specific scheduler parameters.

## Step 4 - `places.json`

Each organization gets a `providers/<platform>-<organization>/` directory. Its
`places.json` is a bare JSON array of place objects - one object per facility.
Start a new org with an empty array (skip if the file already exists):

```json
[]
```

There is no separate `provider` field: the provider id `<platform>:<organization>`
is derived from each place's `mrn` (its first two `:`-segments) at build time.

Append a place object to the array. The `mrn` formats are platform-specific -
use the `## MRN` table in this platform's `platforms/<platform>.md`. For
reference:

| Platform | Place `mrn` | Resource `mrn` |
|---|---|---|
| courtreserve | `courtreserve:<org>:scheduler/<schedulerId>` | `…/courtlabel/<Court Label>` |
| activenet | `activenet:<org>:center/<centerId>` | `…/resource/<resourceId>` |
| rec | `rec:<org>:location/<locationId>` | `…/court/<courtId>` |
| clubautomation | `clubautomation:<org>:location/default` | `…/court/default` |
| dudesolutions | `dudesolutions:<org>:location/<schoolGuid>` | `…/court/<courtGuid>` |

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
    "resources": [
      {
        "name": "<Court name>",
        "slots": [],
        "mrn": "<resource mrn>",
        "tags": ["outdoor"]
      },
      ...
    ]
  }
}
```

Resource `tags` use the values `indoor`, `outdoor`, `lighted`, `reservable`,
`walk-in`. `slots` is always `[]` in the index - availability is filled at
runtime, not stored here. Never add `reserveBy` either - the daemon stamps it
per resource from platform signals (e.g. ActiveNet `reservation_unit`) at poll
time.

## Step 5 - `config.json`

The provider directory's `config.json` describes its public identity, calendar,
and booking behavior. Skip this step when the organization already has one.
Shared fields:

| Field | Description |
|---|---|
| `id` | provider id `<platform>:<organization>` |
| `platform` | the platform string |
| `name` | provider display name |
| `location` | `{ "city", "state" }` |
| `urls` | `{ "signin", "signup", "cancellation" }` portal URLs |
| `calendar` | availability source, polling limits, and optional scheduler configuration |
| `bookingPolicies` | provider-wide default plus optional place/resource-specific overrides |

Calendar types are:

- `unsupported`
- `matcha-device` with `requiresAuthentication`, `availabilityWindow`, and `requestsPerMinute`
- `matcha-server` with `notifications`, `availabilityWindow`, and `requestsPerMinute`

CourtReserve calendars may include `scheduler`, whose type is `consolidated` or
`expanded`, with `configs` keyed by `CustomSchedulerId`:

- consolidated → `{ "costTypeId", "reservationMinInterval" }`
- expanded → also `{ "selectedCourtIds", "courtLabels": [...], "slotInterval", "schedule": { "start", "end" } }`

Every configured provider has exactly one provider-wide booking policy without
`places` or `resources`. Add targeted overrides with one of those arrays. Every
policy requires a unique `id`, a `minAdvance` value (`"next-day"` or `"HH:MM"`),
and a type:

- `matcha-device`: `reserveBy` is `range` or `block`; ranges define `minDuration` and `maxDuration`
- `provider`: adds the external `url` and the same reservation shape
- `phone`: adds `number`
- `unsupported`

```json
{
  "id": "<platform>:<organization>",
  "platform": "<platform>",
  "name": "<Provider display name>",
  "location": { "city": "<City>", "state": "<ST>" },
  "urls": {
    "signin": "<portal signin URL>",
    "signup": "<portal signup URL>",
    "cancellation": "<where members cancel>"
  },
  "calendar": {
    "type": "matcha-server",
    "notifications": true,
    "availabilityWindow": { "minHours": 0, "maxHours": 168 },
    "requestsPerMinute": 30
  },
  "bookingPolicies": [
    {
      "id": "<provider-wide policy id>",
      "minAdvance": "00:00",
      "type": "matcha-device",
      "reserveBy": "range",
      "minDuration": "00:30",
      "maxDuration": "01:30"
    }
  ]
}
```

Providers that are not configured Matcha booking providers may have only
`places.json`. Add `config.json` only when their calendar and booking behavior
are known.

## Step 6 - build and verify

```bash
bun run build
```

This validates every place (required fields, no duplicate `placeId`) and
regenerates `items.json` + `INDEX.md`. A failed validation prints
`<file> places[i]: <reason>` - fix the place object and rerun.

Review the diff (`items.json`, `INDEX.md`, the provider's `places.json` /
`config.json`, and any new `platforms/<platform>.md`), then commit / open a PR.

## Checklist

- [ ] candidate is not already in `INDEX.md` or provider JSON
- [ ] court count, tags, access, and booking facts verified from public sources
- [ ] evidence URLs recorded in the work summary or reusable platform doc
- [ ] `applePlaceId` / coordinate / timezone from `find-apple-places.ts`
- [ ] `placeId` = `hashid(applePlaceId)`
- [ ] `platforms/<platform>.md` exists (onboarded the platform if it was new)
- [ ] `providers/<platform>-<organization>/places.json` exists (created for a new org)
- [ ] `providers/<platform>-<organization>/config.json` exists for a bookable platform (created for a new org)
- [ ] provider id belongs to the correct region in `src/regions.ts`
- [ ] place object appended to the `places.json` array with correct place + resource mrns
- [ ] `bun run build` green; `items.json` + `INDEX.md` regenerated
- [ ] diff reviewed and committed
