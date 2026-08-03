# Northstar

Northstar Connect provides private-club and community member websites with
authenticated activity and court reservations.

- Website: https://www.globalnorthstar.com/web/pages/club-reservation-software
- Portal: `https://www.<club-domain>/web/pages/login`
- Provider id: `northstar:<club-domain>` - the club's custom website host without `www`.

## Discover params

Fetch the club login and inspect the response headers and page assets. Northstar
Connect identifies itself in the `Portal` response header and Northstar Liferay
portlets. Public amenity pages can verify the court count and that online
booking exists, but court identifiers and availability remain behind login.
Do not create an account.

```bash
curl -sSIL 'https://www.<club-domain>/web/pages/login'
curl -sSL 'https://www.<club-domain>/web/pages/login'
```

## Calendar support

Northstar offers an integration API, but the club exposes no auth-free
availability endpoint or credentials. The member website supports online court
booking after login and is the viable `matcha-device` path with authentication.
Matcha does not implement Northstar yet; use the root `add-platform` workflow
before changing provider calendar configuration.

## MRN

| | Format |
|---|---|
| Place `mrn` | `northstar:<club-domain>:location/<location-slug>` |
| Resource `mrn` | `…/court/<court-id-or-number>` |

When native ids are hidden by authentication, use the stable facility slug and
courts `1..N` from the verified official inventory.
