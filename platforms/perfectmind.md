# PerfectMind

PerfectMind hosts municipal recreation and facility reservation portals. Its
public facility pages establish the session needed for Matcha to fetch live
availability without member authentication.

- Website: https://www.xplortechnologies.com/perfectmind
- Portal: `https://cityofmercerisland.perfectmind.com/<org>/Clients/BookMe4FacilityList/List`
- Provider id: `perfectmind:<org>` - the numeric tenant segment following the host.

## Discover params

Open the operator's facility-list URL and extract `calendarId`, `widgetId`, the
anti-forgery token, and session cookie. POST the token, ids, `page`, and
`pageSize` to the tenant's `GetFacilities` endpoint. Extract each result's
`LocationId`, `ID`, `Name`, address, advance window, and reservation rules.

```bash
curl -sS -c <cookie-file> 'https://cityofmercerisland.perfectmind.com/<org>/Clients/BookMe4FacilityList/List?calendarId=<calendarId>&widgetId=<widgetId>'
curl -sS -b <cookie-file> -X POST 'https://cityofmercerisland.perfectmind.com/<org>/Clients/BookMe4FacilityList/GetFacilities' --data-urlencode '__RequestVerificationToken=<token>' --data-urlencode 'calendarId=<calendarId>' --data-urlencode 'widgetId=<widgetId>' --data-urlencode 'page=1' --data-urlencode 'pageSize=100'
```

The Mercer Island portal exposes two reservable resources at Aubrey Davis Park
and two at Homestead Park. Model inventory-verified non-reservable courts with
deterministic synthetic ids: `homestead-drop-in-3`, `homestead-drop-in-4`, and
facility-scoped slugs for parks absent from the portal.

## Calendar support

The facility landing page establishes the session and anti-forgery token used
by `FacilityAvailability`. POST `facilityId`, an ISO `date`, `daysCount`,
`duration`, `serviceId`, `durationIds[]`, and `__RequestVerificationToken`.
The JSON response contains dated booking groups and available spots. This path
works without member authentication and is the preferred `matcha-server`
integration. A browser can also render and drive the public facility calendar,
but WebView automation is unnecessary while the server endpoint remains
available. Matcha's daemon implements this public session and availability
flow for providers configured with a PerfectMind host.

```bash
curl -sS -b <cookie-file> -X POST 'https://cityofmercerisland.perfectmind.com/<org>/Clients/BookMe4LandingPages/FacilityAvailability' --data-urlencode '__RequestVerificationToken=<token>' --data-urlencode 'facilityId=<facilityId>' --data-urlencode 'date=<ISO-date>' --data-urlencode 'daysCount=1' --data-urlencode 'duration=<minutes>' --data-urlencode 'serviceId=<serviceId>'
```

## MRN

| | Format |
|---|---|
| Place `mrn` | `perfectmind:<org>:location/<LocationId>` |
| Resource `mrn` | `…/facility/<ID>` |

One PerfectMind `LocationId` can represent an operator-wide location such as
`Parks` and therefore be shared by multiple physical Courts places. Native
resource `ID` values remain globally unique within the tenant. For verified
inventory omitted by the portal, use the stable park slug as the synthetic
`LocationId` and `<park-slug>-court-<number>` as the synthetic facility id.
