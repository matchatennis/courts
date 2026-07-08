# ActiveNet

Active Network's parks-and-rec booking platform; dominant for municipal
parks-and-rec across the West Coast.

- Website: https://www.activenetwork.com
- Portal: `https://anc.apm.activecommunities.com/<org>`
- Provider id: `activenet:<org>` - the org slug (the URL path segment, e.g. `seattle`).

## Discover params

Org slug is the URL path segment (e.g. `seattle`). Public endpoints, no auth -
require header `page_info: {"page_number":1,"total_records_per_page":20}`:

```bash
# Per-resource detail (amenities, reservability)
curl -s 'https://anc.apm.activecommunities.com/<org>/rest/reservation/resource/detail/<resourceId>?locale=en-US' \
  -H 'page_info: {"page_number":1,"total_records_per_page":20}' -H 'X-Requested-With: XMLHttpRequest'

# Daily availability
curl -s 'https://anc.apm.activecommunities.com/<org>/rest/reservation/resource/availability/daily/<resourceId>?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&locale=en-US'
```

Each tennis court is a `resource` under a `center`. Enumerate a center's
resources with the search API behind `/reservation/search` - it needs session
cookies plus the `csrfToken` embedded in that page:

```bash
curl -s -c jar.txt 'https://anc.apm.activecommunities.com/<org>/reservation/search?locale=en-US' -o search.html
# extract: csrfToken = "<uuid>" from search.html
curl -s -b jar.txt 'https://anc.apm.activecommunities.com/<org>/rest/reservation/resource?locale=en-US' \
  -H 'Content-Type: application/json;charset=utf-8' -H 'X-Requested-With: XMLHttpRequest' \
  -H 'X-CSRF-Token: <uuid>' -H 'page_info: {"page_number":1,"total_records_per_page":100}' \
  --data '{"center_ids":[<centerId>],"activity_id":0,"attendee":0,"date_times":[],"equipment_qty":0,"event_type_id":0,"facility_type_ids":[],"amenity_ids":[],"reservation_group_ids":[],"keyword":"","sort_option":{"order_by":"Name","order_option":"ASC"}}'
```

Each item's `reserve_by` is `minute` (book any start/end) or `rental_block`
(fixed atomic blocks; `reservation_unit_id: 7`, also surfaced as
`reservation_unit: 7` in the daily availability response). The daemon derives
each resource's `reserveBy` from that signal at poll time - don't curate it.
The detail endpoint returns an empty body without the `page_info` header.

Derive resource tags by hand from the detail response:

| Source field | Tag |
|---|---|
| `amenities[]` contains `"Lighted Court/Field"` | `lighted` |
| `general_information.no_internet_permits === false` | `reservable` |

`no_internet_permits: true` means the court can't be booked online (walk-up /
phone only) - still listable, but omit the `reservable` tag.

## MRN

| | Format |
|---|---|
| Place `mrn` | `activenet:<org>:center/<centerId>` |
| Resource `mrn` | `…/resource/<resourceId>` |
