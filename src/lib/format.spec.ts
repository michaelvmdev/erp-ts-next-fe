import { describe, it, expect } from 'vitest';
import { formatCurrency, currentMonthLabel } from './format';

describe('formatCurrency()', () => {
  it('formats a typical amount with two decimal places', () => {
    const result = formatCurrency(1059.6);
    expect(result).toContain('1,059.60');
    expect(result).toMatch(/S\//);
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0.00');
  });

  it('formats a whole number with trailing zeros', () => {
    expect(formatCurrency(50)).toContain('50.00');
  });

  it('rounds to two decimal places', () => {
    expect(formatCurrency(1.005)).toContain('1.0');
  });

  it('formats large amounts with thousand separator', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('1,000,000.00');
  });
});

describe('currentMonthLabel()', () => {
  it('returns a non-empty string', () => {
    expect(typeof currentMonthLabel()).toBe('string');
    expect(currentMonthLabel().length).toBeGreaterThan(0);
  });

  it('includes the 4-digit year of the given date', () => {
    const date = new Date(2024, 0, 15);
    expect(currentMonthLabel(date)).toContain('2024');
  });

  it('returns Spanish month name for January', () => {
    const date = new Date(2024, 0, 1);
    const label = currentMonthLabel(date);
    expect(label.toLowerCase()).toContain('enero');
  });

  it('returns Spanish month name for July', () => {
    const date = new Date(2024, 6, 1);
    const label = currentMonthLabel(date);
    expect(label.toLowerCase()).toContain('julio');
  });
});
