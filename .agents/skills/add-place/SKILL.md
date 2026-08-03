---
name: add-place
description: Scout for tennis facilities or add a known facility and its provider configuration to the Courts index. Use when searching an area, researching public facility and booking websites, onboarding an organization or platform, or adding one or more places under an existing provider. Present verified candidates for user approval, build the catalog, publish approved places to sandbox, verify them end-to-end in the iOS app, and ask before releasing to production.
---

# Boundary

Own every Courts catalog change for facilities, provider tenants, and new
platforms: platform documentation and types, provider configuration, places,
resources, MRNs, regions, and generated artifacts. Do not implement application
behavior in `daemon/`, `api/`, `shared/`, or `ios/`. When a new platform needs
availability polling or booking support outside Courts, hand that work to the
root `.agents/skills/add-platform/SKILL.md` workflow.

Always evaluate calendar support while onboarding or extending a provider. Keep the investigation
and Courts configuration here; use `add-platform` only for new WebView or server API behavior required outside Courts.

# Data Model

`Platform`: a short string derived from the booking domain

Use `manual` only when no digital platform is identifiable or the operator books
through walk-in or phone service. Retain any identified platform despite login
gates or missing native ids; authentication affects capability, not identity.

`Organization`: the tenant identifier the platform uses (subdomain or path segment), e.g. the org slug for activenet/rec/clubautomation, the numeric `orgId` for courtreserve

`Provider`: a booking-platform tenant associated with at least one `Place`, represented by a `platform:organization` pair

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

Place segment `<placeLabel>/<placeId>` and Resource segment
`<resourceLabel>/<resourceId>` use the platform's native terms: Rec uses
`location` and `court`, CourtReserve uses `scheduler` and `courtlabel`, and
ActiveNet uses `center` and `resource`. A resource `mrn` must uniquely identify
one court. A place `mrn` may be shared when one platform place segment, such as
a CourtReserve scheduler, spans multiple physical facilities.

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
- WebView and API calendar feasibility, availability window, advance rules,
  durations, and cancellation policy

Prefer operator pages, official facility inventories, court diagrams, and the
booking portal. Use directories, Maps attributes, reviews, and photos only as
leads. Never invent a court count, tag, policy, or platform parameter. Do not
create an account or access authenticated pages. Keep evidence URLs in the work
summary and in a new platform document when they explain reusable discovery
steps.

Treat member-only, guest, seasonal-pass, student, team, and school-community
access as facts to model, not reasons to exclude a facility. Accept a candidate
when its physical identity, Apple mapping, existence of tennis courts, and
exact court count are publicly verified. Preserve unknown nonessential facts as
unknown and use unsupported calendar or booking behavior when no honest live
integration or handoff exists. Exclude a candidate only when its identity,
tennis use, or exact resource count cannot be verified well enough to create
one unique resource per court.

Group accepted candidates by `platform:organization`, then continue once per
platform and provider before adding each place.

Get every accepted facility's Apple Place ID, coordinate, and timezone with the
bundled script; never copy coordinates from Google Maps or hand-pick them:

```bash
bun .agents/skills/add-place/find-apple-places.ts \
  "Woodinville Sports Club Woodinville WA" \
  --near "15327 140th Pl NE, Woodinville, WA 98072"
```

`--near` geocodes the independently verified facility address, biases the place
search toward it, and prints each result's distance from it. The default 2 km
radius tolerates campus-sized facilities and minor geocoding differences while
rejecting results in the wrong area. Override it with `--radius-km N` when the
facility evidence justifies a different tolerance.

Mint the `placeId`: `hashid(applePlaceId)` = first 10 hex of SHA-256.

```bash
node -e 'console.log(require("crypto").createHash("sha256").update("I7944210006A10082").digest("hex").slice(0,10))'
```

## Step 2 - present the review table

After exploration and evidence collection, always present a compact Markdown
table before changing the catalog. Include one row per verified candidate:

| Candidate | Address | Courts | Access and tags | Booking | Calendar support | Provider | Apple mapping | Evidence | Recommendation |
|---|---|---:|---|---|---|---|---|---|---|
| `<name>` | `<address>` | `<verified count>` | `<public/private; indoor/outdoor/lighted>` | `<walk-in/reservable and rules>` | `<WebView/API/unsupported; existing or needs add-platform>` | `<platform:organization; manual only when no platform exists>` | `<Apple Place ID; distance from verified address>` | `<official links>` | `Add` or `Do not add` |

