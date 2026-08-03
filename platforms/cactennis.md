# Court Ace

Court Ace hosts the ACE online tennis court booking system on club-specific
domains, including tenants on `cactennis.com` and custom club hosts. Court
availability and booking require a member login.

- Website: https://courtacellc.com/
- Portal: `https://<club-host>/`
- Provider id: `cactennis:<club-host>` - the exact booking host for the club.

## Discover params

Open the public login and `/pages/rules` pages. The title identifies ACE Tennis
Court Management, while the rules expose booking windows, duration rules,
waitlists, and cancellation policy. The unauthenticated site does not expose a
court list or stable resource ids. Do not create an account; use deterministic
court ids only when an official club inventory verifies the exact count.

```bash
curl -sSIL 'https://<club-host>/'
curl -sSL 'https://<club-host>/pages/rules'
```

## Calendar support

No auth-free JSON availability endpoint is exposed. The login-gated browser
calendar is the viable integration path and should be evaluated as
`matcha-device` with authentication. Matcha does not implement Court Ace yet;
use the root `add-platform` workflow before changing provider calendar
configuration.

## MRN

| | Format |
|---|---|
| Place `mrn` | `cactennis:<club-host>:location/<location-slug>` |
| Resource `mrn` | `…/court/<court-id-or-number>` |

Preserve published indoor and outdoor splits in synthetic ids such as
`indoor-1` and `outdoor-1`.
