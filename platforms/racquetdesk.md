# RacquetDesk

Club management and court-reservation software for private/public tennis clubs,
also fronted under the **10sportal** brand. Each club is a subdomain on
`racquetdesk.net`. Court availability is login-gated - no public, auth-free API -
so it is modeled like ClubAutomation/CivicRec: courts are listed for discovery as
synthetic resources with no live slots.

- Website: https://www.10sportal.com
- Portal: `https://<org>.racquetdesk.net` (a `10sportal.com/club/login/<club-slug>`
  link redirects here, e.g. `eastside-tennis-center` -> `estc.racquetdesk.net`).
- Provider id: `racquetdesk:<org>` - the `<org>.racquetdesk.net` subdomain.

## Discover params

There is no public availability endpoint - `/`, `/booking`, and `/guest` all
redirect to or require `/login`, and reservations require an account. Do not
create or use an account.

Source court data from the club's public website instead (court counts, indoor/
outdoor split, lighting). For Eastside Tennis Center, `topskirkland.org` lists
"six full-size and six youth-size courts." Get each place's coordinate/timezone/
`applePlaceId` from `find-apple-places.ts`, never by hand.

One `racquetdesk.net` subdomain is one physical club, so model the place as a
single `location/default` and its courts as synthetic resources numbered `1..N`
from the published court count (there are no per-court ids in a public surface).

## MRN

| | Format |
|---|---|
| Place `mrn` | `racquetdesk:<org>:location/default` |
| Resource `mrn` | `…/court/<n>` |

`<n>` is the 1-based court number. Tag indoor/outdoor/lighted per the club's
published court list; these are `reservable` (member booking), not `walk-in`.
