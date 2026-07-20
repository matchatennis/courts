import { Platform, type MRN } from '../domain';
import type { ProviderConfig, ProviderFacts } from './index';

type ConfigRecord = Record<string, unknown>;
type SchedulerType = 'consolidated' | 'expanded';

const isRecord = (value: unknown): value is ConfigRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const requireRecord = (value: unknown, message: string): ConfigRecord => {
  if (!isRecord(value)) throw new Error(message);
  return value;
};

const durationMinutes = (value: unknown): number | null => {
  if (typeof value !== 'string') return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (minutes >= 60 || hours * 60 + minutes <= 0) return null;
  return hours * 60 + minutes;
};

const minimumAdvanceMinutes = (value: unknown): number | null => {
  if (value === 'next-day') return 0;
  if (typeof value !== 'string') return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (minutes >= 60) return null;
  return hours * 60 + minutes;
};

const clockMinutes = (value: unknown): number | null => {
  if (typeof value !== 'string') return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours >= 24 || minutes >= 60) return null;
  return hours * 60 + minutes;
};

const isUrl = (value: unknown): value is string => {
  if (!isNonEmptyString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const validateOptionalString = (record: ConfigRecord, key: string, message: string): void => {
  if (record[key] !== undefined && typeof record[key] !== 'string') throw new Error(message);
};

const validateDurationRange = (
  minimumValue: unknown,
  maximumValue: unknown,
  message: string,
): void => {
  const minimum = durationMinutes(minimumValue);
  const maximum = durationMinutes(maximumValue);
  if (minimum === null || maximum === null || minimum > maximum) throw new Error(message);
};

const validateAvailabilityWindow = (value: unknown, id: string): void => {
  const window = requireRecord(value, `${id}: calendar availability window is required`);
  const { minHours, maxHours } = window;
  if (
    typeof minHours !== 'number'
    || typeof maxHours !== 'number'
    || !Number.isFinite(minHours)
    || !Number.isFinite(maxHours)
    || minHours < 0
    || maxHours <= minHours
  ) {
    throw new Error(`${id}: invalid calendar availability window`);
  }
};

const validateConsolidatedScheduler = (value: unknown, id: string): void => {
  const scheduler = requireRecord(value, `${id}: invalid consolidated scheduler`);
  if (!isNonEmptyString(scheduler.costTypeId) || !isNonEmptyString(scheduler.reservationMinInterval)) {
    throw new Error(`${id}: invalid consolidated scheduler`);
  }
};

const validateExpandedScheduler = (value: unknown, id: string): void => {
  const scheduler = requireRecord(value, `${id}: invalid expanded scheduler`);
  const schedule = requireRecord(scheduler.schedule, `${id}: invalid expanded scheduler`);
  const start = clockMinutes(schedule.start);
  const end = clockMinutes(schedule.end);
  if (
    !isNonEmptyString(scheduler.costTypeId)
    || !isNonEmptyString(scheduler.reservationMinInterval)
    || typeof scheduler.selectedCourtIds !== 'string'
    || !Array.isArray(scheduler.courtLabels)
    || scheduler.courtLabels.length === 0
    || !scheduler.courtLabels.every(isNonEmptyString)
    || !isPositiveNumber(scheduler.slotInterval)
    || start === null
    || end === null
    || end <= start
  ) {
    throw new Error(`${id}: invalid expanded scheduler`);
  }
};

const validateSchedulers = (value: unknown, type: SchedulerType, id: string): void => {
  const schedulers = requireRecord(value, `${id}: scheduler configs are required`);
  const entries = Object.entries(schedulers);
  if (entries.length === 0 || entries.some(([schedulerId]) => !schedulerId)) {
    throw new Error(`${id}: scheduler configs are required`);
  }
  for (const [, scheduler] of entries) {
    if (type === 'consolidated') validateConsolidatedScheduler(scheduler, id);
    else validateExpandedScheduler(scheduler, id);
  }
};

const validateSchedulerConfig = (value: unknown, id: string): SchedulerType => {
  const scheduler = requireRecord(value, `${id}: invalid calendar scheduler`);
  if (scheduler.type !== 'consolidated' && scheduler.type !== 'expanded') {
    throw new Error(`${id}: invalid calendar scheduler type`);
  }
  validateSchedulers(scheduler.configs, scheduler.type, id);
  return scheduler.type;
};

const validateCalendar = (value: unknown, id: string): SchedulerType | undefined => {
  const calendar = requireRecord(value, `${id}: calendar configuration is required`);
  if (!['unsupported', 'matcha-device', 'matcha-server'].includes(String(calendar.type))) {
    throw new Error(`${id}: invalid calendar type ${String(calendar.type)}`);
  }
  if (calendar.type === 'unsupported') {
    return calendar.scheduler === undefined ? undefined : validateSchedulerConfig(calendar.scheduler, id);
  }

  validateAvailabilityWindow(calendar.availabilityWindow, id);
  if (!isPositiveNumber(calendar.requestsPerMinute)) {
    throw new Error(`${id}: invalid calendar rate limit`);
  }
  if (calendar.type === 'matcha-device' && !isBoolean(calendar.requiresAuthentication)) {
    throw new Error(`${id}: device calendar requires explicit authentication configuration`);
  }
  if (calendar.type === 'matcha-server' && !isBoolean(calendar.notifications)) {
    throw new Error(`${id}: server calendar requires explicit notification configuration`);
  }
  return calendar.scheduler === undefined ? undefined : validateSchedulerConfig(calendar.scheduler, id);
};

const validateTargets = (
  value: unknown,
  providerId: string,
  policyId: string,
  seen: Set<MRN>,
): void => {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isNonEmptyString)) {
    throw new Error(`${providerId}/${policyId}: booking policy targets cannot be empty`);
  }
  for (const target of value) {
    if (!target.startsWith(`${providerId}:`)) {
      throw new Error(`${providerId}/${policyId}: target does not belong to provider`);
    }
    if (seen.has(target as MRN)) {
      throw new Error(`${providerId}: duplicate booking policy target for ${target}`);
    }
    seen.add(target as MRN);
  }
};

