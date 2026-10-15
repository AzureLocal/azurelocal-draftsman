import { describe, it, expect } from 'vitest';
import { normalizeBounds, containsNode, containsArea, containsText } from '@/lib/geometry/selection';

/* ================================================================== */
/*  selection.ts                                                       */
/* ================================================================== */
describe('normalizeBounds', () => {
  it('normalizes inverted rectangle', () => {
    const b = normalizeBounds({ x: 100, y: 200 }, { x: 50, y: 150 });
    expect(b.x).toBe(50);
    expect(b.y).toBe(150);
    expect(b.width).toBe(50);
    expect(b.height).toBe(50);
  });

  it('handles zero-size selection', () => {
    const b = normalizeBounds({ x: 10, y: 10 }, { x: 10, y: 10 });
    expect(b.width).toBe(0);
    expect(b.height).toBe(0);
  });
});

describe('containsNode / containsArea / containsText', () => {
  const bounds = { x: 0, y: 0, width: 200, height: 200 };

  it('node inside bounds returns true', () => {
    const node = { x: 50, y: 50, width: 40, height: 40 } as any;
    expect(containsNode(bounds, node)).toBe(true);
  });

  it('node outside bounds returns false', () => {
    const node = { x: 300, y: 300, width: 40, height: 40 } as any;
    expect(containsNode(bounds, node)).toBe(false);
  });

  it('area inside bounds returns true', () => {
    const area = { x: 10, y: 10, width: 100, height: 100 } as any;
    expect(containsArea(bounds, area)).toBe(true);
  });

  it('text inside bounds returns true', () => {
    const text = { x: 100, y: 100 } as any;
    expect(containsText(bounds, text)).toBe(true);
  });

  it('text outside bounds returns false', () => {
    const text = { x: 300, y: 300 } as any;
    expect(containsText(bounds, text)).toBe(false);
  });
});
