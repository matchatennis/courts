#!/usr/bin/env bun
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { PlaceTag, ResourceTag } from "../src/domain";
import { PROVIDERS, type ProviderConfig } from "../src/providers";

const root = new URL("..", import.meta.url).pathname;
const providersDir = join(root, "providers");
const itemsFile = join(root, "items.json");
const indexMdFile = join(root, "INDEX.md");

interface ResourceInput {
  name: string;
  mrn: string;
  tags: ResourceTag[];
}

interface PlaceInput {
  placeId: string;
  applePlaceId: string;
  displayName: string;
  mrn: string;
  timezone: string;
  tags: PlaceTag[];
  coordinate: { lat: number; lng: number };
  provider: { name: string; resources: ResourceInput[] };
}

interface PlaceItem extends Omit<PlaceInput, "provider"> {
  PK: `PLACE#${string}`;
  SK: "PROFILE";
  provider: {
    platform: ProviderConfig["platform"];
    name: string;
    resources: Array<ResourceInput & { slots: [] }>;
  };
}

function fail(where: string, msg: string): never {
  throw new Error(`${where}: ${msg}`);
}

function check(cond: unknown, where: string, msg: string): asserts cond {
  if (!cond) fail(where, msg);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function validateTags(value: unknown, allowed: Set<string>, where: string) {
  check(Array.isArray(value), where, "expected an array");
  check(value.every((tag) => typeof tag === "string" && allowed.has(tag)), where, "contains an invalid tag");
  check(new Set(value).size === value.length, where, "contains a duplicate tag");
}

function validateTimezone(value: unknown, where: string): asserts value is string {
  check(nonEmptyString(value), where, "missing string `timezone`");
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
  } catch {
    fail(where, `invalid timezone \`${value}\``);
  }
}

function validateMrn(mrn: string, providerId: string, pathSegments: number, where: string) {
  const segments = mrn.split(":");
  check(segments.length === 3, where, "expected `platform:organization:path`");
  check(`${segments[0]}:${segments[1]}` === providerId, where, `does not belong to provider \`${providerId}\``);
  const path = segments[2]!.split("/");
  check(path.length === pathSegments && path.every(nonEmptyString), where, `expected ${pathSegments / 2} label/id pair(s)`);
}

const placeTags = new Set<string>(Object.values(PlaceTag));
const resourceTags = new Set<string>(Object.values(ResourceTag));

function validateResource(res: unknown, providerId: string, placeMrn: string, where: string): asserts res is ResourceInput {
  check(isObject(res), where, "expected an object");
  check(nonEmptyString(res.name), where, "missing string `name`");
  check(nonEmptyString(res.mrn), where, "missing string `mrn`");
  check(res.slots === undefined, where, "`slots` is generated at build time");
  check(res.reserveBy === undefined, where, "`reserveBy` is populated at runtime");
  validateTags(res.tags, resourceTags, `${where}.tags`);
  validateMrn(res.mrn, providerId, 4, `${where}.mrn`);
  check(res.mrn.startsWith(`${placeMrn}/`), where, "resource MRN must descend from the place MRN");
}

function validatePlace(place: unknown, providerConfig: ProviderConfig, where: string): asserts place is PlaceInput {
  check(isObject(place), where, "expected an object");
  check(place.PK === undefined, where, "`PK` is generated at build time");
  check(place.SK === undefined, where, "`SK` is generated at build time");
  check(nonEmptyString(place.placeId), where, "missing string `placeId`");
  check(nonEmptyString(place.applePlaceId), where, "missing string `applePlaceId`");
  check(nonEmptyString(place.displayName), where, "missing string `displayName`");
  check(nonEmptyString(place.mrn), where, "missing string `mrn`");
  validateTimezone(place.timezone, where);
  validateTags(place.tags, placeTags, `${where}.tags`);
  validateMrn(place.mrn, providerConfig.id, 2, `${where}.mrn`);

  check(isObject(place.coordinate), `${where}.coordinate`, "expected an object");
  check(typeof place.coordinate.lat === "number" && Number.isFinite(place.coordinate.lat), `${where}.coordinate`, "missing finite number `lat`");
  check(typeof place.coordinate.lng === "number" && Number.isFinite(place.coordinate.lng), `${where}.coordinate`, "missing finite number `lng`");
  check(place.coordinate.lat >= -90 && place.coordinate.lat <= 90, `${where}.coordinate`, "latitude is out of range");
  check(place.coordinate.lng >= -180 && place.coordinate.lng <= 180, `${where}.coordinate`, "longitude is out of range");

  const provider = place.provider;
  check(isObject(provider), `${where}.provider`, "expected an object");
  check(provider.platform === undefined, `${where}.provider`, "`platform` is generated at build time");
  check(nonEmptyString(provider.name), `${where}.provider`, "missing string `name`");
  check(Array.isArray(provider.resources), `${where}.provider`, "missing array `resources`");
  check(provider.resources.length > 0, `${where}.provider`, "must contain at least one resource");
  provider.resources.forEach((res, i) =>
    validateResource(res, providerConfig.id, place.mrn as string, `${where}.provider.resources[${i}]`),
  );
}

function compilePlace(place: PlaceInput, providerConfig: ProviderConfig): PlaceItem {
  return {
    PK: `PLACE#${place.placeId}`,
    SK: "PROFILE",
    placeId: place.placeId,
    applePlaceId: place.applePlaceId,
    displayName: place.displayName,
    coordinate: place.coordinate,
    timezone: place.timezone,
    tags: place.tags,
    mrn: place.mrn,
    provider: {
      platform: providerConfig.platform,
      name: place.provider.name,
      resources: place.provider.resources.map((resource) => ({
        name: resource.name,
        slots: [],
        mrn: resource.mrn,
        tags: resource.tags,
      })),
    },
  };
}

