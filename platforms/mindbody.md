# Mindbody

Mindbody provides scheduling and account management for fitness and racquet
businesses. Mountain View Tennis uses its public appointment widget for Cuesta
Tennis Center Courts 7 and 8.

- Website: https://www.mindbodyonline.com
- Portal: an operator-specific booking link launched from the operator website
- Provider id: `mindbody:<org>` - a stable operator slug when no public tenant id is exposed.

## Discover params

Open the operator's official reservation page and inspect the Mindbody iframe.
Record its widget id and select each court service to obtain `locationId`,
`serviceId`, and `staffId` from the schedule URL. The schedule page embeds
`initialAvailabilityData`, the service duration, and the court staff id in its
Next.js response.

```bash
curl -sS 'https://go.mindbodyonline.com/book/widgets/appointments/view/<widgetId>/schedule?locationId=<locationId>&serviceId=<serviceId>&staffId=<staffId>'
```

Use native appointment service ids for courts exposed by the widget. Retain
deterministic court ids only for verified walk-in courts without a Mindbody
service.

## Calendar support

The appointment schedule is public and includes structured dated availability
in the initial HTML response. Matcha's daemon fetches that response and assigns
each time to the configured court staff id. Use `matcha-server`; member login is
still required when the user continues into checkout. Mountain View Tennis
publishes an eight-day resident window and a seven-day non-resident window.

## MRN

| | Format |
|---|---|
| Place `mrn` | `mindbody:<org>:location/<locationId>` |
| Resource `mrn` | `…/appointment/<serviceId>` |

Each configured appointment maps to exactly one court through its `staffId`.
Use stable facility and court slugs only when Mindbody does not publish native
identifiers.
