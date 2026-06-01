# ClubAutomation

Club management software for private clubs. No public availability API.

- Website: https://www.clubautomation.com
- Provider id: `clubautomation:<org>` - a short human key (e.g. `tcsp`).

## Discover params

ClubAutomation has no public availability API - model it with a single
synthetic `court/default` resource. Use an existing
`providers/clubautomation-*/places.json` as the template; the org slug is a
short human key (e.g. `tcsp`).

## MRN

| | Format |
|---|---|
| Place `mrn` | `clubautomation:<org>:location/default` |
| Resource `mrn` | `…/court/default` |

ClubAutomation's native place term is `location` (the `location-reserve` filter
on `POST /event/reserve-court-new`). With no auth-free read, both ids are the
synthetic `default`.
