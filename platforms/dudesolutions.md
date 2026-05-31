# Dude Solutions

Facility-scheduling calendar (Brightly Event Manager, formerly Dude Solutions /
SchoolDude) used by school districts to publish field/court usage. Not a
booking system — it publishes when each facility is reserved vs. open for
public use. Read-only, scrape-based.

- Website: https://www.brightlysoftware.com
- Calendar: `https://events.dudesolutions.com/<org>/site/fields/`
- Provider id: `dudesolutions:<org>` — the Event Manager site slug (e.g. `bsd405`).

## Discover params

No JSON API and no iCal/RSS feed — the calendar is server-rendered ASP.NET.
The canonical facility list is the `ddlLocation` `<select>` in the page HTML: a
hierarchy `<District> Tennis/Pickleball Courts > <School> Tennis Courts >
Court N`, where every option `value` is a stable location GUID.

```bash
# Pull the location hierarchy (each court is one option with a GUID value)
curl -s "https://events.dudesolutions.com/<org>/site/fields/" -A "Mozilla/5.0" \
  | grep -oE 'name="[^"]*ddlLocation".*?</select>'
```

Each `--<School> ... Court N` option is one court (its GUID is the resource id);
the parent `-<School> Tennis Courts` option is the place (its GUID is the place
id). Skip the `… - General Scheduling` and `… - Public Use` pseudo-locations —
they are scheduling buckets, not physical courts.

Availability comes from the calendar itself: events titled `… Public Use -
Weekday/Weekend` mark open windows; `… School Use` / `School Athletics Use` and
named reservations mark blocked time. A runtime fetcher scrapes the calendar
filtered by location GUID and inverts reserved blocks against the public-use
windows. Courts are public drop-in (no per-court online booking) — tag them
`walk-in`, not `reservable`.

## MRN

| | Format |
|---|---|
| Place `mrn` | `dudesolutions:<org>:location/<schoolGuid>` |
| Resource `mrn` | `…/court/<courtGuid>` |
