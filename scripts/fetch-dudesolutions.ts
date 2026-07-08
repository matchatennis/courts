#!/usr/bin/env bun

const HANDLER = "https://events.dudesolutions.com/handlers/query.ashx";

export interface Interval {
  start: string;
  end: string;
}

interface Event extends Interval {
  title: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseEvents(html: string): Event[] {
  const events: Event[] = [];
  for (const block of html.split('itemtype="http://schema.org/Event"').slice(1)) {
    const name = block.match(/itemprop="name"[^>]*>(?:<a[^>]*>)?([^<]+)/)?.[1];
    const start = block.match(/itemprop="startDate"[^>]*datetime="([^"]+)"/)?.[1];
    const end = block.match(/itemprop="endDate"[^>]*datetime="([^"]+)"/)?.[1];
    if (!name || !start || !end) continue;
    events.push({ start, end, title: decodeEntities(name.trim()) });
  }
  return events;
}

async function fetchEvents(org: string, locationGuid: string): Promise<Event[]> {
  const params = new URLSearchParams({
    tenant: org,
    site: "fields",
    get: "eventlist",
    page: "0",
    pageSize: "-1",
    total: "-1",
    view: "list.xslt",
    location: locationGuid,
  });
  const res = await fetch(`${HANDLER}?${params}`, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Referer: `https://events.dudesolutions.com/${org}/site/fields/`,
    },
  });
  if (!res.ok) throw new Error(`[dudesolutions] ${org}/${locationGuid}: HTTP ${res.status}`);
  const raw = (await res.text()).trim();
  const { html } = JSON.parse(raw.startsWith("(") ? raw.slice(1, -1) : raw) as { html: string };
  return parseEvents(decodeEntities(html));
}

export function subtract(open: Interval[], blocked: Interval[]): Interval[] {
  const cuts = blocked
    .map((b) => ({ start: +new Date(b.start), end: +new Date(b.end) }))
    .sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const window of open) {
    let segments = [{ start: +new Date(window.start), end: +new Date(window.end) }];
    for (const cut of cuts) {
      segments = segments.flatMap((s) => {
        if (cut.end <= s.start || cut.start >= s.end) return [s];
        const parts: { start: number; end: number }[] = [];
        if (cut.start > s.start) parts.push({ start: s.start, end: cut.start });
        if (cut.end < s.end) parts.push({ start: cut.end, end: s.end });
        return parts;
      });
    }
    for (const s of segments) {
      out.push({ start: new Date(s.start).toISOString(), end: new Date(s.end).toISOString() });
    }
  }
  return out;
}

export async function fetchCourtAvailability(
  org: string,
  publicUseGuid: string,
  courtGuid: string,
): Promise<Interval[]> {
  console.log(`[dudesolutions] ${org}: public=${publicUseGuid} court=${courtGuid}`);
  const [open, reservations] = await Promise.all([
    fetchEvents(org, publicUseGuid),
    fetchEvents(org, courtGuid),
  ]);
  const available = subtract(open, reservations);
  console.log(
    `[dudesolutions] ${org}/${courtGuid}: ${open.length} public windows - ${reservations.length} reservations = ${available.length} open slots`,
  );
  return available;
}

if (import.meta.main) {
  const [org, publicUseGuid, courtGuid] = process.argv.slice(2);
  if (!org || !publicUseGuid || !courtGuid) {
    console.error("usage: bun scripts/fetch-dudesolutions.ts <org> <publicUseGuid> <courtGuid>");
    process.exit(1);
  }
  const slots = await fetchCourtAvailability(org, publicUseGuid, courtGuid);
  console.log(JSON.stringify(slots.slice(0, 8), null, 2));
}
