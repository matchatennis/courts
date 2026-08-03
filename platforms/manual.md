# Manual

Operator-managed tennis facilities without a publicly inspectable digital
reservation platform. Availability is not fetched; booking is walk-in, by
phone, or otherwise handled directly by the operator.

- Provider id: `manual:<org>` - a stable lowercase slug for the facility
  operator, such as `seattleparks` or `seattleu`.

## Discover params

Use the operator's official facility inventory, map, and access or reservation
policy. Prefer native location and court identifiers from that inventory. When
the operator publishes an exact count but no identifiers, use a stable location
slug and synthetic 1-based court numbers. Preserve a published indoor/outdoor
split in ids such as `indoor-1` and `outdoor-1`. Never model a digitally
bookable provider as manual once its reservation platform can be identified.
Login gates and missing native identifiers affect integration capability, not
platform identity.

Manual calendars are `unsupported`. Use an `unsupported` booking policy for
drop-in facilities and a `phone` policy when the operator explicitly accepts
court reservations by phone.

## MRN

| | Format |
|---|---|
| Place `mrn` | `manual:<org>:location/<nativeId-or-slug>` |
| Resource `mrn` | `…/court/<nativeId-or-number>` |

## Synthetic resources

| Provider | Source | Derivation |
|---|---|---|
| `manual:mercer-island-school-district` | [City facility inventory](https://www.mercerisland.gov/sites/default/files/fileattachments/parks_and_recreation/page/22030/2014-2019_plan_final.pdf) and [current MIHS tennis program](https://mihs.mercerislandschools.org/student-life/athletics/fall-sports/tennis-boys) | Stable school slug; six courts numbered `1..6`. |
| `manual:overlake-school` | [Official campus map](https://www.overlake.org/sites/default/files/documents/guides/CampusMapExternal.pdf) | Stable school slug; four outdoor courts numbered `1..4`. |
