import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import AppShell from '@/app/layout/AppShell';
import StatusBar from '@/app/layout/StatusBar';
import TopToolbar from '@/app/layout/TopToolbar';
import MeshBackground from '@/components/ui/MeshBackground';
import ToastHost from '@/components/ui/ToastHost';
import CanvasViewport from '@/features/canvas/CanvasViewport';
import EntityTooltip from '@/features/canvas/EntityTooltip';
import InspectorPanel from '@/features/inspector/InspectorPanel';
import LayersPanel from '@/features/layers/LayersPanel';
import RecentDocumentsPanel from '@/features/canvas/RecentDocumentsPanel';
import VersionHistoryPanel from '@/features/canvas/VersionHistoryPanel';
import ShapePalette from '@/features/palette/ShapePalette';
import ScenarioToolbar from '@/features/scenarios/ScenarioToolbar';
import type { ViewportSize } from '@/lib/geometry/iso';
import { saveDocument } from '@/lib/serialization/storage';
import { applyUrlParams } from '@/lib/urlParams';
import { useEditorStore } from '@/state/useEditorStore';

// The landing page (documentation and release notes) and the wizard are not needed to paint the editor.
const LandingPage = lazy(() => import('@/features/landing/LandingPage'));
const GuidedSetupWizard = lazy(() => import('@/features/wizard/GuidedSetupWizard'));

const SAVE_DEBOUNCE_MS = 400;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeView = useEditorStore((state) => state.activeView);
  const document = useEditorStore((state) => state.document);
  const presentMode = useEditorStore((state) => state.presentMode);
  const theme = useEditorStore((state) => state.theme);
  const wizardOpen = useEditorStore((state) => state.wizardOpen);
  const [cursorWorld, setCursorWorld] = useState<{ x: number; y: number } | null>(null);
  const [viewport, setViewport] = useState<ViewportSize>({ width: 1280, height: 720 });
  const [hoveredEntity, setHoveredEntity] = useState<{ id: string; screenX: number; screenY: number } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveDocument(document), SAVE_DEBOUNCE_MS);
    return () => clearTimeout(saveTimerRef.current);
  }, [document]);

  useEffect(() => {
    window.document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Apply URL parameters once on mount (for iframe / deep-link integrations).
  useEffect(() => {
    void applyUrlParams();
  }, []);

  return (
    <>
      <MeshBackground />
      {activeView === 'landing' ? (
        <Suspense fallback={null}>
          <LandingPage />
        </Suspense>
      ) : (
        <AppShell
          toolbar={<TopToolbar canvasRef={canvasRef} viewport={viewport} />}
          sidebar={!presentMode ? <ShapePalette /> : <div />}
          inspector={!presentMode ? <div className="sidebar-stack"><InspectorPanel /><RecentDocumentsPanel /><VersionHistoryPanel /><LayersPanel /></div> : <div />}
          statusbar={!presentMode ? <StatusBar cursorWorld={cursorWorld} /> : <div className="present-pill">Presentation mode</div>}
        >
          <CanvasViewport canvasRef={canvasRef} onCursorWorldChange={setCursorWorld} onViewportChange={setViewport} onEntityHover={setHoveredEntity} />
          <ScenarioToolbar />
          {hoveredEntity && !presentMode && (
            <EntityTooltip entityId={hoveredEntity.id} screenX={hoveredEntity.screenX} screenY={hoveredEntity.screenY} />
          )}
        </AppShell>
      )}
      {wizardOpen && (
        <Suspense fallback={null}>
          <GuidedSetupWizard />
        </Suspense>
      )}
      <ToastHost />
    </>
  );
}