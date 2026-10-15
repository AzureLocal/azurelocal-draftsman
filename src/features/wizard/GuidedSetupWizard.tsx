import { useState } from 'react';
import { useEditorStore } from '@/state/useEditorStore';
import { resolveIntentModel, serverProfileId, validateWizardChoice, type WizardTopologyConfig } from './buildTopology';
import { getHardwareProfile } from '@/types/hardwareProfiles';
import { isAtcDefaultStorageVlan, type ClusterPattern, type IntentModel, type StoragePattern } from '@/types/topology';

interface TopologyPreset {
  id: string;
  nodeCount: WizardTopologyConfig['nodeCount'];
  pattern: ClusterPattern;
  storage: StoragePattern;
  title: string;
  desc: string;
}

const PRESETS: TopologyPreset[] = [
  { id: 'switchless-2', nodeCount: 2, pattern: 'single-rack', storage: 'switchless', title: '2-Node Switchless Cluster', desc: 'Direct node-to-node storage links, two ToR switches for management and compute. Remote office and edge.' },
  { id: 'switchless-3', nodeCount: 3, pattern: 'single-rack', storage: 'switchless', title: '3-Node Switchless Cluster', desc: 'Full storage mesh between three nodes. No Network ATC automatic storage IPs: plan addressing.' },
  { id: 'switched-4', nodeCount: 4, pattern: 'single-rack', storage: 'switched', title: '4-Node Dual-ToR HA Cluster', desc: 'One MLAG ToR pair carries management, compute and storage. The standard single-rack design.' },
  { id: 'switched-8', nodeCount: 8, pattern: 'single-rack', storage: 'switched', title: '8-Node High-Density Cluster', desc: 'Single rack, one MLAG ToR pair for all traffic, dedicated OOB console.' },
  { id: 'rack-aware-4', nodeCount: 4, pattern: 'rack-aware', storage: 'switched', title: 'Rack-Aware Cluster (2 zones, 4 nodes)', desc: 'Two rooms, two ToR per room, dedicated storage links between rooms (VLAN 711 and 712).' },
  { id: 'rack-aware-8', nodeCount: 8, pattern: 'rack-aware', storage: 'switched', title: 'Rack-Aware Cluster (2 zones, 8 nodes)', desc: 'Two rooms with four nodes each, management and compute grouped, dedicated storage intent.' },
];

const INTENT_MODELS: { id: IntentModel; title: string; desc: string }[] = [
  { id: 'mgmt-compute-storage', title: 'Management + Compute, Storage', desc: 'Two intents on four ports. Required for rack-aware and switchless.' },
  { id: 'group-all', title: 'Group all (fully converged)', desc: 'One intent on two ports carries everything. Switched single-rack only.' },
  { id: 'disaggregated', title: 'Disaggregated (3 intents)', desc: 'Management, compute and storage on separate port pairs (six data ports).' },
];

