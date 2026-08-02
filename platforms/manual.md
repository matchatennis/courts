# Manual

Operator-managed tennis facilities without a supported digital reservation
platform. Availability is not fetched; booking is walk-in, by phone, or
otherwise handled directly by the operator.

- Provider id: `manual:<org>` - a stable lowercase slug for the facility
  operator, such as `seattleparks` or `seattleu`.

## Discover params

Use the operator's official facility inventory, map, and access or reservation
policy. Prefer native location and court identifiers from that inventory. When
the operator publishes no identifiers, use a stable location slug and synthetic
1-based court numbers. Never model a digitally bookable provider as manual when
its reservation platform and native identifiers can be discovered.

Manual calendars are `unsupported`. Use an `unsupported` booking policy for
drop-in facilities and a `phone` policy when the operator explicitly accepts
court reservations by phone.

## MRN

| | Format |
|---|---|
| Place `mrn` | `manual:<org>:location/<nativeId-or-slug>` |
| Resource `mrn` | `…/court/<nativeId-or-number>` |
