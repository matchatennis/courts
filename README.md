# Courts — an index of tennis courts around the world

Courts is an open index of tennis courts around the world. At Matcha Tennis, our goal is to be the fastest way to play.

Today, one of the biggest frustrations for players is simply finding and booking a court. Reservation systems are fragmented, legacy software creates poor user experiences, and important details like court rules, surfaces, availability, and conditions are often difficult to access.

We’re building a universal court index to make courts more discoverable, modernize the booking experience, and help more people spend less time off court and more time playing.

If you love tennis, we invite you to join us in making the sport more accessible to everyone.


## Contents

- [Specification](#specification)
  - [MRN — Matcha Resource Name](#mrn--matcha-resource-name)
  - [Slot — A bookable unit](#slot--a-bookable-unit)
- [Data](#data)
- [API](#api)
- [Clients](#clients)
- [Contributing](#contributing)

## Specification

### MRN — Matcha Resource Name

An MRN uniquely identifies a tennis court across every booking platform.

```
platform:organization:resource
```

| Segment        | Description                                       |
|----------------|---------------------------------------------------|
| `platform`     | Booking platform (e.g. `activenet`, `rec`)        |
| `organization` | Venue or site within the platform                 |
| `resource`     | Slash-delimited path to the specific court        |

Example:

```
rec:sfrecpark:location/12/court/3
```

### Slot — A bookable unit

A slot is a bookable time window on a court, identified by that court's MRN.

| Field      | Description                          |
|------------|--------------------------------------|
| `start`    | UTC epoch, in milliseconds           |
| `duration` | Length of the window, in milliseconds |

In availability listings a slot also carries a `state` of `RESERVABLE` or
`EXPIRED`.

## Data

Places are grouped by provider — the `platform:organization` pair — under
[`places/`](places/), one JSON file per provider.

| Provider ID                  | Platform       | Location           |
|-------------------------------|----------------|--------------------|
| `activenet:seattle`           | ActiveNet      | Seattle, WA        |
| `activenet:shorelinewa`       | ActiveNet      | Shoreline, WA      |
| `clubautomation:tcsp`         | ClubAutomation | Seattle, WA        |
| `courtreserve:12465`          | CourtReserve   | San Francisco, CA  |
| `courtreserve:6689`           | CourtReserve   | Woodinville, WA    |
| `courtreserve:7306`           | CourtReserve   | Bellevue, WA       |
| `rec:san-francisco-rec-park`  | Rec            | San Francisco, CA  |

## API

https://api.matchatennis.com/ implements the Courts specification.

- All requests and responses are JSON.
- Errors return `{ "error": "<message>" }` with a `4xx`/`5xx` status.
- List endpoints are cursor-paginated: pass `?cursor=<value>` and read the
  next `cursor` from the response.

| Method | Path                | Description                              |
|--------|---------------------|------------------------------------------|
| GET    | `/places`           | List all places (cursor-paginated)       |
| GET    | `/places/{placeId}` | Get a single place                       |

```
GET /places
GET /places/97dbdd4823
```

## Clients

1. [Matcha Tennis iOS](https://apps.apple.com/us/app/matcha-tennis/id6746148030?itscg=30200&itsct=apps_box_badge&mttnsubad=6746148030)
1. [Matcha Tennis Web](https://matchatennis.com/)

## Contributing

There are a few ways to help grow the index:

1. **Add a review** — share your experience of a court by appending an entry
   to [`REVIEWS.md`](REVIEWS.md). Reviews are surfaced in the Matcha Tennis
   apps.
1. **Update a place** — fix or improve an existing court by editing its
   provider JSON file in [`places/`](places/), e.g. coordinates, tags, or
   court names.
1. **Add new places** — add courts for a new venue. Extend an existing
   provider file in [`places/`](places/), or create a new
   `platform-organization.json` for a provider that isn't listed yet.

After editing files under `places/`, run `bun run build` to validate the data
and regenerate [`INDEX.md`](INDEX.md).

Questions or ideas? Start a discussion at
[matchatennis.com/support](https://matchatennis.com/support).
