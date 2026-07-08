# Facilitron

Facility-rental marketplace used by school districts to rent out gyms, fields,
theaters, and courts (Lake Washington School District uses it as `lwsd98052`).
School tennis courts are public drop-in outside school hours, not online-
reservable per-court, so they are modeled like CivicRec: each school is a place
with synthetic court resources and no live slots.

- Website: https://www.facilitron.com
- Portal: `https://www.facilitron.com/<org>` (the district landing, e.g.
  `lwsd98052`; individual schools also have their own pages, e.g. `lwhs98033`).
- Provider id: `facilitron:<org>` - the district slug.

## Discover params

There is no public per-court availability endpoint - Facilitron handles rental
requests, not a drop-in court schedule, and the public courts are walk-in. Do
not create or use an account.

Source court data from tennis directories / the district's school pages (court
counts, lighting). LWSD closes courts to the public weekdays 7:30 a.m.- 5 p.m.
and opens them evenings/weekends - so they are `walk-in`. Get each place's
coordinate/timezone/`applePlaceId` from `find-apple-places.ts`, never by hand.

Each school is one place. Model its courts as synthetic resources numbered
`1..N` from the published court count (there are no per-court ids in a public
Facilitron surface). Tag `outdoor`/`lighted` per the source; `walk-in`, not
`reservable`.

## MRN

| | Format |
|---|---|
| Place `mrn` | `facilitron:<org>:school/<school-slug>` |
| Resource `mrn` | `…/court/<n>` |

`<school-slug>` is a stable kebab-case slug of the school name; `<n>` is the
1-based court number.
