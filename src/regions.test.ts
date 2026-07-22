import { describe, expect, test } from 'bun:test';
import { PROVIDER_CATALOG } from './providers';
import { REGIONS } from './regions';

describe('region catalog', () => {
  test('assigns every provider to exactly one region', () => {
    const providerIds = REGIONS.flatMap((region) => region.providers);
    expect(new Set(providerIds).size).toBe(providerIds.length);
    expect(providerIds.sort()).toEqual(Object.keys(PROVIDER_CATALOG).sort());
  });

  test('uses unique stable identifiers', () => {
    const ids = REGIONS.map((region) => region.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
