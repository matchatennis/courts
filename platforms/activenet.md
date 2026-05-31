# ActiveNet

Active Network's parks-and-rec booking platform; dominant for municipal
parks-and-rec across the West Coast.

- Website: https://www.activenetwork.com
- Portal: `https://anc.apm.activecommunities.com/<org>`
- Provider id: `activenet:<org>` — the org slug (the URL path segment, e.g. `seattle`).

## Discover params

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

## MRN

| | Format |
|---|---|
| Place `mrn` | `activenet:<org>:center/<centerId>` |
| Resource `mrn` | `…/resource/<resourceId>` |
