import activeNetKingCounty from '../providers/activenet-kingcountyparks/config.json';
import activeNetSeattle from '../providers/activenet-seattle/config.json';
import activeNetShoreline from '../providers/activenet-shorelinewa/config.json';
import amiliaRedmond from '../providers/amilia-city-of-redmond/config.json';
import civicRecKirkland from '../providers/civicrec-city-of-kirkland/config.json';
import civicRecBellevue from '../providers/civicrec-wa-bellevue/config.json';
import clubAutomationEdgebrook from '../providers/clubautomation-edgebrook/config.json';
import clubAutomationTcsp from '../providers/clubautomation-tcsp/config.json';
import courtReserve12465 from '../providers/courtreserve-12465/config.json';
import courtReserve17764 from '../providers/courtreserve-17764/config.json';
import courtReserve6689 from '../providers/courtreserve-6689/config.json';
import courtReserve7306 from '../providers/courtreserve-7306/config.json';
import dudeSolutionsBsd405 from '../providers/dudesolutions-bsd405/config.json';
import facilitronLwsd from '../providers/facilitron-lwsd98052/config.json';
import fusionUw from '../providers/fusion-reg.recreation.uw.edu/config.json';
import gameTimeCptc from '../providers/gametime-cptc/config.json';
import racquetDeskEstc from '../providers/racquetdesk-estc/config.json';
import recSanFrancisco from '../providers/rec-sf-rec-park/config.json';
import { Platform, type MRN } from './domain';
import { validateProviderConfigs } from './provider-validation';

export { validateProviderConfig, validateProviderConfigs } from './provider-validation';

export interface AvailabilityWindow { minHours: number; maxHours: number; }

interface Urls {
  signin: string;
  signup: string;
  cancellation: string;
}

export interface ConsolidatedScheduler { costTypeId: string; reservationMinInterval: string; }
export interface ExpandedScheduler {
  costTypeId: string; reservationMinInterval: string; selectedCourtIds: string;
  courtLabels: string[]; slotInterval: number; schedule: { start: string; end: string };
}

export type SchedulerConfig =
  | { type: 'consolidated'; configs: Record<string, ConsolidatedScheduler> }
  | { type: 'expanded'; configs: Record<string, ExpandedScheduler> };

export type CalendarConfig =
  | { type: 'unsupported'; scheduler?: SchedulerConfig }
  | {
      type: 'matcha-device';
      requiresAuthentication: boolean;
      availabilityWindow: AvailabilityWindow;
      requestsPerMinute: number;
      scheduler?: SchedulerConfig;
    }
  | {
      type: 'matcha-server';
      notifications: boolean;
      availabilityWindow: AvailabilityWindow;
      requestsPerMinute: number;
      scheduler?: SchedulerConfig;
    };

type MatchaServerCalendar = Extract<CalendarConfig, { type: 'matcha-server' }>;

interface BookingPolicyTarget {
  id: string;
  places?: MRN[];
  resources?: MRN[];
  minAdvance: 'next-day' | `${number}:${number}`;
  description?: string;
  phone?: string;
}

interface MatchaBookingPolicyFields {
  confirmationNotice?: string;
  cancellationUrl?: string;
  savedCardCvv?: boolean;
}

type ProviderBookingPolicyFields =
  | { type: 'provider'; url: string; reserveBy: 'range'; minDuration: string; maxDuration: string }
  | { type: 'provider'; url: string; reserveBy: 'block' };

export type BookingPolicy = BookingPolicyTarget & (
  | (MatchaBookingPolicyFields & {
      type: 'matcha-device';
      reserveBy: 'range';
      minDuration: string;
      maxDuration: string;
    })
  | (MatchaBookingPolicyFields & {
      type: 'matcha-device';
      reserveBy: 'block';
    })
  | ProviderBookingPolicyFields
  | { type: 'phone'; number: string }
  | { type: 'unsupported' }
);

interface ProviderLocation { city: string; state: string; }

interface BaseProvider {
  id: string;
  name: string;
  location: ProviderLocation;
  urls: Urls;
  calendar: CalendarConfig;
  bookingPolicies: BookingPolicy[];
}

type StandardProvider = BaseProvider & {
  platform: Exclude<Platform, Platform.RacquetDesk>;
};

interface RacquetDeskProvider extends Omit<BaseProvider, 'calendar'> {
  platform: Platform.RacquetDesk;
  calendar: MatchaServerCalendar & { courtSheetId: string } | { type: 'unsupported' };
}

export type ProviderConfig = StandardProvider | RacquetDeskProvider;

const providerConfigs: unknown = [
  activeNetKingCounty,
  activeNetSeattle,
  activeNetShoreline,
  amiliaRedmond,
  civicRecKirkland,
  civicRecBellevue,
  clubAutomationEdgebrook,
  clubAutomationTcsp,
  courtReserve12465,
  courtReserve17764,
  courtReserve6689,
  courtReserve7306,
  dudeSolutionsBsd405,
  facilitronLwsd,
  fusionUw,
  gameTimeCptc,
  racquetDeskEstc,
  recSanFrancisco,
];
validateProviderConfigs(providerConfigs);
const ALL: ProviderConfig[] = providerConfigs;

export const resolveBookingPolicy = (
  provider: ProviderConfig,
  placeMrn?: string,
  resourceMrn?: string,
): BookingPolicy => {
  const resourcePolicy = resourceMrn
    ? provider.bookingPolicies.find((policy) => policy.resources?.includes(resourceMrn as MRN))
    : undefined;
  if (resourcePolicy) return resourcePolicy;

  const placePolicy = placeMrn
    ? provider.bookingPolicies.find((policy) => policy.places?.includes(placeMrn as MRN))
    : undefined;
  if (placePolicy) return placePolicy;

  return provider.bookingPolicies.find((policy) => !policy.places && !policy.resources)!;
};

export const PROVIDERS: Record<string, ProviderConfig> = Object.fromEntries(
  ALL.map((p) => [p.id, p]),
);

export const PROVIDER_CATALOG: Record<string, ProviderConfig> = PROVIDERS;

export const PROVIDER_IDS = ALL.map((p) => p.id);
