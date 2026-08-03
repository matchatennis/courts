---
name: explore-places
description: Find tennis courts and tennis facilities missing from the Matcha Courts catalog. Use for coverage audits, city or neighborhood searches, comparing an external place list with Courts, or producing verified candidates for the add-place workflow. Search Google Maps through Mango, exhaust paginated results across overlapping subareas and tennis-specific query variants, deduplicate candidates, and report evidence without changing the catalog unless the user also asks to add places.
---

# Boundary

Discover physical places with at least one tennis court and compare them with
the Courts catalog. Treat Google Maps as a lead source, not proof of court
facts. Do not add or edit providers, places, resources, generated artifacts, or
application code during a coverage-only request.

When the user asks to add accepted candidates, finish the discovery report and
then use the sibling `$add-place` skill. Let that workflow verify Apple Place
IDs, provider configuration, resources, policies, and generated artifacts.

# Step 1 - establish the catalog baseline

Confirm the target area, including any boundary or radius the user supplied.
For a provided JSON, CSV, or place list, treat every entry as a seed candidate
and preserve its source name and location.

Read `INDEX.md` and `providers/*/places.json`. Build a comparison set with each
catalog place's display name, coordinate, provider, and MRN. Normalize names for
comparison, but retain the authored display names in results.

# Step 2 - cover the target area

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

If Mango is unavailable or the action does not expose pagination, report the
exact command and failure. Do not silently substitute an initial Maps result
page and call it complete.

# Step 3 - classify and reconcile

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

For likely missing places, open the Maps listing and follow its official website
or public operator page. Verify that tennis courts exist and capture the address,
operator, official URL, court count when published, indoor/outdoor status,
public access, and reservation method. Never infer a court count or booking
platform from photos, reviews, or a Maps category.

# Step 4 - report and hand off

Lead with counts for catalog matches, likely missing places, ambiguous matches,
and exclusions. Include a compact candidate table with:

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
