# Amilia

SmartRec by Amilia, a parks-and-rec registration platform used by
municipalities (City of Redmond uses it for classes/camps). The store is for
program registration and facility rentals, not public court availability - there
is no auth-free per-court availability API - so municipal park courts are
modeled like CivicRec: drop-in courts as synthetic resources with no live slots.

- Website: https://www.amilia.com
- Portal: `https://app.amilia.com/store/en/<org>` (e.g. `city-of-redmond`).
- Provider id: `amilia:<org>` - the `store/en/<org>` slug.

## Discover params

There is no public availability endpoint for drop-in courts - the Amilia store
exposes program/camp/rental registration, not a per-court schedule. Do not
create or use an account.

Source court data from the operator's parks website instead - the city's
facility-detail pages list per-park court counts and lighting (for Redmond,
`redmond.gov/facilities/facility/details/<slug>`). Get each place's coordinate/
timezone/`applePlaceId` from `find-apple-places.ts`, never by hand.

Municipal park courts are public drop-in - tag them `walk-in`, not `reservable`.
Add `lighted` when the source lists the courts as lighted. Model each place's
courts as synthetic resources numbered `1..N` from the published court count
(there are no per-court ids in a public Amilia surface).

## MRN

| | Format |
|---|---|
| Place `mrn` | `amilia:<org>:facility/<facility-slug>` |
| Resource `mrn` | `…/court/<n>` |

`<facility-slug>` is a stable kebab-case slug of the facility name; `<n>` is the
1-based court number.
