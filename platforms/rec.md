# Rec

Modern booking platform (rec.us), a smaller-but-growing competitor in the
municipal space.

- Website: https://www.rec.us
- Portal: `https://www.rec.us/organizations/<slug>`
- Provider id: `rec:<slug>` — the `rec.us/organizations/<slug>` path slug.

## Discover params

Public API:

```bash
# Location detail — courts live here
curl -s 'https://api.rec.us/v1/locations/<locationId>?publishedSites=true'

# Schedule for a day
curl -s 'https://api.rec.us/v1/locations/<locationId>/schedule?startDate=YYYY-MM-DD'
```

Get the `locationId` (UUID) and each court's UUID + name from the location
detail response.

## MRN

| | Format |
|---|---|
| Place `mrn` | `rec:<org>:location/<locationId>` |
| Resource `mrn` | `…/court/<courtId>` |
