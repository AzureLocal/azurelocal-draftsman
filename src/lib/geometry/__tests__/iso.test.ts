import { describe, it, expect } from 'vitest';
import { projectIso, unprojectIso, worldToScreen, screenToWorld, isoQuad } from '@/lib/geometry/iso';
import type { CameraState } from '@/types/document';
import type { ViewportSize } from '@/lib/geometry/iso';

const cam: CameraState = { x: 0, y: 0, zoom: 1 };
const vp: ViewportSize = { width: 800, height: 600 };

/* ================================================================== */
/*  iso.ts                                                             */
/* ================================================================== */
describe('projectIso / unprojectIso', () => {
  it('origin projects to origin', () => {
    const p = projectIso({ x: 0, y: 0 });
    expect(p.x).toBeCloseTo(0, 8);
    expect(p.y).toBeCloseTo(0, 8);
  });

  it('round-trips through project → unproject', () => {
    const original = { x: 120, y: -45 };
    const rt = unprojectIso(projectIso(original));
    expect(rt.x).toBeCloseTo(original.x, 4);
    expect(rt.y).toBeCloseTo(original.y, 4);
  });

  it('round-trips for negative coordinates', () => {
    const original = { x: -200, y: 150 };
    const rt = unprojectIso(projectIso(original));
    expect(rt.x).toBeCloseTo(original.x, 4);
    expect(rt.y).toBeCloseTo(original.y, 4);
  });
});

describe('worldToScreen / screenToWorld', () => {
  it('round-trips at default camera', () => {
    const world = { x: 100, y: 50 };
    const screen = worldToScreen(world, cam, vp);
    const back = screenToWorld(screen, cam, vp);
    expect(back.x).toBeCloseTo(world.x, 4);
    expect(back.y).toBeCloseTo(world.y, 4);
  });

  it('round-trips at zoomed & offset camera', () => {
    const zoomCam: CameraState = { x: -120, y: 60, zoom: 1.8 };
    const world = { x: -30, y: 80 };
    const screen = worldToScreen(world, zoomCam, vp);
    const back = screenToWorld(screen, zoomCam, vp);
    expect(back.x).toBeCloseTo(world.x, 4);
    expect(back.y).toBeCloseTo(world.y, 4);
  });

  it('world origin maps to viewport centre at default camera', () => {
    const screen = worldToScreen({ x: 0, y: 0 }, cam, vp);
    expect(screen.x).toBeCloseTo(vp.width / 2, 4);
    expect(screen.y).toBeCloseTo(vp.height / 2, 4);
  });
});

describe('isoQuad', () => {
  it('returns exactly 4 points', () => {
    const quad = isoQuad(0, 0, 100, 100, cam, vp);
    expect(quad).toHaveLength(4);
  });

  it('first point matches worldToScreen of (x, y)', () => {
    const quad = isoQuad(40, 60, 120, 80, cam, vp);
    const ws = worldToScreen({ x: 40, y: 60 }, cam, vp);
    expect(quad[0].x).toBeCloseTo(ws.x, 8);
    expect(quad[0].y).toBeCloseTo(ws.y, 8);
  });
});
