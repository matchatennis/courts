import { describe, expect, test } from 'bun:test';
import {
  PROVIDER_CATALOG,
  PROVIDERS,
  resolveBookingPolicy,
  validateProviderConfig,
} from './index';

describe('provider catalog', () => {
  test('loads the complete catalog and configured providers', () => {
    expect(Object.keys(PROVIDER_CATALOG)).toHaveLength(18);
    expect(Object.keys(PROVIDERS)).toHaveLength(12);
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
});