State unresolved nonessential facts directly in the cells; never turn an
unknown into a guess. Recommend verified restricted-access facilities for
addition with their access limitation visible in the table. Do not defer one
solely because booking is login-gated or native court ids are unavailable.
Keep ambiguous, rejected, and already-cataloged facilities in a short separate
table with the reason they will not proceed.

Ask the user which `Add` candidates to approve. Stop before editing provider or
place files until the user approves the rows. Approval covers catalog edits and
sandbox publication only; it never authorizes a production write or push.

## Step 3 - onboard the platform in Courts

Each platform's reservation websites, public endpoints (curl), and MRN formats
are documented in its `platforms/<platform>.md`. List what's available:

```bash
ls platforms/
```

Ensure the platform exists in `Platform` in `src/domain.ts`. Add it when it is
new. If `platforms/<platform>.md` **already exists**, skip the remaining platform
onboarding work and continue to Step 4.

If it does **not** exist, onboard the platform now (a platform usually has many
tenants; the tenant/organization id is embedded in the URL as a subdomain or
path segment):

1. Probe the portal with `curl` and an interactive browser. Evaluate both a
   server API calendar and a device WebView calendar; do not assume login-gated
   availability is unsupported merely because `curl` cannot reach it.
2. Extend the provider types in `src/providers.ts` only when the platform needs
   configuration fields that the standard provider shape cannot represent.
3. Write `platforms/<platform>.md` following the template below.

When filling in `## MRN`, use the platform's **native terms** for its place and
resource segment labels. Document when one place segment spans multiple physical
places. A resource must still map to one court.

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

## Calendar support

<Record both evaluations: whether a stable JSON-like API can be polled by
Matcha's server, and whether the browser calendar can be driven in an iOS
WebView when API polling is unavailable or requires user authentication. Include
the calendar URL, authentication boundary, date/resource controls, availability
window, rate-limit evidence, and a recommendation of `matcha-server`,
`matcha-device`, or `unsupported`. State whether the recommendation already
works in application code or needs the root `add-platform` workflow.>

## MRN

| | Format |
|---|---|
| Place `mrn` | `<platform>:<org>:<placeLabel>/<placeId>` |
| Resource `mrn` | `…/<resourceLabel>/<resourceId>` |

<Optional: notes on any synthetic ids, slugging rules, or courts to skip.>
````

Then continue to Step 4.

## Step 4 - discover and reconcile provider params

Open `platforms/<platform>.md` and follow its discovery steps for every accepted
facility, including facilities under an existing provider. Extract court
labels/ids, operating hours, and tags, plus the provider parameters used by
`config.json` (Step 6): portal URLs, calendar behavior, booking policies,
duration constraints, and platform-specific scheduler parameters.

When `config.json` already exists, identify only the additions or corrections
required for the new places and resources. Preserve unrelated verified values.

For each provider, explicitly evaluate both calendar integration paths:

1. API/server: inspect public page traffic and probe stable JSON-like endpoints
   across multiple dates. Identify provider, place, resource, and date
   parameters; authentication or tokens; response slot semantics; availability
   window; and safe polling rate. Prefer `matcha-server` when the API is
   tractable without a user's interactive session.
2. WebView/device: when API polling is unavailable, session-bound, or
   browser-only, inspect whether the provider calendar can be opened and driven
   in an iOS WebView. Identify the stable entry URL, authentication requirement,
   date and resource controls, and how availability is observed. Prefer
   `matcha-device` when the user's browser session can honestly provide the
   calendar.

Check whether the selected platform/provider path is already implemented in
`daemon/`, `shared/`, `api/`, and `ios/`. Configure the matching Courts calendar
when support exists. When new application behavior is required, record the
evidence and concrete recommendation, then continue through the root
`.agents/skills/add-platform/SKILL.md` workflow. Use `unsupported` only after
both paths have been evaluated and neither is feasible or the required
application work is explicitly outside the approved scope.

## Step 5 - `places.json`

Each organization gets a `providers/<platform>-<organization>/` directory. Its
`places.json` is a bare JSON array of place objects - one object per facility.
Start a new org with an empty array (skip if the file already exists):

```json
[]
```

There is no authored provider id or platform field: the provider id
`<platform>:<organization>` is derived from each place's `mrn` and checked
against the directory's `config.json` at build time.

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
| manual | `manual:<org>:location/<nativeId-or-slug>` | `…/court/<nativeId-or-number>` |

