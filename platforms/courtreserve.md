# CourtReserve

SaaS for private clubs and some municipal indoor centers.

- Website: https://courtreserve.com
- Portal: `https://app.courtreserve.com/Online/Portal/Index/<orgId>`
- Provider id: `courtreserve:<orgId>` — the numeric `orgId`.

## Discover params

Open the org's CourtReserve scheduler in a browser, intercept the availability
XHR, and read the `jsonData` query param. Extract: `orgId`, `CostTypeId`,
`CustomSchedulerId` (one per location/scheduler), `SelectedCourtIds`,
`ReservationMinInterval`.

Two public, auth-free endpoints — test both, use whichever the org serves:

```bash
# Consolidated — availability by court type (scheduleType: "consolidated")
curl -s "https://app.courtreserve.com/Online/Reservations/ReadConsolidated/<orgId>" \
  -X POST -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' \
  --data-urlencode "sort=" --data-urlencode "group=" --data-urlencode "filter=" \
  --data-urlencode 'jsonData={"startDate":"...","orgId":"<orgId>","TimeZone":"America/Los_Angeles","KendoDate":{"Year":2026,"Month":3,"Day":1},"UiCulture":"en-US","CostTypeId":"<costTypeId>","CustomSchedulerId":"<schedulerId>","ReservationMinInterval":"60"}'

# Expanded — bookings by court label (scheduleType: "expanded")
curl -s "https://memberschedulers.courtreserve.com/SchedulerApi/ReadExpandedApi?id=<orgId>&uiCulture=en-US&jsonData=<urlEncodedJsonData>"
```

From the responses get: court labels (`CourtLabel`), operating hours (earliest/
latest slot, converted to local time), slot interval (usually 1800s). Skip
permanently-closed courts (`IsCourtClosed: true`) and `WAITLIST<id>` court types.

## MRN

| | Format |
|---|---|
| Place `mrn` | `courtreserve:<org>:scheduler/<schedulerId>` |
| Resource `mrn` | `…/courtlabel/<Court Label>` |