export default function GuidedSetupWizard() {
  const wizardOpen = useEditorStore((state) => state.wizardOpen);
  const setWizardOpen = useEditorStore((state) => state.setWizardOpen);
  const buildWizardTopology = useEditorStore((state) => state.buildWizardTopology);

  const [step, setStep] = useState<number>(1);

  const [presetId, setPresetId] = useState<string>('switched-4');
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[2];
  const nodeCount = preset.nodeCount;
  const [intentModel, setIntentModel] = useState<IntentModel>('mgmt-compute-storage');
  const [serverModel, setServerModel] = useState<string>('AX-760');
  const [switchModel, setSwitchModel] = useState<string>('Arista 7050SX3');
  const [oobConsole, setOobConsole] = useState<string>('Opengear OM2248');
  const [mgmtVlan, setMgmtVlan] = useState<number>(7);
  const [computeVlan, setComputeVlan] = useState<number>(8);
  const [storageVlan1, setStorageVlan1] = useState<number>(711);
  const [storageVlan2, setStorageVlan2] = useState<number>(712);
  const [mtu, setMtu] = useState<number>(9000);
  const [cableMedia, setCableMedia] = useState<'DAC 25G' | 'MMF 100G'>('DAC 25G');

  if (!wizardOpen) return null;

  const choiceError = validateWizardChoice({ nodeCount, pattern: preset.pattern, storage: preset.storage });
  const effectivePlan = resolveIntentModel(getHardwareProfile(serverProfileId(serverModel)), intentModel, preset.pattern, preset.storage);
  const intentFallback = effectivePlan.model !== intentModel;
  const collisions = [
    { name: 'Management', vlan: mgmtVlan },
    { name: 'Compute', vlan: computeVlan },
  ].filter((x) => isAtcDefaultStorageVlan(x.vlan));

  const handleFinish = () => {
    const config: WizardTopologyConfig = {
      nodeCount,
      pattern: preset.pattern,
      storage: preset.storage,
      intentModel,
      serverModel,
      switchModel,
      oobConsole,
      vlanProfile: {
        mgmtVlan,
        computeVlan,
        storageVlan1,
        storageVlan2,
        storageVlan3: 713,
        mtu,
      },
      cableMedia,
    };
    buildWizardTopology(config);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10, 15, 26, 0.82)',
        backdropFilter: 'blur(12px)',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          background: 'linear-gradient(145deg, rgba(20, 30, 48, 0.95), rgba(15, 23, 42, 0.98))',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 229, 255, 0.15)',
          borderRadius: '16px',
          padding: '32px',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#00e5ff' }}>
              Azure Local Infrastructure Assistant
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0 0', color: '#ffffff' }}>
              Guided Architecture Setup Wizard
            </h2>
          </div>
          <button
            onClick={() => setWizardOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Step Progress Indicator */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '8px 0' }}>
          {[
            { id: 1, name: 'Topology' },
            { id: 2, name: 'Servers' },
            { id: 3, name: 'Network' },
            { id: 4, name: 'VLANs & MTU' },
            { id: 5, name: 'Cabling' },
          ].map((s) => (
            <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  height: '4px',
                  borderRadius: '2px',
                  background: step >= s.id ? 'linear-gradient(90deg, #00e5ff, #3b82f6)' : 'rgba(255,255,255,0.1)',
                  boxShadow: step >= s.id ? '0 0 8px rgba(0, 229, 255, 0.5)' : 'none',
                }}
              />
              <span style={{ fontSize: '11px', color: step >= s.id ? '#00e5ff' : '#64748b', fontWeight: step === s.id ? 700 : 500 }}>
                {s.id}. {s.name}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: '#38bdf8' }}>
                Step 1: Select Cluster Topology Target
              </h3>
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 16px' }}>
                Choose the Azure Local network pattern: switchless or switched storage, single rack or rack-aware (two zones).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {PRESETS.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setPresetId(item.id)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: presetId === item.id ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      border: presetId === item.id ? '2px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: '16px', fontWeight: 700, color: presetId === item.id ? '#00e5ff' : '#ffffff' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', lineHeight: 1.4 }}>
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: '#38bdf8' }}>
                Step 2: Select OEM Server Hardware Profile
              </h3>
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 16px' }}>
                Select validated Dell PowerEdge HCI node hardware for Azure Local deployment.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {[
                  { model: 'AX-760', specs: '2U Dual-Socket Xeon 4th Gen, 2x 25GbE Mellanox CX6-Lx, iDRAC9 Enterprise', badge: 'Popular Enterprise' },
                  { model: 'AX-660', specs: '1U High-Density Xeon 4th Gen, 2x 25GbE Mellanox CX6-Lx, iDRAC9', badge: 'High Density 1U' },
                  { model: 'AX-770', specs: '2U, iDRAC9, OCP 3.0 dual 25G plus PCIe dual 25G (reference port layout)', badge: 'Next-Gen 2U' },
                  { model: 'AX-670', specs: '1U, iDRAC9, OCP 3.0 dual 25G plus PCIe dual 25G (reference port layout)', badge: 'Next-Gen 1U' },
                ].map((item) => (
                  <div
                    key={item.model}
                    onClick={() => setServerModel(item.model)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: serverModel === item.model ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      border: serverModel === item.model ? '2px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: serverModel === item.model ? '#00e5ff' : '#ffffff' }}>
                        Dell PowerEdge {item.model}
                      </span>
                      <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        {item.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', lineHeight: 1.4 }}>
                      {item.specs}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: '#38bdf8' }}>
                Step 3: Network & Management Infrastructure
              </h3>
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 16px' }}>
                Choose ToR Ethernet switches and serial console management servers.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>Top-of-Rack (ToR) Switch Pair:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { name: 'Arista 7050SX3', desc: '48x 25GbE SFP28 + 8x 100GbE QSFP28, ultra-low latency MLAG pair' },
                      { name: 'Cisco Nexus 93180YC', desc: '48x 25GbE SFP28 + 6x 100GbE, vPC dual-ToR HA pair' },
                      { name: 'Dell PowerSwitch S5248F-ON', desc: '48x 25GbE SFP28 + 4x 100GbE QSFP28 + 2x QSFPDD ToR HCI switch' },
                      { name: 'Dell PowerSwitch S5224F-ON', desc: '24x 25GbE SFP28 + 4x 100GbE QSFP28 small-scale ToR switch' },
                      { name: 'Nvidia Spectrum SN2100', desc: '16x 100GbE QSFP28 ultra-low latency RoCEv2 fabric switch' },
                    ].map((sw) => (
                      <div
                        key={sw.name}
                        onClick={() => setSwitchModel(sw.name)}
                        style={{
                          padding: '14px',
                          borderRadius: '10px',
                          background: switchModel === sw.name ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                          border: switchModel === sw.name ? '2px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: switchModel === sw.name ? '#00e5ff' : '#ffffff', fontSize: '14px' }}>{sw.name}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', lineHeight: 1.3 }}>{sw.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>Out-of-Band (OOB) Management & Console:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { name: 'Opengear OM2248', desc: '48-Port Serial Console & Management Server with Smart OOB' },
                      { name: 'Opengear CM8148', desc: '48-Port Enterprise Console Server with Dual AC Power' },
                      { name: 'Dell PowerSwitch N3248TE-ON', desc: '48-Port 1GbE RJ45 + 4x 10GbE SFP+ OOB Management Switch' },
                      { name: 'Dell PowerSwitch S3148P', desc: '48-Port 1GbE RJ45 + 2x 10GbE SFP+ OOB Management Switch' },
                    ].map((oob) => (
                      <div
                        key={oob.name}
                        onClick={() => setOobConsole(oob.name)}
                        style={{
                          padding: '14px',
                          borderRadius: '10px',
                          background: oobConsole === oob.name ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                          border: oobConsole === oob.name ? '2px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: oobConsole === oob.name ? '#00e5ff' : '#ffffff', fontSize: '14px' }}>{oob.name}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', lineHeight: 1.3 }}>{oob.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: '#38bdf8' }}>
                Step 4: Network ATC Intents, VLANs & MTU
              </h3>
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 16px' }}>
                Group the host adapters into Network ATC intents, then set the VLAN tags. Network ATC defaults storage to VLAN 711 and 712 (third adapter 713); management and compute VLANs are yours to choose.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                {INTENT_MODELS.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setIntentModel(m.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: intentModel === m.id ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                      border: intentModel === m.id ? '2px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '13px', color: intentModel === m.id ? '#00e5ff' : '#ffffff' }}>{m.title}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', lineHeight: 1.3 }}>{m.desc}</div>
                  </div>
                ))}
              </div>
              {intentFallback && (
                <div role="status" style={{ fontSize: '12px', color: '#fbbf24', marginBottom: '12px' }}>
                  {intentModel} is not available for this pattern or server model; the diagram will use {effectivePlan.model}.
                </div>
              )}
              {collisions.length > 0 && (
                <div role="status" style={{ fontSize: '12px', color: '#fbbf24', marginBottom: '12px' }}>
                  {collisions.map((c) => `${c.name} VLAN ${c.vlan}`).join(' and ')} collides with the Network ATC storage defaults (711 to 719). It is allowed, but set StorageVlans explicitly or pick another ID.
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Management VLAN ID:</label>
                  <input
                    type="number"
                    value={mgmtVlan}
                    onChange={(e) => setMgmtVlan(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Compute / VM Traffic VLAN ID:</label>
                  <input
                    type="number"
                    value={computeVlan}
                    onChange={(e) => setComputeVlan(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Storage 1 (RoCEv2) VLAN ID:</label>
                  <input
                    type="number"
                    value={storageVlan1}
                    onChange={(e) => setStorageVlan1(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Storage 2 (RoCEv2) VLAN ID:</label>
                  <input
                    type="number"
                    value={storageVlan2}
                    onChange={(e) => setStorageVlan2(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                  />
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Storage MTU (Jumbo Frames):</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[9000, 1500].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMtu(m)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        background: mtu === m ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                        border: mtu === m ? '1px solid #00e5ff' : '1px solid transparent',
                        color: mtu === m ? '#00e5ff' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      MTU {m} {m === 9000 ? '(Jumbo, recommended; required only for iWARP)' : '(Standard)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: '#38bdf8' }}>
                Step 5: Physical Media Selection & Review
              </h3>
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 16px' }}>
                Review topology parameters and select cabling media before generating the diagram.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                {[
                  { media: 'DAC 25G', desc: 'Direct Attach Copper (Passive SFP28 25GbE, 3m/5m)' },
                  { media: 'MMF 100G', desc: 'Multi-Mode Fiber Optic (QSFP28 100GbE SR4, OM4 LC)' },
                ].map((cm) => (
                  <div
                    key={cm.media}
                    onClick={() => setCableMedia(cm.media as WizardTopologyConfig['cableMedia'])}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      background: cableMedia === cm.media ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                      border: cableMedia === cm.media ? '2px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: cableMedia === cm.media ? '#00e5ff' : '#ffffff' }}>{cm.media}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{cm.desc}</div>
                  </div>
                ))}
              </div>

              {/* Summary Box */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#00e5ff', marginBottom: '8px' }}>
                  Architecture Configuration Summary:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                  <div>• Pattern: <strong>{preset.title}</strong></div>
                  <div>• Intents: <strong>{effectivePlan.intents.map((i) => i.name).join(', ')}</strong></div>
                  <div>• Server Model: <strong>Dell PowerEdge {serverModel}</strong></div>
                  <div>• ToR Switches: <strong>{preset.pattern === 'rack-aware' ? 'Two per zone' : 'Pair of'} {switchModel}</strong></div>
                  <div>• OOB Console: <strong>{oobConsole}</strong></div>
                  <div>• Mgmt / Compute VLAN: <strong>VLAN {mgmtVlan} / {computeVlan}</strong></div>
                  <div>• Storage VLANs: <strong>VLAN {storageVlan1} / {storageVlan2} (MTU {mtu})</strong></div>
                  <div>• Cabling Media: <strong>{cableMedia}</strong></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            disabled={step === 1}
            onClick={() => setStep((s) => s - 1)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: step === 1 ? '#475569' : '#fff',
              cursor: step === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            ← Previous
          </button>

          {step < 5 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00e5ff, #3b82f6)',
                border: 'none',
                color: '#0f172a',
                cursor: 'pointer',
                fontWeight: 800,
                boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)',
              }}
            >
              Next Step →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={choiceError !== null}
              title={choiceError ?? undefined}
              style={{
                padding: '12px 28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: 800,
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
                fontSize: '15px',
              }}
            >
              ⚡ Generate Topology & Open Designer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
