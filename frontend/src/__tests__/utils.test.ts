import { formatSalary, getMatchColor } from '../lib/utils';

describe('formatSalary', () => {
  it('formats a salary range', () => {
    const result = formatSalary(80000, 120000, 'USD');
    expect(result).toContain('80');
    expect(result).toContain('120');
  });

  it('handles undefined/null values gracefully', () => {
    const result = formatSalary(undefined, undefined, 'USD');
    expect(result).toBe('Salary not disclosed');
  });
});

describe('getMatchColor', () => {
  it('returns a green class for high scores', () => {
    // getMatchColor uses 0-100 scale: score >= 90 returns text-emerald-400
    const cls = getMatchColor(92);
    expect(cls).toMatch(/green|emerald/);
  });

  it('returns a yellow/amber class for mid scores', () => {
    // score >= 60 returns text-yellow-400
    const cls = getMatchColor(65);
    expect(cls).toMatch(/yellow|amber/);
  });
});
