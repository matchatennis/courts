import { describe, expect, test } from 'bun:test';
import {
  PROVIDER_CATALOG,
  PROVIDERS,
  resolveBookingPolicy,
  validateProviderConfig,
} from './providers';

describe('provider catalog', () => {
  test('loads the complete catalog and configured providers', () => {
    expect(Object.keys(PROVIDER_CATALOG)).toHaveLength(18);
    expect(Object.keys(PROVIDERS)).toHaveLength(18);
  });

  test('resolves resource policies before provider defaults', () => {
    const provider = PROVIDERS['activenet:seattle']!;
    expect(resolveBookingPolicy(
      provider,
      'activenet:seattle:center/2',
      'activenet:seattle:center/2/resource/10',
    ).id).toBe('amy-yee-indoor');
    expect(resolveBookingPolicy(
      provider,
      'activenet:seattle:center/2',
      'activenet:seattle:center/2/resource/279',
    ).id).toBe('seattle-default');

    const eastside = PROVIDERS['racquetdesk:estc']!;
    expect(resolveBookingPolicy(
      eastside,
      'racquetdesk:estc:location/default',
      'racquetdesk:estc:location/default/court/807',
    ).id).toBe('estc-pickleball-youth');
    expect(resolveBookingPolicy(
      eastside,
      'racquetdesk:estc:location/default',
      'racquetdesk:estc:location/default/court/808',
    ).id).toBe('estc-youth');
    expect(resolveBookingPolicy(
      eastside,
      'racquetdesk:estc:location/default',
      'racquetdesk:estc:location/default/court/798',
    ).id).toBe('estc-full-size');
  });

  test('rejects invalid provider capabilities', () => {
    const provider = PROVIDERS['activenet:seattle']!;
    expect(() => validateProviderConfig({
      ...provider,
      calendar: {
        ...provider.calendar,
        requestsPerMinute: 0,
      },
    })).toThrow('invalid calendar rate limit');
  });

  test('requires a RacquetDesk court sheet id', () => {
    const provider = PROVIDERS['racquetdesk:estc']!;
    expect(() => validateProviderConfig({
      ...provider,
      calendar: {
        ...provider.calendar,
        courtSheetId: '',
      },
    })).toThrow('RacquetDesk court sheet id is required');
  });
});