function renderPlacesMd(groups: Map<string, PlaceItem[]>): string {
  const all = [...groups.values()].flat();
  const total = all.length;
  const courts = all.reduce((n, p) => n + p.provider.resources.length, 0);
  const lines: string[] = [
    "# Index",
    "",
    "_Generated by `bun run build` - do not edit by hand._",
    "",
    `${total} places across ${groups.size} providers, ${courts} courts total.`,
    "",
  ];
  for (const [provider, places] of groups) {
    lines.push(`## ${provider}`, "");
    lines.push("| Place | Courts | Tags | Coordinate | Timezone |");
    lines.push("|-------|--------|------|------------|----------|");
    for (const p of places) {
      const coord = `${p.coordinate.lat}, ${p.coordinate.lng}`;
      const tags = p.tags.length ? p.tags.join(", ") : "-";
      lines.push(
        `| ${p.displayName} | ${p.provider.resources.length} | ${tags} | ${coord} | ${p.timezone} |`,
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

const providerDirs = (
  await readdir(providersDir, { withFileTypes: true })
)
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();
console.log(`composing ${providerDirs.length} providers`);

const items: PlaceItem[] = [];
const groups = new Map<string, PlaceItem[]>();
const seenPlaceIds = new Set<string>();
const seenApplePlaceIds = new Set<string>();
const seenPlaceMrns = new Set<string>();
const seenResourceMrns = new Set<string>();
const seenProviders = new Set<string>();
for (const dir of providerDirs) {
  const file = join("providers", dir, "places.json");
  const configFile = join("providers", dir, "config.json");
  const providerDocument = await Bun.file(join(providersDir, dir, "config.json")).json();
  check(isObject(providerDocument) && nonEmptyString(providerDocument.id), configFile, "missing configured provider id");
  const providerConfig = PROVIDERS[providerDocument.id];
  check(providerConfig, configFile, `provider \`${providerDocument.id}\` is missing from the catalog`);
  check(!seenProviders.has(providerConfig.id), configFile, `duplicate provider directory for \`${providerConfig.id}\``);
  seenProviders.add(providerConfig.id);

  const places = await Bun.file(join(providersDir, dir, "places.json")).json();
  check(Array.isArray(places), file, `expected an array of places, got ${typeof places}`);

  places.forEach((place: unknown, i: number) => {
    const where = `${file} places[${i}]`;
    validatePlace(place, providerConfig, where);
    const p = place as PlaceInput;
    check(!seenPlaceIds.has(p.placeId), where, `duplicate placeId \`${p.placeId}\``);
    seenPlaceIds.add(p.placeId);
    check(!seenApplePlaceIds.has(p.applePlaceId), where, `duplicate applePlaceId \`${p.applePlaceId}\``);
    seenApplePlaceIds.add(p.applePlaceId);
    seenPlaceMrns.add(p.mrn);
    for (const resource of p.provider.resources) {
      check(!seenResourceMrns.has(resource.mrn), where, `duplicate resource MRN \`${resource.mrn}\``);
      seenResourceMrns.add(resource.mrn);
    }
    const compiled = compilePlace(p, providerConfig);
    if (!groups.has(providerConfig.id)) groups.set(providerConfig.id, []);
    groups.get(providerConfig.id)!.push(compiled);
    items.push(compiled);
  });

  console.log(`  ${dir}: ${places.length} places`);
}

for (const provider of Object.values(PROVIDERS)) {
  check(seenProviders.has(provider.id), "providers", `configured provider \`${provider.id}\` has no directory`);
  for (const policy of provider.bookingPolicies) {
    for (const placeMrn of policy.places ?? []) {
      check(seenPlaceMrns.has(placeMrn), `${provider.id}/${policy.id}`, `unknown place policy target \`${placeMrn}\``);
    }
    for (const resourceMrn of policy.resources ?? []) {
      check(seenResourceMrns.has(resourceMrn), `${provider.id}/${policy.id}`, `unknown resource policy target \`${resourceMrn}\``);
    }
  }

  if (provider.platform !== "courtreserve" || !provider.calendar.scheduler) continue;
  for (const [schedulerId, scheduler] of Object.entries(provider.calendar.scheduler.configs)) {
    const schedulerMrn = `${provider.id}:scheduler/${schedulerId}`;
    check(seenPlaceMrns.has(schedulerMrn), `${provider.id}/scheduler/${schedulerId}`, "scheduler has no place");
    if (!("courtLabels" in scheduler)) continue;
    check(Array.isArray(scheduler.courtLabels), `${provider.id}/scheduler/${schedulerId}`, "court labels must be an array");
    const labels = new Set(scheduler.courtLabels);
    for (const resourceMrn of seenResourceMrns) {
      const prefix = `${schedulerMrn}/courtlabel/`;
      if (!resourceMrn.startsWith(prefix)) continue;
      const label = resourceMrn.slice(prefix.length);
      check(labels.has(label), `${provider.id}/scheduler/${schedulerId}`, `missing court label \`${label}\``);
    }
  }
}

await Bun.write(itemsFile, JSON.stringify(items, null, 2) + "\n");
console.log(`wrote ${items.length} items to items.json`);

await Bun.write(indexMdFile, renderPlacesMd(groups));
console.log(`wrote INDEX.md`);
