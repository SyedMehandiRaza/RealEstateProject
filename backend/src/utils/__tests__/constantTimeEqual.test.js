import crypto from 'node:crypto';
import { constantTimeEqual } from '../constantTimeEqual.js';

describe('constantTimeEqual', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('is true for equal buffers', () => {
    expect(constantTimeEqual(Buffer.from('abc'), Buffer.from('abc'))).toBe(true);
  });

  it('is false for different buffers of the same length', () => {
    expect(constantTimeEqual(Buffer.from('abc'), Buffer.from('abd'))).toBe(false);
  });

  it('is false for buffers of different lengths, without throwing', () => {
    expect(constantTimeEqual(Buffer.from('abc'), Buffer.from('abcd'))).toBe(false);
    expect(constantTimeEqual(Buffer.alloc(0), Buffer.from('a'))).toBe(false);
  });

  it('compares with crypto.timingSafeEqual', () => {
    const spy = jest.spyOn(crypto, 'timingSafeEqual');
    constantTimeEqual(Buffer.from('abc'), Buffer.from('abc'));
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
