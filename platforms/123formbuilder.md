# 123FormBuilder

123FormBuilder hosts public forms that operators can configure as lightweight
reservation sheets. A form can expose dated court choices and remaining-choice
counts without requiring the player to sign in.

- Website: https://www.123formbuilder.com/
- Portal: `https://form.123formbuilder.com/<formId>/<slug>`
- Provider id: `123formbuilder:<formId>` - the numeric public form path segment.

## Discover params

Fetch the public form and locate `data-form-id` and the serialized form data.
Extract verified court labels, dated time choices, per-choice limits and chosen
counts, date constraints, and published reservation rules. The account API
requires an owner token and cannot be used for an operator's form without their
cooperation.

```bash
curl -sSL 'https://form.123formbuilder.com/<formId>/<slug>'
```

## Calendar support

The public form contains dated choice inventory, but it is embedded in a large
serialized form definition rather than a stable availability API. The official
API requires an account token. A WebView can render the public form, observe
available choices, and submit a reservation, so `matcha-device` without
authentication is the preferred integration. Form URLs and date fields may be
replaced seasonally and need rediscovery. Matcha does not implement this path;
use the root `add-platform` workflow before changing provider calendar
configuration.

## MRN

| | Format |
|---|---|
| Place `mrn` | `123formbuilder:<formId>:location/<location-slug>` |
| Resource `mrn` | `…/court/<court-number>` |

Use court numbers published in the form. A court that the form explicitly says
cannot be reserved must not carry the `reservable` tag.
