import { describe, expect, it } from 'vitest';
import { EXAMPLES, hasClauseAudit } from './App.jsx';

describe('BIS.SPEC tender demonstration data', () => {
  it('offers seven tender examples including the three new scenarios', () => {
    expect(EXAMPLES).toHaveLength(7);
    expect(EXAMPLES.map(example => example.name)).toEqual([
      'TMT Rebars Fe 500D',
      '1.1 kV Control Cables',
      '1.5 TR Room ACs',
      'Structural Steel E250',
      'Concrete Paving Blocks',
      'Solar Water Pumping System',
      'ICT Equipment Power Adaptors',
    ]);
  });

  it('keeps each new sample tied to its relevant BIS reference and domain', () => {
    expect(EXAMPLES[4]).toMatchObject({ domain: 'Civil & Construction' });
    expect(EXAMPLES[4].text).toContain('IS 15658:2021');
    expect(EXAMPLES[5]).toMatchObject({ domain: 'Mechanical & HVAC' });
    expect(EXAMPLES[5].text).toContain('IS 17018 (Part 1):2022');
    expect(EXAMPLES[6]).toMatchObject({ domain: 'Electronics & IT' });
    expect(EXAMPLES[6].text).toContain('IS/IEC 62368 (Part 1):2023');
  });

  it('offers clause actions only when a reviewed demo standard has clause data', () => {
    expect(hasClauseAudit({ catalogue_only: true, mandatory_clauses: [] })).toBe(false);
    expect(hasClauseAudit({ catalogue_only: false, mandatory_clauses: [{ clause_no: '5.1' }] })).toBe(true);
    expect(hasClauseAudit({ catalogue_only: false, mandatory_clauses: [] })).toBe(false);
  });
});
