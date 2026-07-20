export type TimestampMs = number;

export enum Platform {
  ActiveNet = 'activenet',
  Amilia = 'amilia',
  CivicRec = 'civicrec',
  ClubAutomation = 'clubautomation',
  CourtReserve = 'courtreserve',
  DudeSolutions = 'dudesolutions',
  Facilitron = 'facilitron',
  Fusion = 'fusion',
  GameTime = 'gametime',
  RacquetDesk = 'racquetdesk',
  Rec = 'rec',
}

export enum PlaceTag {
  Indoor = 'indoor',
  Lighted = 'lighted',
  Outdoor = 'outdoor',
  WalkIn = 'walk-in',
}

export enum ResourceTag {
  Indoor = 'indoor',
  Lighted = 'lighted',
  Outdoor = 'outdoor',
  Pickleball = 'pickleball',
  Reservable = 'reservable',
  WalkIn = 'walk-in',
}

export interface Slot {
  start: number;
  duration: number;
}

export interface AvailableSlot extends Slot {
  state: 'RESERVABLE' | 'EXPIRED';
}

export type MRN = `${Platform}:${string}:${string}`;

export interface PlaceResource {
  name: string;
  mrn: MRN;
  tags?: ResourceTag[];
  reserveBy?: 'range' | 'block';
}

export type PlaceResourceWithSlots = PlaceResource & { slots: AvailableSlot[] };

export interface ProviderProfile {
  platform: Platform;
  name: string;
  resources: PlaceResourceWithSlots[];
}

export interface Place {
  placeId: string;
  applePlaceId: string;
  displayName: string;
  provider: ProviderProfile;
  tags: PlaceTag[];
  coordinate: {
    lat: number;
    lng: number;
  };
  timezone: string;
  mrn: MRN;
}

export interface MrnComponents {
  platform: Platform;
  organization: string;
  provider: string;
  resource: string;
}

export const parseMrn = (mrn: string): MrnComponents => {
  const [platformValue, organization, resource] = mrn.split(':');
  if (!platformValue || !organization || !resource) {
    throw new Error(`Invalid MRN format: ${mrn}. Expected platform:organization:resource`);
  }
  const platform = platformValue as Platform;
  if (!Object.values(Platform).includes(platform)) {
    throw new Error(`Unknown platform in MRN: ${platform}. Expected one of: ${Object.values(Platform).join(', ')}`);
  }
  return { platform, organization, provider: `${platform}:${organization}`, resource };
};

export const parseResourceId = (mrn: string): string => {
  const resourceId = mrn.split('/').at(-1);
  if (!resourceId) {
    throw new Error(`Invalid resource MRN format: ${mrn}. Expected a resource ID`);
  }
  return resourceId;
};
