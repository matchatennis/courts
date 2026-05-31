# Fusion

Innosoft Fusion is a recreation-management platform that universities self-host
for their campus rec centers (gyms, pools, courts). Each school runs its own
instance on its own domain, so there is no shared SaaS host. Facility schedules
are public — no auth — but they are **event calendars** (busy blocks like team
practices, intramurals, "Open Recreation") rather than open-slot booking grids.

- Website: https://www.innosoft.com
- Portal: `https://<host>/Facility/Index` — e.g. `https://reg.recreation.uw.edu/Facility/Index`
- Provider id: `fusion:<host>` — the org is the instance's full hostname
  (`reg.recreation.uw.edu`), since Fusion lives on an arbitrary per-school domain
  and the host cannot be derived from a short slug.

## Discover params

Public endpoints, no auth. The facility tree (groupings → individual courts)
lives in the `/Facility/Index` HTML; each facility links to
`/Facility/GetFacility?facilityId=<guid>` and the leaf facilities are the
individual courts.

```bash
# Facility tree — find court names and their facilityId GUIDs.
# Each leaf "<a href="/Facility/GetFacility?facilityId=GUID">" with an <h3> title
# and a "<p class="fi">" breadcrumb (e.g. "Outdoor Spaces > Tennis South Courts > TN South Court #1").
curl -s 'https://<host>/Facility/Index'

# Schedule for one facility over a date range. selectedId is the court's facilityId
# GUID (or a parent grouping GUID to aggregate; 00000000-...-000000000000 = all).
# Returns a JSON array of busy events: [{id,title,start,end,...}].
curl -s 'https://<host>/Facility/GetScheduleCustomAppointments?selectedId=<facilityId>&start=YYYY-MM-DDT00:00:00-07:00&end=YYYY-MM-DDT00:00:00-07:00'
```

Extract each tennis court's leaf `facilityId` GUID and human name from the tree.
Individual-court GUIDs have distinct schedules, so use the leaf GUID per resource
(not the parent grouping). Availability is derived from the gaps between busy
events at runtime — the slot grid is 15 min (`SlotDuration` in `GetNewCalendar`).

These are campus rec courts (event-blocked, not online-reservable by the public),
so tag by physical attributes only (`outdoor`/`indoor`/`lighted`); omit
`reservable`.

## MRN

| | Format |
|---|---|
| Place `mrn` | `fusion:<host>:facility/<parentFacilityId>` |
| Resource `mrn` | `…/court/<facilityId>` |

A Fusion instance groups courts under parent "facility groupings" (e.g. Tennis
North, Tennis South) that each map 1-to-1 with a physical location — use the
parent grouping's `facilityId` GUID as the place segment, and each leaf court's
`facilityId` GUID as the resource id. Both GUIDs are what the schedule endpoint's
`selectedId` consumes (parent = aggregate, leaf = single court).

If a single physical place ever spans multiple groupings, fall back to a synthetic
slug for the place segment (e.g. `ima-tennis`) and keep the leaf GUIDs as
resources.
