# West Coast Expansion Research

Survey of West Coast tennis court reservation deployments across the three booking provider systems Matcha currently supports: **ActiveNet** (Active Network / `apm.activecommunities.com`), **Rec.us** (`rec.us`), and **CourtReserve** (`app.courtreserve.com` / `courtreserve.com`). The goal is to identify cities where the existing provider integrations could light up a new market with little or no additional engineering.

## Methodology

- Web searches were scoped per-provider with site filters (`site:apm.activecommunities.com`, `site:rec.us`, `site:courtreserve.com`) plus city / region keywords.
- Followed parks-and-rec landing pages to confirm which booking portal they actually link to (vs. just a phone number or generic "online registration" claim).
- Only verified deployments are listed. When a city's booking system is genuinely unclear from public sources it is called out as a gap.
- Booking subdomains/slugs are captured because they're how the iOS booking flow targets each tenant.

## California

### San Francisco Bay Area

| City / Org | Provider | Booking URL |
|---|---|---|
| SF Recreation & Parks (152 public courts, ~28 reservable) | Rec.us | https://www.rec.us/sfrecpark |
| Goldman Tennis Center (Golden Gate Park, run by Lifetime Activities) | CourtReserve | `app.courtreserve.com/Online/Portal/Index/12465` |
| Lifetime Activities — Cupertino | CourtReserve | `app.courtreserve.com/Online/Portal/Index/13229` |
| Lifetime Activities — Sunnyvale | CourtReserve | `app.courtreserve.com/Online/Portal/Index/13233` |
| Lifetime Activities — Santa Clara | CourtReserve | `app.courtreserve.com/Online/Portal/Index/13234` |
| Lifetime Activities — Walnut Creek | CourtReserve | `app.courtreserve.com/Online/Portal/Index/13230` |
| Lifetime Activities — Pleasanton | CourtReserve | `app.courtreserve.com/Online/Portal/Index/13206` |
| City of Palo Alto | ActiveNet | https://apm.activecommunities.com/paloalto/facility_search |
| City of San Jose Parks & Rec | ActiveNet | https://anc.apm.activecommunities.com/sanjoseparksandrec/reservation/search |
| City of Fremont | ActiveNet | https://anc.apm.activecommunities.com/fremont/reservation/landing |
| City of Cupertino (parks/rec, separate from Lifetime Activities tennis center) | ActiveNet | https://apm.activecommunities.com/cupertino/Reserve_Options |
| Hayward Area Recreation & Park District | ActiveNet | https://apm.activecommunities.com/haywardrec |
| Redwood City Parks & Rec | ActiveNet | https://anc.apm.activecommunities.com/rwcpark |
| City of Emeryville | Rec.us | https://www.rec.us/emeryville |
| City of Piedmont | Rec.us | http://rec.us/piedmont |
| City of Corte Madera | Rec.us | https://www.rec.us/cortemadera |
| City of Oakland (Davie Tennis Stadium + city courts) | PerfectMind (NOT supported) | https://cityofoakland.perfectmind.com |
| City of Berkeley | CivicRec (NOT supported) | https://rec.berkeleyca.gov/ |

### Sacramento / Central Valley

| City / Org | Provider | Booking URL |
|---|---|---|
| City of Sacramento (YPCE) | ActiveNet | https://anc.apm.activecommunities.com/cityofsacparksandrec |
| City of Rocklin | Rec.us | https://www.rec.us/rocklin |

Gap: Sacramento County / Sunrise Recreation & Park District / Mission Oaks portals were not confirmed on a supported provider in this pass.

### Los Angeles / Southern California

| City / Org | Provider | Booking URL |
|---|---|---|
| City of Santa Monica Recreation | ActiveNet | https://apm.activecommunities.com/santamonicarecreation/Home |
| City of Inglewood Parks & Rec | ActiveNet | https://anc.apm.activecommunities.com/inglewoodparkrec |
| City of Manhattan Beach | ActiveNet | https://apm.activecommunities.com/citymb |
| City of Long Beach Parks (Recreation Class Reg; tennis center bookings still go through phone) | ActiveNet | https://apm.activecommunities.com/lbparks/Home |
| City of Buena Park | ActiveNet | https://anc.apm.activecommunities.com/buenapark |
| City of Newport Beach | ActiveNet | https://anc.apm.activecommunities.com/cnbreg |
| LA County Parks & Recreation | ActiveNet | https://anc.apm.activecommunities.com/losangelescounty |
| City of Torrance | Rec.us | https://torrance.rec.us/ |
| City of LA Dept. of Recreation & Parks (Pay Tennis / open-play permits) | Webtrac (NOT supported) | recreation.parks.lacity.gov/sports/tennis/permits |

Gap: Pasadena, West Hollywood (uses i-tennis.com, a separate vendor), Beverly Hills not confirmed on a supported provider.

### San Diego

