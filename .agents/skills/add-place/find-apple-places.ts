#!/usr/bin/env bun

const C = { bold: "\x1b[1m", dim: "\x1b[2m", reset: "\x1b[0m" };
const fail = (m: string): never => { console.error(m); process.exit(1); };

type Coordinate = { lat: number; lng: number };
type ApplePlace = {
  id?: string;
  name: string;
  center: Coordinate;
  formattedAddressLines?: string[];
  timezone?: string;
  telephone?: string;
  urls?: string[];
  poiCategory?: string;
  placecardUrl?: string;
};

const positiveNumber = (value: string | undefined, option: string): number => {
  const parsed = Number(value);
  if (!value || !Number.isFinite(parsed) || parsed <= 0) fail(`${option} requires a positive number`);
  return parsed;
};

const distanceKm = (a: Coordinate, b: Coordinate): number => {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latDelta = radians(b.lat - a.lat);
  const lngDelta = radians(b.lng - a.lng);
  const latA = radians(a.lat);
  const latB = radians(b.lat);
  const haversine = Math.sin(latDelta / 2) ** 2
    + Math.cos(latA) * Math.cos(latB) * Math.sin(lngDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

async function main() {
  const args = process.argv.slice(2);
  const queryParts: string[] = [];
  let limit = 5;
  let near: string | undefined;
  let radiusKm = 2;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--limit") limit = positiveNumber(args[++i], "--limit");
    else if (arg === "--near") near = args[++i] || fail("--near requires a quoted address");
    else if (arg === "--radius-km") radiusKm = positiveNumber(args[++i], "--radius-km");
    else if (arg.startsWith("--")) fail(`Unknown option: ${arg}`);
    else queryParts.push(arg);
  }
  const query = queryParts.join(" ").trim();
  if (!query) fail("Usage: find-apple-places <query> [--near <address>] [--radius-km N] [--limit N]");
  if (args.includes("--radius-km") && !near) fail("--radius-km requires --near");

  const cfgUrl = "https://developer.apple.com/maps/config/developer.apple.com.json";
  const cfg = await (await fetch(cfgUrl)).json() as { token?: string };
  if (!cfg.token) fail("Failed to fetch developer.apple.com MapKit token");

  const bootstrapUrl = "https://cdn.apple-mapkit.com/ma/bootstrap?apiVersion=2&mkjsVersion=5.81.60&poi=1";
  const boot = await (await fetch(bootstrapUrl, {
    headers: { Authorization: `Bearer ${cfg.token}`, Origin: "https://developer.apple.com" },
  })).json() as { authInfo?: { access_token?: string } };
  const accessToken = boot.authInfo?.access_token;
  if (!accessToken) fail("Failed to mint MapKit access token from /ma/bootstrap");

  let expectedPlace: ApplePlace | undefined;
  if (near) {
    const geocodeUrl = new URL("https://api.apple-mapkit.com/v1/geocode");
    geocodeUrl.searchParams.set("q", near);
    geocodeUrl.searchParams.set("lang", "en");
    const geocodeRes = await fetch(geocodeUrl, {
      headers: { Authorization: `Bearer ${accessToken}`, Origin: "https://developer.apple.com" },
    });
    if (!geocodeRes.ok) fail(`Apple Maps geocoding failed: ${geocodeRes.status} ${await geocodeRes.text()}`);
    const geocodeJson = await geocodeRes.json() as { results?: ApplePlace[] };
    expectedPlace = geocodeJson.results?.[0];
    if (!expectedPlace) fail(`Apple Maps could not geocode nearby address "${near}"`);
    console.log(`${C.bold}Expected location${C.reset}  ${(expectedPlace.formattedAddressLines ?? [expectedPlace.name]).join(", ")}`);
    console.log(`  ${expectedPlace.center.lat}, ${expectedPlace.center.lng}  ${C.dim}within ${radiusKm} km${C.reset}\n`);
  }

  const searchUrl = new URL("https://api.apple-mapkit.com/v1/search");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("lang", "en");
  searchUrl.searchParams.set("resultTypeFilter", "PointOfInterest,PhysicalFeature");
  if (expectedPlace) searchUrl.searchParams.set("searchLocation", `${expectedPlace.center.lat},${expectedPlace.center.lng}`);
  const res = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}`, Origin: "https://developer.apple.com" },
  });
  if (!res.ok) fail(`Apple Maps search failed: ${res.status} ${await res.text()}`);

  const json = await res.json() as { results?: ApplePlace[] };
  const results = (json.results ?? []).slice(0, limit);
  if (results.length === 0) { console.error(`No results for "${query}"`); process.exit(0); }

  let nearbyResults = 0;
  for (const r of results) {
    console.log(`${C.bold}${r.id}${C.reset}  ${r.name}${r.poiCategory ? `  ${C.dim}[${r.poiCategory}]${C.reset}` : ""}`);
    console.log(`  ${r.center.lat}, ${r.center.lng}  ${C.dim}${r.timezone ?? ""}${C.reset}`);
    if (expectedPlace) {
      const km = distanceKm(expectedPlace.center, r.center);
      const nearby = km <= radiusKm;
      if (nearby) nearbyResults++;
      console.log(`  ${km.toFixed(2)} km from expected address  ${nearby ? "NEARBY" : `OUTSIDE ${radiusKm} KM`}`);
    }
    for (const line of r.formattedAddressLines ?? []) console.log(`  ${C.dim}${line}${C.reset}`);
    if (r.telephone) console.log(`  ${C.dim}tel:${C.reset} ${r.telephone}`);
    for (const u of r.urls ?? []) console.log(`  ${C.dim}url:${C.reset} ${u}`);
    if (r.placecardUrl) console.log(`  ${C.dim}map:${C.reset} ${r.placecardUrl}`);
    console.log();
  }

  if (expectedPlace && nearbyResults === 0) fail(`No Apple Maps result was within ${radiusKm} km of "${near}"`);
}

main();
