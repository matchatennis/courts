# GameTime

Court-reservation software for private tennis/racquet clubs. Each club is a
subdomain on `gametime.net`. Court availability is login-gated - no public,
auth-free API - so it is modeled like ClubAutomation/CivicRec: courts are listed
for discovery as synthetic resources with no live slots.

- Website: https://www.gametime.net
- Portal: `https://<org>.gametime.net` (sign-in at `/auth`).
- Provider id: `gametime:<org>` - the `<org>.gametime.net` subdomain (e.g. `cptc`
  for Central Park Tennis Club).

## Discover params

There is no public availability endpoint - `/` redirects to `/auth` and
reservations require an account. Many GameTime clubs are members-only. Do not
create or use an account.

Source court data from the club's public website instead (court counts, indoor/
outdoor split, lighting). For Central Park Tennis Club, `centralparktennisclub.com`
lists "18 courts (12 indoor & 6 outdoor)." Get each place's coordinate/timezone/
`applePlaceId` from `find-apple-places.ts`, never by hand.

One `gametime.net` subdomain is one physical club, so model the place as a single
`location/default` and its courts as synthetic resources numbered `1..N` from the
published court count (there are no per-court ids in a public surface).

## MRN

| | Format |
|---|---|
| Place `mrn` | `gametime:<org>:location/default` |
| Resource `mrn` | `…/court/<n>` |

`<n>` is the 1-based court number. Tag indoor/outdoor/lighted per the club's
published court list; these are `reservable` (member booking), not `walk-in`.
