# Clubessential

Clubessential provides private-club websites and member reservation systems.
Court calendars are available after members authenticate with their club.

- Website: https://www.clubessential.com/reservations/
- Portal: `https://www.<club-domain>/login`
- Provider id: `clubessential:<club-domain>` - the club's custom website host without `www`.

## Discover params

Fetch the public club login and verify Clubessential ownership from the
`static.clubessential.com` assets, `CEBrowser` cookie, or Clubessential
copyright metadata. Public pages can verify facility inventory and booking
rules, but court sheets and native resource identifiers require a member
session. Do not create an account. Use deterministic facility and court slugs
when the official inventory verifies the count.

```bash
curl -sSIL 'https://www.<club-domain>/login'
curl -sSL 'https://www.<club-domain>/login'
```

## Calendar support

No auth-free court availability API is exposed by the club website. The
Clubessential reservation API and court sheet are session-bound. The member
site is suitable for top-level navigation in an iOS WebView, so the preferred
path is `matcha-device` with authentication. Matcha does not implement this
platform yet; use the root `add-platform` workflow before changing the provider
calendar from `unsupported`.

## MRN

| | Format |
|---|---|
| Place `mrn` | `clubessential:<club-domain>:location/<location-slug>` |
| Resource `mrn` | `…/court/<court-id-or-number>` |

When authenticated native ids are unavailable, use the stable facility slug
and courts `1..N` from the verified official inventory.