Place object shape:

```json
{
  "placeId": "<hashid(applePlaceId)>",
  "applePlaceId": "<from find-apple-places>",
  "displayName": "<Facility Name>",
  "coordinate": { "lat": 0, "lng": 0 },
  "timezone": "America/Los_Angeles",
  "tags": ["indoor"],
  "mrn": "<place mrn>",
  "provider": {
    "name": "<Provider display name>",
    "resources": [
      {
        "name": "<Court name>",
        "mrn": "<resource mrn>",
        "tags": ["outdoor"]
      },
      ...
    ]
  }
}
```

The build adds DynamoDB `PK` / `SK`, `provider.platform`, and empty resource
`slots` to generated `items.json`. Never author those fields in `places.json`.
Resource `tags` use the values `indoor`, `outdoor`, `lighted`, `reservable`,
`walk-in`. Never add `reserveBy`; the daemon stamps it per resource from
platform signals such as ActiveNet `reservation_unit` at poll time.

Prefer publicly verified native place and resource ids. When an operator or
official inventory verifies the exact court count but the known platform does
not expose native ids or labels, retain it and use deterministic synthetic ids:
a stable facility slug and `court/1` through `court/<count>`. Preserve useful
published splits such as `court/indoor-1`. Use native segment labels when known,
otherwise `location` and `court`. Record derivations in the platform document;
never create an aggregate resource or infer a count.

## Step 6 - `config.json`

The provider directory's `config.json` describes its public identity, calendar,
and booking behavior. Create it when the provider is new. Otherwise reconcile
new scheduler parameters, resource/place policy targets, URLs, and corrected
facts discovered in Step 4. Shared fields:

For a new provider, import its `config.json` in `src/providers.ts` and add it to
the `providerConfigs` array. Existing providers need no registration change.

| Field | Description |
|---|---|
| `id` | provider id `<platform>:<organization>` |
| `platform` | the platform string |
| `name` | provider display name |
| `location` | `{ "city", "state" }` |
| `urls` | `{ "signin", "signup", "cancellation" }` portal URLs |
| `calendar` | availability source and server polling limits |
| `scheduler` | CourtReserve scheduler configuration |
| `courtSheetId` | RacquetDesk public court-sheet id |
| `bookingPolicies` | provider-wide default plus optional place/resource-specific overrides |

Calendar types are:

- `unsupported`
- `matcha-device` for WebView/device, with `requiresAuthentication`
- `matcha-server` for server API polling, with `notifications` and `requestsPerMinute`

CourtReserve providers may include `scheduler`, whose type is `consolidated` or
`expanded`, with `configs` keyed by `CustomSchedulerId`:

- consolidated → `{ "costTypeId", "reservationMinInterval" }`
- expanded → also `{ "selectedCourtIds", "courtLabels": [...], "slotInterval", "schedule": { "start", "end" } }`

Every configured provider has exactly one provider-wide booking policy without
`places` or `resources`. Add targeted overrides with one of those arrays. Every
policy requires a unique `id`, a `minAdvance` value (`"next-day"` or `"HH:MM"`),
and a type. Policies for a live calendar also require `maxAdvance` with the same
syntax; it controls the polling and device-fetch horizon. For `minAdvance`,
`next-day` starts at the venue's next midnight. For `maxAdvance`, it extends
through the end of the venue's next calendar day:

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
    "requestsPerMinute": 30
  },
  "bookingPolicies": [
    {
      "id": "<provider-wide policy id>",
      "minAdvance": "00:00",
      "maxAdvance": "168:00",
      "type": "matcha-device",
      "reserveBy": "range",
      "minDuration": "00:30",
      "maxDuration": "01:30"
    }
  ]
}
```

Every provider with published places must have a complete `config.json`. Use an
`unsupported` calendar when live availability cannot be fetched. Use an
`unsupported` booking policy for walk-in courts or when no honest booking
handoff exists; use a `provider` policy only when its URL genuinely starts the
provider's booking flow. Do not leave a published provider as factual metadata
only. The build rejects places whose provider is not fully configured.

## Step 7 - build and verify

```bash
bun run build
```

This validates the connected provider/place/resource catalog, including
authoring shape, tags, coordinates, timezones, identifiers, MRNs, policy targets, and
scheduler references, then regenerates `items.json` + `INDEX.md`. A failed
validation prints its source location and reason; fix it and rerun.

Review the diff (`items.json`, `INDEX.md`, the provider's `places.json` /
`config.json`, and any new `platforms/<platform>.md`) before publishing.

## Step 8 - publish to sandbox

Create a task-scoped JSON array from generated `items.json` containing only the
user-approved new `placeId` values. Never point a sandbox or production write at
an unreviewed set of places.

Run the explicit sandbox dry run and confirm its proposed additions exactly
match the approved rows. Resolve any extra, missing, or skipped place before
executing:

```bash
./cli/matcha.ts api add-places --table matcha-sandbox --file <approved-items.json>
./cli/matcha.ts api add-places --table matcha-sandbox --file <approved-items.json> --execute
```

Read the place back through the sandbox API or DynamoDB and confirm its
`placeId`, display name, provider, resources, coordinate, and tags. Sandbox
publication is required even when the user ultimately declines production.

## Step 9 - verify end-to-end in iOS

Start the sandbox API as a retained background process, then build and launch
the app on the pinned simulator. The shared scheme points simulator builds at
the local sandbox API.

```bash
./cli/matcha.ts api start-sandbox
sim --device matcha-qa run matcha.matcha-ios-app \
  --project ios/matcha-ios-app.xcodeproj \
  --scheme matcha-ios-app
