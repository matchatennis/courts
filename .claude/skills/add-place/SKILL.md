---
name: add-place
description: Add a tennis facility (place) to the courts index - discover provider params, write the place JSON under providers/, and run the build to validate and regenerate items.json / INDEX.md. Use when onboarding a new organization on any platform (courtreserve, activenet, rec, clubautomation, dudesolutions, …) or a new facility under an existing one. If the facility's booking platform has no platforms/*.md doc yet, this skill onboards the platform first (Step 1).
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

## Step 0 - gather inputs

Ask the user for, or confirm:

- **Platform** and **organization** (existing provider file or new?).
- **Facility name** as it should display.

Get the Apple Place ID, coordinate, and timezone with the bundled script -
never hand-pick coordinates:

```bash
bun "$CLAUDE_SKILL_DIR/find-apple-places.ts" "Woodinville Sports Club Woodinville WA"
```

Mint the `placeId`: `hashid(applePlaceId)` = first 10 hex of SHA-256.

```bash
node -e 'console.log(require("crypto").createHash("sha256").update("I7944210006A10082").digest("hex").slice(0,10))'
```

## Step 1 - `platforms/<platform>.md`

Each platform's reservation websites, public endpoints (curl), and MRN formats
are documented in its `platforms/<platform>.md`. List what's available:

```bash
ls platforms/
```

If `platforms/<platform>.md` **already exists**, skip to Step 2.

If it does **not** exist, onboard the platform now (a platform usually has many
tenants; the tenant/organization id is embedded in the URL as a subdomain or
path segment):

1. Probe the portal with `curl` or chrome. Some providers require auth for
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

Then continue to Step 2.

## Step 2 - discover provider params

Skip this if the organization already has a `providers/<platform>-<org>/`
directory.

Open `platforms/<platform>.md` and follow its discovery steps to extract this
facility's court labels/ids, operating hours, and tags, plus the booking-config
params that go in `config.json` (Step 3) - portal URLs, slot durations,
reservation window, and any platform-specific scheduler params (e.g.
courtreserve `CostTypeId` / `CustomSchedulerId`).

## Step 3 - `places.json`

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
        "slots": [], // leave it empty
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
runtime, not stored here.

## Step 4 - `config.json`

The provider directory's `config.json` is one object describing how to book on
the platform, filled from the params discovered in Step 2. Skip if it already
exists. Shared fields:

| Field | Description |
|---|---|
| `id` | provider id `<platform>:<organization>` |
| `platform` | the platform string |
| `name` | provider display name |
| `location` | `{ "city", "state" }` |
| `urls` | `{ "signin", "signup", "cancellation" }` portal URLs |
| `minDuration` / `maxDuration` | booking-length bounds, `"HH:MM"` |
| `fixedDuration` | optional `true` when the platform allows only one slot length |
| `reservationWindow` | `{ "minHours", "maxHours" }` - how far ahead booking opens |

CourtReserve adds `scheduleType` (`"consolidated"` | `"expanded"`) and a
`schedulers` map keyed by `CustomSchedulerId`:

- consolidated → `{ "costTypeId", "reservationMinInterval" }`
- expanded → also `{ "selectedCourtIds", "courtLabels": [...], "slotInterval", "schedule": { "start", "end" } }`

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
  "minDuration": "00:30",
  "maxDuration": "01:30",
  "reservationWindow": { "minHours": 0, "maxHours": 168 }
}
```

Some providers are not bookable (read-only calendars, walk-in only) and have no
`config.json` - only `places.json`. Add it only when the platform actually
supports booking.

## Step 5 - build and verify

```bash
bun run build
```

This validates every place (required fields, no duplicate `placeId`) and
regenerates `items.json` + `INDEX.md`. A failed validation prints
`<file> places[i]: <reason>` - fix the place object and rerun.

Review the diff (`items.json`, `INDEX.md`, the provider's `places.json` /
`config.json`, and any new `platforms/<platform>.md`), then commit / open a PR.

## Checklist

- [ ] `applePlaceId` / coordinate / timezone from `find-apple-places.ts`
- [ ] `placeId` = `hashid(applePlaceId)`
- [ ] `platforms/<platform>.md` exists (onboarded the platform if it was new)
- [ ] `providers/<platform>-<organization>/places.json` exists (created for a new org)
- [ ] `providers/<platform>-<organization>/config.json` exists for a bookable platform (created for a new org)
- [ ] place object appended to the `places.json` array with correct place + resource mrns
- [ ] `bun run build` green; `items.json` + `INDEX.md` regenerated
- [ ] diff reviewed and committed
