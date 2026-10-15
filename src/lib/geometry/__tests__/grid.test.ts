import { describe, it, expect } from 'vitest';
import { snapToGrid, snapValue, GRID_SIZE } from '@/lib/geometry/grid';

/* ================================================================== */
/*  grid.ts                                                            */
/* ================================================================== */
describe('snapToGrid', () => {
  it('snaps a point to nearest grid intersection', () => {
    const result = snapToGrid({ x: 55, y: 18 });
    expect(result.x).toBe(GRID_SIZE * Math.round(55 / GRID_SIZE));
    expect(result.y).toBe(GRID_SIZE * Math.round(18 / GRID_SIZE));
  });

  it('already-snapped points stay unchanged', () => {
    const result = snapToGrid({ x: GRID_SIZE * 3, y: GRID_SIZE * -2 });
    expect(result.x).toBe(GRID_SIZE * 3);
    expect(result.y).toBe(GRID_SIZE * -2);
  });
});

describe('snapValue', () => {
  it('snaps a scalar', () => {
    expect(snapValue(61)).toBe(GRID_SIZE * Math.round(61 / GRID_SIZE));
  });
});
