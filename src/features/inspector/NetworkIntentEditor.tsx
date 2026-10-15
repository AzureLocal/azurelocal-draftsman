import { useEditorStore } from '@/state/useEditorStore';
import { isHostNode, isTorSwitch } from '@/lib/topology/analysis';
import { getHardwareProfile, listHostDataPorts } from '@/types/hardwareProfiles';
import { resolveIntentModel } from '@/features/wizard/buildTopology';
import { resolveCluster } from '@/lib/topology/analysis';
import type { NodeEntity } from '@/types/document';
import type { IntentModel, NetworkIntent, TrafficType } from '@/types/topology';

const TRAFFIC: { id: TrafficType; label: string }[] = [
  { id: 'management', label: 'Mgmt' },
  { id: 'compute', label: 'Compute' },
  { id: 'storage', label: 'Storage' },
];

const MODELS: { id: IntentModel; label: string }[] = [
  { id: 'mgmt-compute-storage', label: 'Management + Compute, Storage' },
  { id: 'group-all', label: 'Group all (converged)' },
  { id: 'disaggregated', label: 'Disaggregated (3 intents)' },
];

/** Zone, Network ATC intents (hosts) and trunk VLANs (switches) for the selected node. */
export default function NetworkIntentEditor({ node }: { node: NodeEntity }) {
  const updateNode = useEditorStore((s) => s.updateNode);
  const applyIntentsToAllHosts = useEditorStore((s) => s.applyIntentsToAllHosts);
  const document = useEditorStore((s) => s.document);

  const host = isHostNode(node);
  const tor = isTorSwitch(node);
  if (!host && !tor) return null;

  const zoneField = (
    <label className="field">
      <span>Zone (rack-aware)</span>
      <select value={node.zoneId ?? ''} onChange={(e) => updateNode(node.id, { zoneId: e.target.value || undefined })}>
        <option value="">None</option>
        <option value="zone-1">Zone 1 (room A)</option>
        <option value="zone-2">Zone 2 (room B)</option>
      </select>
    </label>
  );

  if (tor) {
    return (
      <>
        {zoneField}
        <label className="field">
          <span>Trunk VLANs (comma separated, empty = not audited)</span>
          <input
            defaultValue={(node.trunkVlans ?? []).join(', ')}
            key={node.id}
            placeholder="e.g. 7, 8, 711, 712"
            onBlur={(e) => {
              const ids = e.target.value
                .split(',')
                .map((v) => Number(v.trim()))
                .filter((v) => Number.isInteger(v) && v >= 1 && v <= 4094);
              updateNode(node.id, { trunkVlans: ids.length > 0 ? ids : undefined });
            }}
          />
        </label>
      </>
    );
  }

  const profile = getHardwareProfile(node.hardwareProfileId);
  const ports = profile ? listHostDataPorts(profile).map((p) => p.id) : [];
  const intents = node.intents ?? [];
  const setIntents = (next: NetworkIntent[]) => updateNode(node.id, { intents: next.length > 0 ? next : undefined });
  const patch = (index: number, change: Partial<NetworkIntent>) => setIntents(intents.map((it, i) => (i === index ? { ...it, ...change } : it)));
  const cluster = resolveCluster(document);

  return (
    <>
      {zoneField}
      <div className="field">
        <span>Network ATC Intents</span>
        <select
          aria-label="Apply an intent layout"
          value=""
          onChange={(e) => {
            if (!e.target.value) return;
            const plan = resolveIntentModel(profile, e.target.value as IntentModel, cluster.pattern, cluster.storage);
            setIntents(plan.intents);
          }}
        >
          <option value="">Apply a layout...</option>
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        {intents.map((intent, index) => (
          <div key={intent.id} style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: 6, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input aria-label="Intent name" value={intent.name} onChange={(e) => patch(index, { name: e.target.value })} />
            <div style={{ display: 'flex', gap: 8, fontSize: 11, flexWrap: 'wrap' }}>
              {TRAFFIC.map((t) => (
                <label key={t.id} style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={intent.traffic.includes(t.id)}
                    onChange={(e) => patch(index, { traffic: e.target.checked ? [...intent.traffic, t.id] : intent.traffic.filter((x) => x !== t.id) })}
                  />
                  {t.label}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, fontSize: 11, flexWrap: 'wrap' }}>
              {ports.map((p) => (
                <label key={p} style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={intent.portIds.includes(p)}
                    onChange={(e) => patch(index, { portIds: e.target.checked ? [...intent.portIds, p] : intent.portIds.filter((x) => x !== p) })}
                  />
                  {p}
                </label>
              ))}
            </div>
            <button className="ui-button" style={{ fontSize: 10 }} onClick={() => setIntents(intents.filter((_, i) => i !== index))}>Remove intent</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button
            className="ui-button"
            style={{ fontSize: 11 }}
            onClick={() => setIntents([...intents, { id: `intent-${Date.now()}`, name: `Intent${intents.length + 1}`, traffic: [], portIds: [] }])}
          >
            + Add intent
          </button>
          {intents.length > 0 && (
            <button className="ui-button" style={{ fontSize: 11 }} onClick={() => applyIntentsToAllHosts(node.id)}>
              Copy to all nodes
            </button>
          )}
        </div>
      </div>
    </>
  );
}
