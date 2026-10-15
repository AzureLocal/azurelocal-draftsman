import { describe, expect, it } from 'vitest';
import { validateWizardChoice } from '../buildTopology';

describe('validateWizardChoice', () => {
  it('accepts supported combinations', () => {
    expect(validateWizardChoice({ nodeCount: 2, storage: 'switchless' })).toBeNull();
    expect(validateWizardChoice({ nodeCount: 8, pattern: 'rack-aware' })).toBeNull();
    expect(validateWizardChoice({ nodeCount: 4 })).toBeNull();
  });

  it('rejects switchless above the wizard limit and rack-aware switchless', () => {
    expect(validateWizardChoice({ nodeCount: 6, storage: 'switchless' })).toMatch(/switchless/i);
    expect(validateWizardChoice({ nodeCount: 4, pattern: 'rack-aware', storage: 'switchless' })).toMatch(/switched/);
  });

  it('rejects an odd rack-aware count', () => {
    expect(validateWizardChoice({ nodeCount: 3, pattern: 'rack-aware' })).toMatch(/even/);
  });
});
