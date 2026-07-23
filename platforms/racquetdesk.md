# RacquetDesk

Club management and court-reservation software for private/public tennis clubs,
also fronted under the **10sportal** brand. Each club is a subdomain on
`racquetdesk.net`. Clubs may publish an embedded, read-only court sheet that can
support a server-backed calendar without an account.

- Website: https://www.10sportal.com
- Portal: `https://<org>.racquetdesk.net` (a `10sportal.com/club/login/<club-slug>`
  link redirects here, e.g. `eastside-tennis-center` -> `estc.racquetdesk.net`).
- Provider id: `racquetdesk:<org>` - the `<org>.racquetdesk.net` subdomain.

## Discover params

Look for an embedded court sheet on the club's public website. The embed URL has
the form `https://www.racquetdesk.net/embeddedContent/courtsheets/index.html?eID=<id>`.
Store `<id>` as `calendar.courtSheetId`. The page exposes its hours, resource ids,
and public event proxy. Blank court-sheet cells are available; every returned
event blocks its resource. Fetch with `hideApptTitle=1` and do not store titles or
descriptions.

Source court data from the club's public website instead (court counts, indoor/
outdoor split, lighting). For Eastside Tennis Center, `topskirkland.org` lists
"six full-size and six youth-size courts." Get each place's coordinate/timezone/
`applePlaceId` from `find-apple-places.ts`, never by hand.

One `racquetdesk.net` subdomain is one physical club, so model the place as a
single `location/default`. Use the resource ids and names published in the court
sheet.

## MRN

| | Format |
|---|---|
| Place `mrn` | `racquetdesk:<org>:location/default` |
| Resource `mrn` | `…/court/<resource-id>` |

Tag indoor/outdoor/lighted per the club's published court list; these are
`reservable` through the provider, not `walk-in`.
