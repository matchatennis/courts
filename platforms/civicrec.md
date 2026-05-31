# CivicRec

CivicPlus Recreation Management (formerly Rec1), a parks-and-rec registration
platform used by municipalities. The catalog is login-gated — no public,
auth-free availability API — so it is modeled like ClubAutomation: facilities
are listed for discovery with synthetic court resources and no live slots.

- Website: https://www.civicplus.com/civicrec
- Portal: `https://<org>.civicrec.com` (e.g. `wa-bellevue`)
- Provider id: `civicrec:<org>` — the `<org>.civicrec.com` subdomain slug.

## Discover params

There is no public availability endpoint — `/`, `/catalog`, and `/catalog/index`
all redirect to `/account/login`, and the catalog requires an account. Do not
create or use an account.

Source facility data from the operator's parks website instead — the canonical
public-court list with per-park court counts and lighting lives at the city's
parks pages (for Bellevue, the "Outdoor Tennis Courts" and "Robinswood Tennis
Center" pages). Get each place's coordinate/timezone/`applePlaceId` from
`find-apple-places.ts`, never by hand.

Municipal park courts are public drop-in — tag them `walk-in`, not
`reservable`. Add `lighted` when the source lists the courts as lighted. Model
each place's courts as synthetic resources numbered `1..N` from the published
court count (there are no per-court ids in a public CivicRec surface).

## MRN

| | Format |
|---|---|
| Place `mrn` | `civicrec:<org>:facility/<facility-slug>` |
| Resource `mrn` | `…/court/<n>` |

`<facility-slug>` is a stable kebab-case slug of the facility name; `<n>` is the
1-based court number.
