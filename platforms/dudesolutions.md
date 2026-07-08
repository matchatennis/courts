# Dude Solutions

Facility-scheduling calendar (Brightly Event Manager, formerly Dude Solutions /
SchoolDude, built on Active Data Calendar) used by school districts to publish
field/court usage. Not a booking system - it publishes when each facility is
reserved vs. open for public use. Read-only.

- Website: https://www.brightlysoftware.com
- Calendar: `https://events.dudesolutions.com/<org>/site/fields/`
- Provider id: `dudesolutions:<org>` - the Event Manager site slug (e.g. `bsd405`).

## Discover params

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
id). The `--<School> Tennis Court - Public Use` pseudo-location is **not** a
court, but keep its GUID — it is where the school's public-use windows are
published (see availability below). `… - General Scheduling` is an internal
bucket and can be ignored.

Availability comes from the calendar's own JSON handler - no scraping of
ASP.NET postbacks, no login. `query.ashx?get=eventlist` returns JSONP (wrapped
in `( … )`) whose `html` field is server-rendered events tagged with
schema.org microdata (`itemprop="name"`, `startDate`, `endDate`, `description`,
all ISO-8601 UTC). `pageSize=-1` returns the whole window unpaged. `location=`
filters to a single GUID.

Availability for a court is **(school public-use windows) minus (that court's
reservations)** — two GUIDs, fetched separately:

- **Public-use windows** are published once per school under the `Public Use`
  pseudo-location GUID (e.g. `Sammamish HS Tennis Courts Public Use`). They do
  **not** appear under individual court GUIDs.
- **Reservations** are per court under the real court GUID. The server expands
  grouped reservations to their member courts, so `location=<courtGuid>` returns
  exactly that court's blocked time with no name parsing (a `Courts 1-4`
  reservation appears under courts 1-4's GUIDs but not 5-7; the `… 1-4` text in
  the event `name` is just a label — the GUID filter already did the expansion).

```bash
# Public-use windows for the school, then reservations for one court:
curl -s 'https://events.dudesolutions.com/handlers/query.ashx?tenant=<org>&site=fields&get=eventlist&page=0&pageSize=-1&total=-1&view=list.xslt&location=<publicUseGuid>' ...
curl -s 'https://events.dudesolutions.com/handlers/query.ashx?tenant=<org>&site=fields&get=eventlist&page=0&pageSize=-1&total=-1&view=list.xslt&location=<courtGuid>' \
  -A "Mozilla/5.0" -e "https://events.dudesolutions.com/<org>/site/fields/"
```

`scripts/fetch-dudesolutions.ts` implements this: it fetches both GUIDs and
subtracts reservations from the public-use windows. All times are ISO-8601
UTC; convert with the place timezone (UTC dates can land on the wrong local
day). Courts are public drop-in (no per-court online booking) - tag them
`walk-in`, not `reservable`.

## MRN

| | Format |
|---|---|
| Place `mrn` | `dudesolutions:<org>:location/<schoolGuid>` |
| Resource `mrn` | `…/court/<courtGuid>` |