const validateBookingPolicies = (value: unknown, providerId: string): void => {
  if (!Array.isArray(value)) throw new Error(`${providerId}: booking policies are required`);

  const ids = new Set<string>();
  const places = new Set<MRN>();
  const resources = new Set<MRN>();
  let defaultCount = 0;

  for (const valuePolicy of value) {
    const policy = requireRecord(valuePolicy, `${providerId}: invalid booking policy`);
    const policyId = isNonEmptyString(policy.id) ? policy.id : '';
    if (!policyId) throw new Error(`${providerId}: booking policy id is required`);
    if (ids.has(policyId)) throw new Error(`${providerId}: duplicate booking policy id ${policyId}`);
    ids.add(policyId);

    if (policy.places !== undefined && policy.resources !== undefined) {
      throw new Error(`${providerId}/${policyId}: places and resources cannot both be set`);
    }
    if (policy.places === undefined && policy.resources === undefined) defaultCount += 1;
    if (policy.places !== undefined) validateTargets(policy.places, providerId, policyId, places);
    if (policy.resources !== undefined) validateTargets(policy.resources, providerId, policyId, resources);

    validateOptionalString(policy, 'description', `${providerId}/${policyId}: invalid description`);
    validateOptionalString(policy, 'phone', `${providerId}/${policyId}: invalid phone`);
    validateOptionalString(policy, 'confirmationNotice', `${providerId}/${policyId}: invalid confirmation notice`);
    if (minimumAdvanceMinutes(policy.minAdvance) === null) {
      throw new Error(`${providerId}/${policyId}: invalid minimum advance`);
    }
    if (policy.cancellationUrl !== undefined && !isUrl(policy.cancellationUrl)) {
      throw new Error(`${providerId}/${policyId}: invalid cancellation URL`);
    }
    if (policy.savedCardCvv !== undefined && !isBoolean(policy.savedCardCvv)) {
      throw new Error(`${providerId}/${policyId}: invalid saved card configuration`);
    }

    if (!['matcha-device', 'provider', 'phone', 'unsupported'].includes(String(policy.type))) {
      throw new Error(`${providerId}/${policyId}: invalid booking policy type ${String(policy.type)}`);
    }
    if (policy.type === 'matcha-device' && policy.reserveBy !== 'range' && policy.reserveBy !== 'block') {
      throw new Error(`${providerId}/${policyId}: Matcha booking policy requires a reservation shape`);
    }
    if (policy.type === 'provider' && (!isUrl(policy.url) || (policy.reserveBy !== 'range' && policy.reserveBy !== 'block'))) {
      throw new Error(`${providerId}/${policyId}: provider booking policy requires a URL and reservation shape`);
    }
    if (policy.type === 'phone' && !isNonEmptyString(policy.number)) {
      throw new Error(`${providerId}/${policyId}: phone booking policy requires a number`);
    }
    if (policy.reserveBy === 'range') {
      if (!isNonEmptyString(policy.minDuration) || !isNonEmptyString(policy.maxDuration)) {
        throw new Error(`${providerId}/${policyId}: range booking policy requires minDuration and maxDuration`);
      }
      validateDurationRange(
        policy.minDuration,
        policy.maxDuration,
        `${providerId}/${policyId}: invalid duration range`,
      );
    }
  }

  if (defaultCount !== 1) {
    throw new Error(`${providerId}: expected exactly one provider-wide booking policy`);
  }
};

