import activeNetKingCounty from '../../providers/activenet-kingcountyparks/config.json';
import activeNetSeattle from '../../providers/activenet-seattle/config.json';
import activeNetShoreline from '../../providers/activenet-shorelinewa/config.json';
import amiliaRedmond from '../../providers/amilia-city-of-redmond/config.json';
import civicRecKirkland from '../../providers/civicrec-city-of-kirkland/config.json';
import civicRecBellevue from '../../providers/civicrec-wa-bellevue/config.json';
import clubAutomationEdgebrook from '../../providers/clubautomation-edgebrook/config.json';
import clubAutomationTcsp from '../../providers/clubautomation-tcsp/config.json';
import courtReserve12465 from '../../providers/courtreserve-12465/config.json';
import courtReserve17764 from '../../providers/courtreserve-17764/config.json';
import courtReserve6689 from '../../providers/courtreserve-6689/config.json';
import courtReserve7306 from '../../providers/courtreserve-7306/config.json';
import dudeSolutionsBsd405 from '../../providers/dudesolutions-bsd405/config.json';
import facilitronLwsd from '../../providers/facilitron-lwsd98052/config.json';
import fusionUw from '../../providers/fusion-reg.recreation.uw.edu/config.json';
import gameTimeCptc from '../../providers/gametime-cptc/config.json';
import racquetDeskEstc from '../../providers/racquetdesk-estc/config.json';
import recSanFrancisco from '../../providers/rec-sf-rec-park/config.json';
import { Platform, type MRN } from '../domain';
import { validateProviderConfigs, validateProviderFacts } from './validation';

export { validateProviderConfig, validateProviderConfigs, validateProviderFacts } from './validation';

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

export interface ProviderFacts {
  id: string;
  platform: Platform;
  name: string;
  location: ProviderLocation;
  urls: Urls;
  reservationWindow: AvailabilityWindow;
}

interface BaseProvider {
  id: string;
  name: string;
  location: ProviderLocation;
  urls: Urls;
  calendar: CalendarConfig;
  bookingPolicies: BookingPolicy[];
}

interface ActiveNetProvider extends BaseProvider { platform: Platform.ActiveNet; }
interface RecProvider extends BaseProvider { platform: Platform.Rec; }
interface ClubAutomationProvider extends BaseProvider { platform: Platform.ClubAutomation; }
interface CivicRecProvider extends BaseProvider { platform: Platform.CivicRec; }
interface DudeSolutionsProvider extends BaseProvider { platform: Platform.DudeSolutions; }
interface FusionProvider extends BaseProvider { platform: Platform.Fusion; }
interface CourtReserveProvider extends BaseProvider { platform: Platform.CourtReserve; }

export type ProviderConfig =
  | ActiveNetProvider
  | RecProvider
  | CourtReserveProvider
  | ClubAutomationProvider
  | CivicRecProvider
  | DudeSolutionsProvider
  | FusionProvider;

const providerConfigs: unknown = [
  activeNetSeattle,
  activeNetShoreline,
  civicRecBellevue,
  clubAutomationEdgebrook,
  clubAutomationTcsp,
  courtReserve12465,
  courtReserve17764,
  courtReserve6689,
  courtReserve7306,
  dudeSolutionsBsd405,
  fusionUw,
  recSanFrancisco,
];
validateProviderConfigs(providerConfigs);
const ALL: ProviderConfig[] = providerConfigs;

const providerFacts: unknown = [
  activeNetKingCounty,
  amiliaRedmond,
  civicRecKirkland,
  facilitronLwsd,
  gameTimeCptc,
  racquetDeskEstc,
];
if (!Array.isArray(providerFacts)) throw new Error('provider facts must be an array');
for (const provider of providerFacts) validateProviderFacts(provider);
const FACTS: ProviderFacts[] = providerFacts;

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

const CATALOG = [...ALL, ...FACTS];
if (new Set(CATALOG.map((provider) => provider.id)).size !== CATALOG.length) {
  throw new Error('duplicate provider id in catalog');
}

export const PROVIDER_CATALOG: Record<string, ProviderConfig | ProviderFacts> = Object.fromEntries(
  CATALOG.map((provider) => [provider.id, provider]),
);

export const PROVIDER_IDS = ALL.map((p) => p.id);
