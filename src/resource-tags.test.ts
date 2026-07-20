import { describe, expect, test } from 'bun:test';
import { ResourceTag, type PlaceResource } from './domain';
import { recResourceTags } from './resource-tags';

describe('resource tags', () => {
  test('refreshes pickleball without changing other tags', () => {
    const resource: PlaceResource = {
      name: 'Court 1',
      mrn: 'rec:organization:locations/1/courts/2',
      tags: [ResourceTag.Outdoor, ResourceTag.Pickleball],
    };
    expect(recResourceTags(resource, new Set())).toEqual([ResourceTag.Outdoor]);
    expect(recResourceTags(resource, new Set(['2']))).toEqual([
      ResourceTag.Outdoor,
      ResourceTag.Pickleball,
    ]);
  });
});
