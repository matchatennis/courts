#!/usr/bin/env bun

const C = { bold: "\x1b[1m", dim: "\x1b[2m", reset: "\x1b[0m" };
const fail = (m: string): never => { console.error(m); process.exit(1); };

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? Math.max(1, parseInt(args[limitIdx + 1] ?? "5", 10)) : 5;
  const query = args.filter((a, i) => a !== "--limit" && i !== limitIdx + 1).join(" ").trim();
  if (!query) fail("Usage: find-apple-places <query> [--limit N]");

  const cfgUrl = "https://developer.apple.com/maps/config/developer.apple.com.json";
  const cfg = await (await fetch(cfgUrl)).json() as { token?: string };
  if (!cfg.token) fail("Failed to fetch developer.apple.com MapKit token");

  const bootstrapUrl = "https://cdn.apple-mapkit.com/ma/bootstrap?apiVersion=2&mkjsVersion=5.81.60&poi=1";
  const boot = await (await fetch(bootstrapUrl, {
    headers: { Authorization: `Bearer ${cfg.token}`, Origin: "https://developer.apple.com" },
  })).json() as { authInfo?: { access_token?: string } };
  const accessToken = boot.authInfo?.access_token;
  if (!accessToken) fail("Failed to mint MapKit access token from /ma/bootstrap");

  const searchUrl = new URL("https://api.apple-mapkit.com/v1/search");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("lang", "en");
  searchUrl.searchParams.set("resultTypeFilter", "PointOfInterest,PhysicalFeature");
  const res = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}`, Origin: "https://developer.apple.com" },
  });
  if (!res.ok) fail(`Apple Maps search failed: ${res.status} ${await res.text()}`);

  const json = await res.json() as { results?: Array<{
    id: string; name: string;
    center: { lat: number; lng: number };
    formattedAddressLines?: string[];
    timezone?: string;
    telephone?: string;
    urls?: string[];
    poiCategory?: string;
    placecardUrl?: string;
  }> };
  const results = (json.results ?? []).slice(0, limit);
  if (results.length === 0) { console.error(`No results for "${query}"`); process.exit(0); }

  for (const r of results) {
    console.log(`${C.bold}${r.id}${C.reset}  ${r.name}${r.poiCategory ? `  ${C.dim}[${r.poiCategory}]${C.reset}` : ""}`);
    console.log(`  ${r.center.lat}, ${r.center.lng}  ${C.dim}${r.timezone ?? ""}${C.reset}`);
    for (const line of r.formattedAddressLines ?? []) console.log(`  ${C.dim}${line}${C.reset}`);
    if (r.telephone) console.log(`  ${C.dim}tel:${C.reset} ${r.telephone}`);
    for (const u of r.urls ?? []) console.log(`  ${C.dim}url:${C.reset} ${u}`);
    if (r.placecardUrl) console.log(`  ${C.dim}map:${C.reset} ${r.placecardUrl}`);
    console.log();
  }
}

main();
