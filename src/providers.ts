import formBuilderMercerwood from '../providers/123formbuilder-6956773/config.json';
import activeNetKingCounty from '../providers/activenet-kingcountyparks/config.json';
import activeNetCupertino from '../providers/activenet-cupertino/config.json';
import activeNetMilpitas from '../providers/activenet-milpitasrec/config.json';
import activeNetSeattle from '../providers/activenet-seattle/config.json';
import activeNetSanJose from '../providers/activenet-sanjoseparksandrec/config.json';
import activeNetShoreline from '../providers/activenet-shorelinewa/config.json';
import amiliaRedmond from '../providers/amilia-city-of-redmond/config.json';
import cacTennisMercerIslandCountryClub from '../providers/cactennis-tennis.mercerislandcc.com/config.json';
import civicRecKirkland from '../providers/civicrec-city-of-kirkland/config.json';
import civicRecBellevue from '../providers/civicrec-wa-bellevue/config.json';
import clubAutomationEdgebrook from '../providers/clubautomation-edgebrook/config.json';
import clubAutomationTcsp from '../providers/clubautomation-tcsp/config.json';
import clubessentialMercerIslandBeachClub from '../providers/clubessential-mibeachclub.com/config.json';
import courtReserve12465 from '../providers/courtreserve-12465/config.json';
import courtReserve13233 from '../providers/courtreserve-13233/config.json';
import courtReserve13234 from '../providers/courtreserve-13234/config.json';
import courtReserve17764 from '../providers/courtreserve-17764/config.json';
import courtReserve6689 from '../providers/courtreserve-6689/config.json';
import courtReserve7306 from '../providers/courtreserve-7306/config.json';
import courtReserve9459 from '../providers/courtreserve-9459/config.json';
import dudeSolutionsBsd405 from '../providers/dudesolutions-bsd405/config.json';
import facilitronLwsd from '../providers/facilitron-lwsd98052/config.json';
import fusionUw from '../providers/fusion-reg.recreation.uw.edu/config.json';
import gameTimeCptc from '../providers/gametime-cptc/config.json';
import gameTimeStc from '../providers/gametime-stc/config.json';
import manualSeattleParks from '../providers/manual-seattleparks/config.json';
import manualSeattleU from '../providers/manual-seattleu/config.json';
import manualCampbell from '../providers/manual-campbell/config.json';
import manualDeAnzaCollege from '../providers/manual-de-anza-college/config.json';
import manualFoothillCollege from '../providers/manual-foothill-college/config.json';
import manualLosAltos from '../providers/manual-los-altos/config.json';
import manualSanJoseSwimRacquet from '../providers/manual-sjsrc/config.json';
import manualSanJoseState from '../providers/manual-sjsu/config.json';
import manualWestValleyCollege from '../providers/manual-west-valley-college/config.json';
import manualMercerIslandSchoolDistrict from '../providers/manual-mercer-island-school-district/config.json';
import manualOverlakeSchool from '../providers/manual-overlake-school/config.json';
import northstarTrilogyRedmondRidge from '../providers/northstar-mytrilogyredmondridge.com/config.json';
import mindbodyMountainViewTennis from '../providers/mindbody-mountain-view-tennis/config.json';
import perfectMindMercerIsland from '../providers/perfectmind-23494/config.json';
import perfectMindLosGatosSaratoga from '../providers/perfectmind-22167/config.json';
import racquetDeskEstc from '../providers/racquetdesk-estc/config.json';
import recSanFrancisco from '../providers/rec-sf-rec-park/config.json';
import recMountainView from '../providers/rec-city-of-mountain-view/config.json';
import { Platform, type MRN } from './domain';
import { validateProviderConfigs } from './provider-validation';

export { validateProviderConfig, validateProviderConfigs } from './provider-validation';

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

export interface MindbodyAppointmentConfig {
  widgetId: string;
  locationId: string;
  serviceId: string;
  staffId: string;
  durationMinutes: number;
}

export type CalendarConfig =
  | { type: 'unsupported' }
  | {
      type: 'matcha-device';
      requiresAuthentication: boolean;
    }
  | {
      type: 'matcha-server';
      notifications: boolean;
      requestsPerMinute: number;
    };

