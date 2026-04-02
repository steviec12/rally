import { describe, it, expect } from 'vitest';
import { mapRejectionToError } from './join-request';
import type { RejectionReason } from '@/types/scoring';

describe('mapRejectionToError', () => {
  it('maps self_join to 403 with correct message', () => {
    const result = mapRejectionToError('self_join');
    expect(result).toEqual({
      error: 'You cannot join your own activity.',
      status: 403,
    });
  });

  it('maps activity_full to 409 with correct message', () => {
    const result = mapRejectionToError('activity_full');
    expect(result).toEqual({
      error: 'This activity is full.',
      status: 409,
    });
  });

  it('maps activity_expired to 409 with correct message', () => {
    const result = mapRejectionToError('activity_expired');
    expect(result).toEqual({
      error: 'This activity has already started.',
      status: 409,
    });
  });
});
