# Dude Solutions

Facility-scheduling calendar (Brightly Event Manager, formerly Dude Solutions /
SchoolDude, built on Active Data Calendar) used by school districts to publish
field/court usage. Not a booking system — it publishes when each facility is
reserved vs. open for public use. Read-only.

- Website: https://www.brightlysoftware.com
- Calendar: `https://events.dudesolutions.com/<org>/site/fields/`
- Provider id: `dudesolutions:<org>` — the Event Manager site slug (e.g. `bsd405`).

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
id). Skip the `… - General Scheduling` and `… - Public Use` pseudo-locations —
they are scheduling buckets, not physical courts.

Availability comes from the calendar's own JSON handler — no scraping of
ASP.NET postbacks, no login. `query.ashx?get=eventlist` returns JSONP (wrapped
in `( … )`) whose `html` field is server-rendered events tagged with
schema.org microdata (`itemprop="name"`, `startDate`, `endDate`, `description`,
all ISO-8601 UTC). `pageSize=-1` returns the whole window unpaged.

`location=` filters to a single GUID and accepts **either** a place GUID (rolls
up all its courts) **or** a per-court GUID. Filtering by court GUID is the one
to use: the server expands every grouped reservation to its member courts, so
`location=<courtGuid>` returns exactly that court's blocked time with no name
parsing. (A `Courts 1-4` reservation appears under courts 1–4's GUIDs but not
5–7; a `Courts 1-7` block appears under all seven. The `… 1-4` text in the
event `name` is just a label — the GUID filter has already done the expansion.)

```bash
# One court's events (use view=list.xslt for end times + description)
curl -s 'https://events.dudesolutions.com/handlers/query.ashx?tenant=<org>&site=fields&get=eventlist&page=0&pageSize=-1&total=-1&view=list.xslt&location=<courtGuid>' \
  -A "Mozilla/5.0" -e "https://events.dudesolutions.com/<org>/site/fields/"
```

Events titled `… Public Use - Weekday/Weekend` mark open windows; `… School
Use` / `School Athletics Use` and named reservations mark blocked time. A
runtime fetcher queries one eventlist per `court/<courtGuid>` resource and
inverts reserved blocks against the public-use windows. Courts are public
drop-in (no per-court online booking) — tag them `walk-in`, not `reservable`.

## MRN

| | Format |
|---|---|
| Place `mrn` | `dudesolutions:<org>:location/<schoolGuid>` |
| Resource `mrn` | `…/court/<courtGuid>` |
