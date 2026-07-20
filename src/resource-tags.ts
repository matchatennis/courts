import { ResourceTag, type PlaceResource } from './domain';
import { parseResourceId } from './domain';

const REC_PICKLEBALL_SPORT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

export const fetchRecPickleballCourtIds = async (locationId: string): Promise<Set<string>> => {
  const url = `https://api.rec.us/v1/locations/${locationId}?publishedSites=true`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json() as {
    location: { courts: Array<{ id: string; sports?: Array<{ sportId: string }> }> };
  };
  return new Set(
    json.location.courts
      .filter((court) => (court.sports ?? []).some((sport) => sport.sportId === REC_PICKLEBALL_SPORT_ID))
      .map((court) => court.id),
  );
};

export const recResourceTags = (
  resource: PlaceResource,
  pickleballCourtIds: Set<string>,
): ResourceTag[] => {
  const tags = (resource.tags ?? []).filter((tag) => tag !== ResourceTag.Pickleball);
  return pickleballCourtIds.has(parseResourceId(resource.mrn))
    ? [...tags, ResourceTag.Pickleball]
    : tags;
};

export const fetchActiveNetTags = async (
  organization: string,
  resourceId: string,
): Promise<ResourceTag[]> => {
  const url = `https://anc.apm.activecommunities.com/${organization}/rest/reservation/resource/detail/${resourceId}?event_type_ids=&locale=en-US&ui_random=1`;
  const response = await fetch(url, {
    headers: {
      Accept: '*/*',
      'User-Agent': 'Mozilla/5.0',
      'X-Requested-With': 'XMLHttpRequest',
      page_info: '{"page_number":1,"total_records_per_page":20}',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json() as {
    body: {
      resource_detail: {
        general_information: { no_internet_permits: boolean };
        amenities: Array<{ amenity_name: string }>;
      };
    };
  };
  const detail = json.body.resource_detail;
  const tags: ResourceTag[] = [];
  if (detail.amenities.some((amenity) => amenity.amenity_name === 'Lighted Court/Field')) {
    tags.push(ResourceTag.Lighted);
  }
  if (!detail.general_information.no_internet_permits) tags.push(ResourceTag.Reservable);
  return tags;
};
