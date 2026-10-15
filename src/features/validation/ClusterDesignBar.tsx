import { useEditorStore } from '@/state/useEditorStore';
import { resolveCluster } from '@/lib/topology/analysis';

const selectStyle = { background: 'rgba(0,0,0,0.35)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, fontSize: 10, padding: '2px 4px' } as const;

/** Cluster pattern selectors shown at the top of the audit drawer. "Auto" lets the auditor infer them from the cabling. */
export default function ClusterDesignBar() {
  const document = useEditorStore((s) => s.document);
  const updateCluster = useEditorStore((s) => s.updateCluster);
  const cluster = resolveCluster(document);
  const explicit = !!document.cluster;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', fontSize: 10, color: '#94a3b8' }}>
      <span>Design{explicit ? '' : ' (inferred)'}:</span>
      <select aria-label="Cluster pattern" style={selectStyle} value={cluster.pattern} onChange={(e) => updateCluster({ pattern: e.target.value as 'single-rack' | 'rack-aware' })}>
        <option value="single-rack">Single rack</option>
        <option value="rack-aware">Rack-aware</option>
      </select>
      <select aria-label="Storage pattern" style={selectStyle} value={cluster.storage} onChange={(e) => updateCluster({ storage: e.target.value as 'switched' | 'switchless' })}>
        <option value="switched">Switched storage</option>
        <option value="switchless">Switchless storage</option>
      </select>
      <select aria-label="RDMA protocol" style={selectStyle} value={cluster.rdma ?? 'roce'} onChange={(e) => updateCluster({ rdma: e.target.value as 'roce' | 'iwarp' })}>
        <option value="roce">RoCEv2</option>
        <option value="iwarp">iWARP</option>
      </select>
      {cluster.pattern === 'rack-aware' && (
        <select aria-label="ToR switches per zone" style={selectStyle} value={cluster.torPerZone ?? 2} onChange={(e) => updateCluster({ torPerZone: Number(e.target.value) === 1 ? 1 : 2 })}>
          <option value={2}>2 ToR per room</option>
          <option value={1}>1 ToR per room</option>
        </select>
      )}
      {explicit && (
        <button className="ui-button" style={{ fontSize: 10, padding: '1px 6px' }} onClick={() => updateCluster(null)}>
          Auto
        </button>
      )}
    </div>
  );
}
