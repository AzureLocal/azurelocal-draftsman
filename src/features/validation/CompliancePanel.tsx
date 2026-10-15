import { useState } from 'react';
import { useEditorStore } from '@/state/useEditorStore';
import { auditDiagramDocument } from '@/features/validation/diagramAuditor';
import { COMPLIANCE_RULES } from '@/types/validation';
import ClusterDesignBar from './ClusterDesignBar';

export default function CompliancePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const document = useEditorStore((state) => state.document);
  const selectEntities = useEditorStore((state) => state.selectEntities);

  const issues = auditDiagramDocument(document);
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const infos = issues.filter((i) => i.severity === 'info');

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '12px',
        left: '20px',
        zIndex: 45,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      {/* Drawer Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '6px',
          background: errors.length > 0 ? 'rgba(255, 0, 85, 0.25)' : warnings.length > 0 ? 'rgba(255, 179, 0, 0.25)' : 'rgba(15, 23, 42, 0.85)',
          border: errors.length > 0 ? '1px solid rgba(255, 0, 85, 0.6)' : warnings.length > 0 ? '1px solid rgba(255, 179, 0, 0.6)' : '1px solid rgba(255, 255, 255, 0.15)',
          color: errors.length > 0 ? '#ff0055' : warnings.length > 0 ? '#ffb300' : '#4ade80',
          backdropFilter: 'blur(12px)',
          fontWeight: 700,
          fontSize: '11px',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        }}
      >
        <span>🛡️ Pre-Flight Audit</span>
        <span style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', fontSize: '10px' }}>
          {errors.length} 🔴 | {warnings.length} 🟡 | {infos.length} ℹ️
        </span>
        <span>{isOpen ? '▼' : '▲'}</span>
      </button>

      {/* Expanded Issues Drawer */}
      {isOpen && (
        <div
          style={{
            marginTop: '8px',
            width: '360px',
            maxHeight: '260px',
            overflowY: 'auto',
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '10px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
            Compliance & Architecture Audit Results
          </div>
          <ClusterDesignBar />

          {issues.length === 0 ? (
            <div style={{ fontSize: '11px', color: '#4ade80', padding: '12px 0', textAlign: 'center' }}>
              ✓ All {COMPLIANCE_RULES.length} compliance rules passed.
            </div>
          ) : (
            issues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => {
                  if (issue.targetNodeId) selectEntities('node', [issue.targetNodeId]);
                  if (issue.targetAreaId) selectEntities('area', [issue.targetAreaId]);
                  if (!issue.targetNodeId && !issue.targetAreaId && issue.targetConnectorId) selectEntities('connector', [issue.targetConnectorId]);
                }}
                style={{
                  background: issue.severity === 'error' ? 'rgba(255,0,85,0.1)' : issue.severity === 'warning' ? 'rgba(255,179,0,0.1)' : 'rgba(0,210,255,0.1)',
                  borderLeft: `3px solid ${issue.severity === 'error' ? '#ff0055' : issue.severity === 'warning' ? '#ffb300' : '#00d2ff'}`,
                  padding: '6px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: issue.severity === 'error' ? '#ff4d7d' : issue.severity === 'warning' ? '#ffca28' : '#38bdf8' }}>
                  <span>{issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : 'ℹ️'} {issue.title}</span>
                  <a
                    href={COMPLIANCE_RULES.find((r) => r.id === issue.ruleId)?.learnUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Open the Microsoft Learn reference"
                    style={{ fontSize: '9px', opacity: 0.8, color: 'inherit' }}
                  >
                    [{issue.ruleId}]
                  </a>
                </div>
                <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '3px' }}>{issue.message}</div>
                {issue.suggestedFix && (
                  <div style={{ fontSize: '10px', color: '#4ade80', marginTop: '4px', fontStyle: 'italic' }}>
                    💡 Fix: {issue.suggestedFix}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
