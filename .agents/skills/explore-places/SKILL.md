---
name: explore-places
description: Find tennis courts and tennis facilities missing from the Matcha Courts catalog. Use for coverage audits, city or neighborhood searches, backtesting discovery coverage, comparing Google Maps, TennisMaps, HAR captures, or another external place inventory with Courts, or producing verified candidates for the add-place workflow. Reconcile broad seed inventories with Google Maps through Mango and official operator evidence without changing the catalog unless the user also asks to add places.
---

# Boundary

Discover physical places with at least one tennis court and compare them with
the Courts catalog. Use broad directories for recall, Google Maps for current
listing identity, and official operator sources for court facts. Do not treat
any discovery source as proof. Do not add or edit providers, places, resources,
generated artifacts, or application code during a coverage-only request.

When the user asks to add accepted candidates, finish the discovery report and
then use the sibling `$add-place` skill. Let that workflow verify Apple Place
IDs, provider configuration, resources, policies, and generated artifacts.

# Step 1 - establish the catalog baseline

Confirm the target area, including any boundary or radius the user supplied.
For a provided JSON, CSV, HAR, or place list, treat every entry as a seed
candidate and preserve its source, source id, authored name, coordinate, stated
court count, and stated access. Treat HAR files as sensitive: inspect them
locally, extract only public place data, and never commit cookies, tokens, raw
responses, or the HAR itself.

Read `INDEX.md` and `providers/*/places.json`. Build a comparison set with each
catalog place's display name, coordinate, provider, and MRN. Normalize names for
comparison, but retain the authored display names in results.

# Step 2 - ingest broad seed inventories

Use supplied public facility lists and directory captures to widen recall before
ranked search. Filter every source to the requested geographic boundary before
making coverage claims. Exclude zero-court rows, but retain them in the rejected
count so the source funnel remains auditable.

For TennisMaps captures, extract the visible `locations` records with their
coordinates, TennisMaps id, stated court count, and access label. Treat
`Public Open`, `Public Gated`, and `Public Managed` as separate unverified
claims. A TennisMaps region can cover multiple cities, and its court counts,
access labels, names, and freshness all require later verification.

Never call or replay `ws/ws-tennismaps-support.asp`. The captured service says
it is not a public web service and restricts its use to TennisMaps. Use only
place data already visible in a user-provided capture or public page, and do not
build a dependency on TennisMaps availability.

# Step 3 - cover and resolve with Google Maps

Use Mango's `www.google.com:searchPlaces` action. Inspect its schema before the
first invocation:

```bash
mango service inspect -s www.google.com
```

Search with `limit: 20`. Pass every returned `nextCursor` back unchanged until
it is null. Deduplicate across pages by Google place ID, then canonical Maps URL.

```bash
mango service invoke www.google.com:searchPlaces --args '{"query":"tennis courts in Seattle, WA","limit":20}'
```

Run these query families for every target area:

- `tennis courts in <area>`
- `public tennis courts in <area>`
- `park tennis courts in <area>`
- `tennis club in <area>`
- `indoor tennis courts in <area>`

Do not rely on one city-wide ranked search. Divide a large area into overlapping
municipalities, neighborhoods, or coordinate-centered searches and exhaust each
query's pagination. Continue until a complete additional query/subarea pass
produces no new Google place IDs. Record the query, subarea, pages visited, and
new-place count so the coverage claim is auditable.

Resolve every broad-source seed that remains unmatched after the general search
with a direct name-and-area query. Use `getPlace` for likely candidates that
need an address, category, website, current status, or coordinate. Preserve the
broad-source record and Google record separately; a Google place id identifies
the listing, not a Matcha place or Apple Place ID.

Direct-resolve exact or strong facility-name matches even when the seed
coordinate is far from the catalog coordinate. Directories and place catalogs
can locate a court, entrance, building, or whole-park centroid differently.

If Mango is unavailable or the action does not expose pagination, report the
exact command and failure. Do not silently substitute an initial Maps result
page and call it complete.

# Step 4 - classify and reconcile

Remove advertisements and exclude permanently closed facilities, residences,
pickleball-only venues, stores, coaches without a court facility, and duplicate
listings for the same physical courts. Keep multi-sport parks when public or
reservable tennis courts are present.

Match each remaining place against the catalog using this order:

1. Same physical coordinate and facility identity.
2. Same or former name at the same address.
3. Normalized name plus nearby coordinate.
4. Shared operator or provider identifiers as supporting evidence only.

Do not treat a name mismatch alone as a missing place. Mark uncertain matches
for manual review instead of counting them as missing.

Use distance only to generate match candidates. Treat results within 100 meters
as strong location candidates and results from 100 through 250 meters as manual
identity checks. Never auto-match colocated courts, schools, clubs, or park
listings solely because they fall inside either distance band.

For likely missing places, open the Maps listing and follow its official website
or public operator page. Verify that tennis courts exist and capture the address,
operator, official URL, court count when published, indoor/outdoor status,
public access, and reservation method. Never infer a court count or booking
platform from photos, reviews, or a Maps category.

# Step 5 - report and hand off

Lead with counts for catalog matches, likely missing places, ambiguous matches,
and exclusions. Show the source funnel: raw records, records inside the target
boundary, positive-court candidates, Google-resolved candidates, catalog
matches, ambiguous matches, verified missing places, and rejected records.
Include a compact candidate table with:

- facility name and address
- Google place ID or canonical Maps URL
- coordinate
- classification and catalog match, if any
- official evidence URL
- verified tennis and access facts
- likely operator or reservation provider

Include a coverage matrix listing every subarea and query family, the number of
pages exhausted, and whether pagination ended normally. Say `coverage audit`
rather than `all courts` whenever boundaries, pagination, or official evidence
remain incomplete.

If additions were requested, pass only verified likely-missing candidates to
`$add-place`. Preserve ambiguous and rejected candidates in the report; do not
publish them to the catalog.

# Backtest protocol

Freeze a known catalog or official inventory as the truth set before discovery.
Run discovery and source deduplication without using truth-set names to guide
queries. Reconcile only after the candidate set is frozen. Report:

- facility-level recall for each source and for the combined sources
- false-positive and ambiguous candidate counts
- incremental yield from each source after earlier sources
- misses grouped by public, gated, private, indoor, and school facilities when known
- exact query coverage and any incomplete pagination or geographic boundary

Count a truth-set facility as found only after identity reconciliation, not from
raw proximity. Keep proximity-only results separate so colocated listings do not
inflate recall.
