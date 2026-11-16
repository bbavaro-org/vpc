import { describe, expect, it } from 'vitest';
import { DOMAIN_LAYER } from './index';

describe('domain smoke', () => {
  it('exposes the domain layer constant', () => {
    expect(DOMAIN_LAYER).toBe('domain');
  });
});