| City / Org | Provider | Booking URL |
|---|---|---|
| City of San Diego Parks & Rec (Cabrillo, etc.) | ActiveNet | https://apm.activecommunities.com/sdparkandrec |
| La Jolla Beach & Tennis Club | CourtReserve | (private, CourtReserve case-study customer) |
| Balboa Tennis Club (Balboa Park) | CourtReserve | (CourtReserve case-study customer) |

Gap: Carlsbad, Encinitas, Coronado not confirmed.

## Oregon

### Portland Metro

| City / Org | Provider | Booking URL |
|---|---|---|
| Portland Parks & Recreation (incl. Portland Tennis Center, all PP&R outdoor courts) | ActiveNet (per Portland.gov: "Court reservations and tennis activities are now on ActiveNet") | https://anc.apm.activecommunities.com/portlandparks (slug per PP&R announcement) |
| City of Lake Oswego — Indoor Tennis Center | CourtReserve | https://app.courtreserve.com/ (LOITC tenant; rec/programs separately on ActiveNet at `apm.activecommunities.com/lakeoswegoparks`) |
| City of Lake Oswego — outdoor / programs | ActiveNet | https://apm.activecommunities.com/lakeoswegoparks |

Gap: Tualatin Hills Park & Rec District (Babette Horenstein Tennis Center) reservation system not confirmed.

## Washington

### Seattle Metro

| City / Org | Provider | Booking URL |
|---|---|---|
| Seattle Parks & Recreation (Amy Yee Tennis Center + 100+ outdoor courts, all dual-stripe pickleball/tennis citywide) | ActiveNet | https://anc.apm.activecommunities.com/seattle |
| City of Bellevue — Robinswood Tennis Center | Phone only (no supported online portal verified) | n/a |

Gap: Tacoma, Spokane, Kirkland (Eastside Tennis Center), Redmond — public-side rec dept tennis booking systems not confirmed on a supported provider in this pass. Several area indoor centers (Gorin Tennis, Central Park Tennis Club) appear to use proprietary booking.

## Summary & Recommendations

### Provider concentration by region

- **ActiveNet dominates municipal parks-and-rec** across the entire West Coast. It's the safest bet for unlocking new cities at municipal scale: SF Bay Area (Palo Alto, San Jose, Fremont, Cupertino, Hayward, Redwood City), Sacramento, all of South Bay LA (Santa Monica, Manhattan Beach, Long Beach, Inglewood, Newport Beach, LA County), San Diego City, Portland PP&R, and Seattle Parks. A single working ActiveNet integration unlocks ~15 new cities on this list alone.
- **Rec.us** is the smaller-but-growing modern competitor. Already in SF, Emeryville, Piedmont, Corte Madera, Rocklin, Torrance. Geographically scattered; no dense cluster yet outside the Bay Area.
- **CourtReserve** is the SaaS for private clubs and a few municipal indoor centers. The standout cluster is **Lifetime Activities** — six Bay Area facilities (Cupertino, Sunnyvale, Santa Clara, Walnut Creek, Pleasanton, plus SF's Goldman) all on CourtReserve with a consistent URL pattern. Plus La Jolla Beach & Tennis, Balboa Tennis Club (San Diego), and Lake Oswego Indoor Tennis Center.

### Recommended rollout priority

1. **Bay Area expansion via existing CourtReserve integration** — Lifetime Activities runs six high-volume facilities on the same CourtReserve template the app already supports. Lowest possible engineering cost: just add tenant IDs (12465, 13206, 13229, 13230, 13233, 13234).
2. **South Bay / Peninsula via ActiveNet** — Palo Alto, San Jose, Fremont, Cupertino, Redwood City, Hayward all on ActiveNet. Dense cluster around existing SF user base = easiest network-effect rollout once ActiveNet booking is solid.
3. **Seattle Parks via ActiveNet** — Single tenant (`/seattle`) covers 100+ outdoor courts plus AYTC. Highest court-count-per-tenant on the list.
4. **Portland Parks via ActiveNet** — Single tenant covers all PP&R public courts including the indoor Portland Tennis Center.
5. **LA South Bay via ActiveNet** — Santa Monica, Manhattan Beach, Inglewood, Long Beach, Newport Beach, LA County. Multiple smaller tenants but consistent stack. Note: City of LA proper uses Webtrac (unsupported), so the LA market is fragmented.
6. **San Diego via mix** — City of San Diego on ActiveNet plus two marquee CourtReserve clubs (La Jolla B&T, Balboa Tennis Club).

### Notable unsupported systems blocking specific markets

- **Webtrac (Vermont Systems)** — City of LA Pay Tennis. Significant gap given LA's size.
- **PerfectMind** — City of Oakland (incl. Davie Tennis Stadium).
- **CivicRec** — City of Berkeley.
- **i-tennis.com** — West Hollywood and several other smaller SoCal cities.

If Matcha wants meaningful LA + East Bay coverage, adding Webtrac and PerfectMind providers is the highest-leverage next investment after the providers listed above.