```

Use `sim` accessibility operations to select the place's region, open Courts,
open Search, and select `placeRow-<placeId>`. Verify every approved place:

- appears in the correct region and map area with the expected display name
- opens its detail screen without an API or decoding error
- shows the expected provider, court resources, tags, and booking behavior
- resolves the Apple map item at the expected physical location
- emits no relevant error in the captured app and sandbox API logs

Capture a screenshot and accessibility tree for the final place state. Fix any
failure, rebuild, republish the corrected sandbox item with `edit-places` when
appropriate, and repeat the E2E test. Do not proceed with a failed or partial
E2E result.

## Step 10 - production approval and release

Report the approved-place table again with sandbox and E2E results, then ask the
user explicitly whether to add those exact `placeId` values to production. If
the user declines or has not answered, stop with the changes and sandbox data
intact. Do not write `matcha-prod`, push either repository, or otherwise trigger
a production deployment.

After explicit approval, commit and push Courts first, commit its updated
pointer in `matcha-tennis`, push `main`, and wait for the triggered deployment
to succeed. Then dry-run the same task-scoped file against production, verify it
contains only the approved additions, execute, and read the places back:

```bash
./cli/matcha.ts api add-places --table matcha-prod --file <approved-items.json>
./cli/matcha.ts api add-places --table matcha-prod --file <approved-items.json> --execute
```

Never reuse the earlier approval for additional candidates or for an expanded
production diff.

## Checklist

- [ ] candidate is not already in `INDEX.md` or provider JSON
- [ ] exact court count and access verified; unknown tags and booking facts remain unknown
- [ ] restricted-access facilities included honestly instead of deferred for access alone
- [ ] known booking platforms are never modeled as `manual`
- [ ] synthetic resource ids derive deterministically from a verified court count when native ids are unavailable
- [ ] evidence URLs recorded in the work summary or reusable platform doc
- [ ] `applePlaceId` / coordinate / timezone from `find-apple-places.ts`
- [ ] `placeId` = `hashid(applePlaceId)`
- [ ] review table presented and exact candidate rows approved by the user
- [ ] `platforms/<platform>.md` exists (onboarded the platform if it was new)
- [ ] API/server and WebView/device calendar paths both evaluated, with the selected mode and any `add-platform` work recorded
- [ ] new platform added to `src/domain.ts` and any necessary specialized provider type added to `src/providers.ts`
- [ ] `providers/<platform>-<organization>/places.json` exists (created for a new org)
- [ ] `providers/<platform>-<organization>/config.json` fully defines and reconciles calendar and booking behavior
- [ ] new provider config imported and registered in `src/providers.ts`
- [ ] provider id belongs to the correct region in `src/regions.ts`
- [ ] place object appended to the `places.json` array with correct place + resource mrns
- [ ] `bun run build` green; `items.json` + `INDEX.md` regenerated
- [ ] diff reviewed and sandbox dry run contains only approved places
- [ ] approved places written to `matcha-sandbox` and read back successfully
- [ ] iOS E2E passed for each approved place with screenshot, AX tree, and clean logs
- [ ] production approval requested after E2E
- [ ] if approved, Courts pushed first, parent pointer deployed successfully, production dry run reviewed, and exact places written and read back