export function validateProviderConfig(value: unknown): asserts value is ProviderConfig {
  const provider = requireRecord(value, 'provider configuration must be an object');
  const id = isNonEmptyString(provider.id) ? provider.id : '';
  const platforms = Object.values(Platform) as unknown[];
  if (!id || !platforms.includes(provider.platform)) {
    throw new Error('provider id and platform are required');
  }
  if (!id.startsWith(`${String(provider.platform)}:`)) throw new Error(`${id}: provider platform does not match id`);
  if (!isNonEmptyString(provider.name)) throw new Error(`${id}: provider name is required`);

  const location = requireRecord(provider.location, `${id}: provider location is required`);
  if (!isNonEmptyString(location.city) || !isNonEmptyString(location.state)) {
    throw new Error(`${id}: provider location is incomplete`);
  }

  const urls = requireRecord(provider.urls, `${id}: provider URLs are incomplete`);
  if (!isUrl(urls.signin) || !isUrl(urls.signup) || !isUrl(urls.cancellation)) {
    throw new Error(`${id}: provider URLs are incomplete`);
  }
  const calendar = requireRecord(provider.calendar, `${id}: calendar configuration is required`);
  const calendarSchedulerType = validateCalendar(calendar, id);
  validateBookingPolicies(provider.bookingPolicies, id);
  if (provider.platform === Platform.CourtReserve) {
    if (calendarSchedulerType === undefined && calendar.type !== 'unsupported') {
      throw new Error(`${id}: CourtReserve scheduler is required`);
    }
  }
}

export function validateProviderConfigs(value: unknown): asserts value is ProviderConfig[] {
  if (!Array.isArray(value)) throw new Error('provider configuration must be an array');
  const ids = new Set<string>();
  for (const provider of value) {
    validateProviderConfig(provider);
    if (ids.has(provider.id)) throw new Error(`duplicate provider id ${provider.id}`);
    ids.add(provider.id);
  }
}

export function validateProviderFacts(value: unknown): asserts value is ProviderFacts {
  const provider = requireRecord(value, 'provider facts must be an object');
  const id = isNonEmptyString(provider.id) ? provider.id : '';
  const platforms = Object.values(Platform) as unknown[];
  if (!id || !platforms.includes(provider.platform)) throw new Error('provider id and platform are required');
  if (!id.startsWith(`${String(provider.platform)}:`)) throw new Error(`${id}: provider platform does not match id`);
  if (!isNonEmptyString(provider.name)) throw new Error(`${id}: provider name is required`);
  const location = requireRecord(provider.location, `${id}: provider location is required`);
  if (!isNonEmptyString(location.city) || !isNonEmptyString(location.state)) {
    throw new Error(`${id}: provider location is incomplete`);
  }
  const urls = requireRecord(provider.urls, `${id}: provider URLs are incomplete`);
  if (!isUrl(urls.signin) || !isUrl(urls.signup) || !isUrl(urls.cancellation)) {
    throw new Error(`${id}: provider URLs are incomplete`);
  }
  validateAvailabilityWindow(provider.reservationWindow, id);
}