type MatchaServerCalendar = Extract<CalendarConfig, { type: 'matcha-server' }>;

export type Advance = 'next-day' | `${number}:${number}`;

export type BookingPolicy = {
  id: string;
  places?: MRN[];
  resources?: MRN[];
  minAdvance: Advance;
  maxAdvance?: Advance;
  description?: string;
  phone?: string;
} & (
  | {
      type: 'matcha-device';
      reserveBy: 'range';
      minDuration: string;
      maxDuration: string;
      confirmationNotice?: string;
      cancellationUrl?: string;
      savedCardCvv?: boolean;
    }
  | {
      type: 'matcha-device';
      reserveBy: 'block';
      confirmationNotice?: string;
      cancellationUrl?: string;
      savedCardCvv?: boolean;
    }
  | { type: 'provider'; url: string; reserveBy: 'range'; minDuration: string; maxDuration: string }
  | { type: 'provider'; url: string; reserveBy: 'block' }
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
  platform: Exclude<Platform, Platform.CourtReserve | Platform.Mindbody | Platform.PerfectMind | Platform.RacquetDesk>;
};

interface CourtReserveProvider extends BaseProvider {
  platform: Platform.CourtReserve;
  scheduler?: SchedulerConfig;
}

interface MindbodyProvider extends BaseProvider {
  platform: Platform.Mindbody;
  appointments?: Record<string, MindbodyAppointmentConfig>;
}

interface PerfectMindProvider extends BaseProvider {
  platform: Platform.PerfectMind;
  host?: string;
}

interface RacquetDeskProvider extends BaseProvider {
  platform: Platform.RacquetDesk;
  calendar: MatchaServerCalendar | { type: 'unsupported' };
  courtSheetId?: string;
}

export type ProviderConfig = StandardProvider | CourtReserveProvider | MindbodyProvider | PerfectMindProvider | RacquetDeskProvider;

const advanceFetchDays = (advance: Advance): number | null => {
  if (advance === 'next-day') return 2;
  const match = /^(\d+):(\d{2})$/.exec(advance);
  if (!match || Number(match[2]) >= 60) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return Math.ceil(minutes / (24 * 60));
};

export const providerFetchDays = (provider: ProviderConfig): number => {
  const days = provider.bookingPolicies.flatMap((policy) => {
    if (policy.maxAdvance === undefined) return [];
    const parsed = advanceFetchDays(policy.maxAdvance);
    return parsed === null ? [] : [parsed];
  });
  if (days.length === 0) throw new Error(`${provider.id}: maximum advance is required for calendar availability`);
  return Math.max(...days);
};

const providerConfigs: unknown = [
  formBuilderMercerwood,
  activeNetCupertino,
  activeNetKingCounty,
  activeNetMilpitas,
  activeNetSeattle,
  activeNetSanJose,
  activeNetShoreline,
  amiliaRedmond,
  cacTennisMercerIslandCountryClub,
  civicRecKirkland,
  civicRecBellevue,
  clubAutomationEdgebrook,
  clubAutomationTcsp,
  clubessentialMercerIslandBeachClub,
  courtReserve12465,
  courtReserve13233,
  courtReserve13234,
  courtReserve17764,
  courtReserve6689,
  courtReserve7306,
  courtReserve9459,
  dudeSolutionsBsd405,
  facilitronLwsd,
  fusionUw,
  gameTimeCptc,
  gameTimeStc,
  manualSeattleParks,
  manualSeattleU,
  manualCampbell,
  manualDeAnzaCollege,
  manualFoothillCollege,
  manualLosAltos,
  manualSanJoseSwimRacquet,
  manualSanJoseState,
  manualWestValleyCollege,
  manualMercerIslandSchoolDistrict,
  manualOverlakeSchool,
  northstarTrilogyRedmondRidge,
  mindbodyMountainViewTennis,
  perfectMindLosGatosSaratoga,
  perfectMindMercerIsland,
  racquetDeskEstc,
  recSanFrancisco,
  recMountainView,
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
