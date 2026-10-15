import { useState } from 'react';
import { useEditorStore } from '@/state/useEditorStore';
import LandingHeader, { type LandingTab } from '@/features/landing/LandingHeader';
import { COMPLIANCE_RULES } from '@/types/validation';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<LandingTab>('home');
  const [aboutSubTab, setAboutSubTab] = useState<'overview' | 'releasenotes' | 'changelog' | 'roadmap' | 'credits'>('overview');
  const [docsCategory, setDocsCategory] = useState<'cabling' | 'logical' | 'auditor' | 'exporter'>('cabling');
  const setActiveView = useEditorStore((state) => state.setActiveView);
  const setWizardOpen = useEditorStore((state) => state.setWizardOpen);
  const theme = useEditorStore((state) => state.theme);
  const isLight = theme === 'light';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isLight ? 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' : 'radial-gradient(ellipse at top, #0f172a 0%, #090d16 100%)',
        color: isLight ? '#0f172a' : '#f8fafc',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Top Bar Navigation */}
      <LandingHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Body */}
      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Work-In-Progress Development Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.08) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.15)',
          }}
        >
          <div style={{ fontSize: '24px' }}>🚧</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Active Development Notice — Project In Progress
            </div>
            <div style={{ fontSize: '13px', color: isLight ? '#334155' : '#cbd5e1', marginTop: '2px', lineHeight: 1.5 }}>
              This site is under continuous rapid development and iteration. Features, hardware profiles, export schemas, and tools are subject to frequent updates. Expect experimental features to evolve.
            </div>
          </div>
        </div>

        {/* HOME PAGE (Clean Hero & Features — NO Left Sidebar Here!) */}
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {/* Hero Section */}
            <div style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  alignSelf: 'center',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  background: 'rgba(0, 229, 255, 0.1)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  color: '#00e5ff',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                <span>⚡ Version 0.9.0-preview (Active Development)</span>
              </div>

              <h1
                style={{
                  fontSize: '48px',
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: '-1.5px',
                  margin: 0,
                  color: isLight ? '#0f172a' : '#ffffff',
                }}
              >
                Enterprise Azure Local & Hyper-V Infrastructure Designer
              </h1>

              <p style={{ fontSize: '18px', color: isLight ? '#475569' : '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                Design physical node-to-switch topologies, logical HCI VLAN isolation, SET team port cabling, and run automated pre-flight compliance audits before deployment.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px' }}>
                <button
                  onClick={() => setActiveView('designer')}
                  style={{
                    padding: '14px 32px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #00e5ff 0%, #3b82f6 100%)',
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 0 30px rgba(0, 229, 255, 0.4)',
                  }}
                >
                  🚀 Launch Canvas Designer
                </button>

                <button
                  onClick={() => {
                    setActiveView('designer');
                    setWizardOpen(true);
                  }}
                  style={{
                    padding: '14px 32px',
                    borderRadius: '12px',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.2)',
                    background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                    color: isLight ? '#0f172a' : '#ffffff',
                    fontWeight: 700,
                    fontSize: '16px',
                    cursor: 'pointer',
                  }}
                >
                  🧙 Guided 5-Step Cluster Wizard
                </button>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {[
                {
                  icon: '🖥️',
                  title: 'OEM Server & Switch Catalog',
                  desc: 'Pre-configured hardware profiles for Dell PowerEdge AX-760, AX-660, AX-770, AX-670, Arista 7050SX3, Cisco Nexus 9300, and Opengear console managers.',
                },
                {
                  icon: '🔌',
                  title: '2.5D Port Cabling Geometry',
                  desc: 'Pin-level SFP28/QSFP28 port coordinate anchors, cable media classification (DAC 25G/100G, MMF, Cat6A, RS-232), and SET team glowing overlays.',
                },
                {
                  icon: '🌐',
                  title: 'Logical HCI VLAN Boundaries',
                  desc: 'Multi-layer view HUD ([ 🔌 Physical ], [ 🌐 Logical ], [ 🔀 Hybrid ]) with overlaid VLAN zones (example management 7 and compute 8, Network ATC storage 711/712/713) and MTU 9000 badges.',
                },
                {
                  icon: '🛡️',
                  title: 'Pre-Flight Compliance Auditor',
                  desc: 'Automated compliance rule engine checking dual-ToR redundancy, storage MTU 9000 jumbo frames, SET team port balance, and OOB management connectivity.',
                },
                {
                  icon: '📊',
                  title: 'Cabling & Port Map Exports',
                  desc: 'Export Technician Cabling Schedules in CSV format and Switch Port Map specs in TXT format for seamless datacenter deployment handoff.',
                },
                {
                  icon: '🧙',
                  title: 'Guided Setup Wizard',
                  desc: '5-step interactive wizard assistant generating pre-wired, pre-validated Azure Local cluster topologies in seconds.',
                },
              ].map((feat, i) => (
                <div
                  key={i}
                  style={{
                    background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ fontSize: '28px' }}>{feat.icon}</div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: isLight ? '#0f172a' : '#f1f5f9' }}>{feat.title}</h3>
                  <p style={{ fontSize: '14px', color: isLight ? '#475569' : '#94a3b8', lineHeight: 1.5, margin: 0 }}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABOUT PAGE (With Left Vertical Navigation Sidebar) */}
        {activeTab === 'about' && (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', alignItems: 'start' }}>
            {/* Left Vertical Navigation Menu */}
            <aside
              style={{
                background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                position: 'sticky',
                top: '90px',
                boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.04)' : 'none',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: isLight ? '#0284c7' : '#00e5ff', textTransform: 'uppercase', letterSpacing: '1px', padding: '8px 12px 4px' }}>
                About Navigation
              </div>

              {[
                { id: 'overview', icon: 'ℹ️', label: 'Overview & Features' },
                { id: 'releasenotes', icon: '📋', label: 'Release Notes' },
                { id: 'changelog', icon: '📜', label: 'Change Logs' },
                { id: 'roadmap', icon: '🗺️', label: 'Product Roadmap' },
                { id: 'credits', icon: '❤️', label: 'Credits & License' },
              ].map((item) => {
                const isSelected = aboutSubTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setAboutSubTab(item.id as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isSelected ? (isLight ? 'rgba(2, 132, 199, 0.12)' : 'rgba(0, 229, 255, 0.15)') : 'transparent',
                      color: isSelected ? (isLight ? '#0284c7' : '#00e5ff') : (isLight ? '#334155' : '#cbd5e1'),
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </aside>

            {/* Right Main Content Pane */}
            <div style={{ minWidth: 0 }}>
              {/* SUB-VIEW 1: OVERVIEW & MISSION */}
              {aboutSubTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {/* Header */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: isLight ? '#0284c7' : '#00e5ff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                      Architecture Platform & Mission
                    </div>
                    <h2 style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 12px', color: isLight ? '#0f172a' : '#ffffff', letterSpacing: '-0.5px' }}>
                      About Draftsman
                    </h2>
                    <p style={{ fontSize: '16px', color: isLight ? '#475569' : '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                      Draftsman is an open-source, browser-based cabling and compliance diagramming tool for <strong>Azure Local</strong> network architectures: switched, switchless and rack-aware, with Network ATC intents checked against Microsoft Learn.
                    </p>
                  </div>

                  {/* Mission Statement Card */}
                  <div
                    style={{
                      background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(0, 229, 255, 0.3)',
                      borderRadius: '16px',
                      padding: '28px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: isLight ? '#0284c7' : '#00e5ff', margin: 0 }}>
                      🎯 Core Mission & Problem Solved
                    </h3>
                    <p style={{ fontSize: '14px', color: isLight ? '#334155' : '#cbd5e1', lineHeight: 1.7, margin: 0 }}>
                      Deploying enterprise Azure Local HCI clusters requires strict adherence to physical cabling topology, dual Top-of-Rack (ToR) switch cross-connects, Switch Embedded Teaming (SET) port distribution, and Storage Spaces Direct (S2D) RoCEv2 RDMA traffic isolation. Manual wiring spreadsheets and static 2D diagrams frequently lead to misconfigured ports, single points of failure, and costly deployment delays.
                    </p>
                    <p style={{ fontSize: '14px', color: isLight ? '#334155' : '#cbd5e1', lineHeight: 1.7, margin: 0 }}>
                      Draftsman bridges the gap between high-level architectural planning and ground-level physical installation by providing real-time 2.5D canvas visualization, instant compliance validation, and automated cabling schedule exports.
                    </p>
                  </div>

                  {/* System Architecture Modules Grid */}
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', marginBottom: '16px' }}>
                      Core System Architecture
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                      {[
                        {
                          title: '🎨 2.5D Isometric Vector Engine',
                          desc: 'Custom HTML5 Canvas 2D rendering pipeline executing 60fps vector projections for server chassis, switches, patch panels, and pin-level SFP28/QSFP28 port coordinates.',
                        },
                        {
                          title: '🛡️ Automated Compliance Auditor',
                          desc: 'Real-time rule engine with 16 pattern-aware rules (ToR redundancy, switchless mesh, rack-aware zones, VLAN alignment, Network ATC intents, storage MTU, SET balance, OOB), each linked to Microsoft Learn.',
                        },
                        {
                          title: '🌐 Multi-Layer View Isolation',
                          desc: 'Multi-layer HUD enabling instant switching between physical port wiring and logical HCI VLAN boundaries (example management 7 and compute 8, Network ATC storage 711/712/713).',
                        },
                        {
                          title: '📄 Datacenter Handoff Exporters',
                          desc: 'Generates Cabling Schedule CSV manifests for installation technicians and Switch Port Map TXT specs for network engineers configuring Arista EOS or Cisco NX-OS.',
                        },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: isLight ? '#ffffff' : 'rgba(0,0,0,0.3)',
                            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '14px',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <h4 style={{ fontSize: '16px', fontWeight: 800, color: isLight ? '#0284c7' : '#00e5ff', margin: 0 }}>{item.title}</h4>
                          <p style={{ fontSize: '13px', color: isLight ? '#475569' : '#94a3b8', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-VIEW 2: RELEASE NOTES */}
              {aboutSubTab === 'releasenotes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: isLight ? '#0284c7' : '#00e5ff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                      Official Version Documentation
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 8px', color: isLight ? '#0f172a' : '#ffffff' }}>
                      📋 Release Notes — Draftsman v0.2.0
                    </h2>
                    <p style={{ fontSize: '15px', color: isLight ? '#475569' : '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                      Comprehensive release documentation detailing the enterprise infrastructure architecture, hardware catalog extensions, pre-flight compliance auditor engine, and reporting exporters.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {[
                      {
                        phase: 'Phase 5 — Reporting & Schedule Exporters',
                        badge: 'v0.9.0 Feature',
                        color: '#10b981',
                        summary: 'Production-ready handoff exporters for datacenter technicians and network engineers.',
                        details: [
                          'Cabling Schedule Exporter (CSV): Cable ID, Source Node, Source Port, Target Switch, Target Port, Cable Media (DAC/MMF/Cat6A), Speed (Gbps), and VLAN tag.',
                          'Switch Port Provisioning Map (TXT): Generates switch port allocation specs formatted for network engineers configuring Arista EOS or Cisco NX-OS switch trunk profiles.',
                          'Export Menu Integration: Integrated direct download actions into top toolbar Export menu.',
                        ],
                      },
                      {
                        phase: 'Phase 4 — Pre-Flight Compliance Auditor Engine',
                        badge: 'v0.9.0 Feature',
                        color: '#f59e0b',
                        summary: 'Real-time rule engine evaluating diagram topologies against enterprise network standards.',
                        details: [
                          'RULE-TOR-REDUNDANCY (🔴 Error): Flags host nodes connected to only a single ToR switch; mandates dual-ToR cross-connect.',
                          'RULE-MTU-JUMBO (🟡 Warning): Flags Storage/RDMA paths configured with MTU 1500 instead of Jumbo Frames MTU 9000.',
                          'RULE-SET-PORT-BALANCE (🟡 Warning): Verifies physical ports in a SET team cross-connect to separate physical switches.',
                          'RULE-VLAN-ALIGNMENT (🔴 Error): Detects mismatched VLAN tags between hosts and switch trunk ports.',
                          'RULE-OOB-MANAGEMENT (ℹ️ Info): Verifies server nodes have iDRAC/iLO ports cabled to OOB switches or Opengear console managers.',
                        ],
                      },
                      {
                        phase: 'Phase 3 — Multi-Layer View Modes & Subnet Isolation',
                        badge: 'v0.9.0 Feature',
                        color: '#a855f7',
                        summary: 'Multi-layer view toggling between physical wiring and logical HCI VLAN boundaries.',
                        details: [
                          'View Mode Toolbar: Floating HUD supporting [ 🔌 Physical ], [ 🌐 Logical ], and [ 🔀 Hybrid ] view modes.',
                          'Logical HCI VLAN Profiles: Overlaid boundary glow zones for Management (example VLAN 7), Compute (example VLAN 8), and Storage 1 to 3 (Network ATC defaults VLAN 711, 712, 713).',
                          'CIDR & MTU Badges: Subnet CIDR tags (10.71.1.0/24) and Jumbo Frames MTU 9000 indicators.',
                        ],
                      },
                      {
                        phase: 'Phase 2 — Port Cabling Geometry & Cable Catalog',
                        badge: 'v0.9.0 Feature',
                        color: '#3b82f6',
                        summary: 'Pin-level port anchors, cable media classification, and SET team overlays.',
                        details: [
                          '2.5D Port Coordinate Anchors: SFP28 and QSFP28 port anchor positioning on isometric hardware chassis.',
                          'Cable Media Catalog: DAC 25G/100G, MMF 100G, SMF, Cat6A RJ45, and RS-232 Serial Rollover.',
                          'Switch Embedded Teaming (SET): Glowing cyan boundary overlays highlighting ports bound in a Hyper-V SET team.',
                        ],
                      },
                      {
                        phase: 'Phase 1 — OEM Hardware Catalog & 2.5D Renderers',
                        badge: 'v0.9.0 Feature',
                        color: '#00e5ff',
                        summary: 'Validated hardware profiles and custom isometric canvas renderers.',
                        details: [
                          'OEM Server Catalog: Dell PowerEdge AX-760, AX-660, AX-770, and AX-670 hardware profiles.',
                          'OEM Switch & Console Catalog: Arista 7050SX3, Cisco Nexus 9300, Opengear OM2248/CM8148 console managers, and Dell N3248TE/S3148P OOB switches.',
                          'Palette Brand Tabs: Hardware palette filter tabs for All, Dell, Arista, Cisco, Opengear, and Nvidia.',
                        ],
                      },
                    ].map((note, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
                          border: `1px solid ${note.color}40`,
                          borderRadius: '14px',
                          padding: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ fontSize: '17px', fontWeight: 800, color: note.color, margin: 0 }}>{note.phase}</h3>
                          <span style={{ fontSize: '11px', fontWeight: 700, background: `${note.color}20`, color: note.color, padding: '3px 8px', borderRadius: '6px' }}>
                            {note.badge}
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', color: isLight ? '#334155' : '#cbd5e1', margin: 0, fontWeight: 600 }}>{note.summary}</p>
                        <ul style={{ paddingLeft: '18px', margin: 0, color: isLight ? '#64748b' : '#94a3b8', fontSize: '13px', lineHeight: 1.5 }}>
                          {note.details.map((d, dIdx) => <li key={dIdx}>{d}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-VIEW 3: CHANGE LOGS */}
              {aboutSubTab === 'changelog' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: isLight ? '#0284c7' : '#00e5ff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                      Commit & Release Timeline
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 8px', color: isLight ? '#0f172a' : '#ffffff' }}>
                      📜 Change Logs
                    </h2>
                    <p style={{ fontSize: '15px', color: isLight ? '#475569' : '#94a3b8', margin: 0 }}>
                      Chronological log of features, schema updates, bug fixes, and commit releases.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { version: 'v0.2.0', date: 'October 2026', title: 'Cabling and compliance tool: patterns, intents, rack-aware', points: ['16 pattern-aware auditor rules with Microsoft Learn references', 'Switchless, switched single-rack and rack-aware patterns; Network ATC intents; storage VLAN defaults 711/712/713', 'Wizard presets, draw.io export, cable schedule intent column, GitHub Pages deployment'] },
                      { version: 'v0.9.0-preview', date: 'July 2026', title: 'Enterprise Portal, Vertical About Menu & Setup Wizard', points: ['Built Landing Portal with vertical Left Sidebar Navigation for Release Notes, Change Logs, Roadmap, and Credits', 'Built 5-Step Guided Architecture Setup Wizard for 2/4/8-node Dell cluster generation', 'Created PMO Backlog (pmo/BACKLOG.md) and Site Audit (pmo/COMPREHENSIVE_SITE_AUDIT.md)', 'Added active development notice banner and open-source upstream credits'] },
                      { version: 'v0.8.5-preview', date: 'July 2026', title: 'Phase 5 Cabling CSV & Port Map TXT Exporters', points: ['Implemented exportCableScheduleCsv.ts for technician cabling manifests', 'Implemented exportSwitchPortMap.ts for network engineer CLI trunk specs', 'Integrated CSV and TXT download options in top Export menu'] },
                      { version: 'v0.8.0-preview', date: 'July 2026', title: 'Phase 4 Pre-Flight Compliance Auditor Engine', points: ['Created diagramAuditor.ts evaluating 5 core network compliance rules', 'Added pulsating red/yellow alert canvas badges (renderValidationBadges.ts)', 'Built collapsible audit drawer UI (CompliancePanel.tsx)'] },
                      { version: 'v0.7.0-preview', date: 'July 2026', title: 'Phase 3 Multi-Layer Views & Subnet Isolation', points: ['Added ViewModeToolbar.tsx floating HUD toolbar ([ 🔌 Physical ], [ 🌐 Logical ], [ 🔀 Hybrid ])', 'Overlaid HCI VLAN profile zones (VLAN 711-714) and CIDR tags', 'Added Jumbo Frames MTU 9000 indicators'] },
                      { version: 'v0.6.0-preview', date: 'July 2026', title: 'Phase 2 Port Cabling Geometry & Cable Catalog', points: ['Added 2.5D port coordinate anchors on hardware node faceplates', 'Added cable media classification (DAC 25G/100G, MMF, SMF, Cat6A, RS-232)', 'Added Switch Embedded Teaming (SET) glowing boundary overlays'] },
                      { version: 'v0.5.0-preview', date: 'July 2026', title: 'Phase 1 OEM Hardware Catalog & 2.5D Canvas Renderers', points: ['Added Dell PowerEdge AX-760, AX-660, AX-770, AX-670 hardware profiles', 'Added Arista 7050SX3, Cisco Nexus 9300, Opengear OM2248 custom renderers', 'Added brand hardware palette filter tabs in ShapePalette.tsx'] },
                    ].map((rel) => (
                      <div key={rel.version} style={{ background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.02)', border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: isLight ? '#0284c7' : '#00e5ff' }}>{rel.version} — {rel.title}</span>
                          <span style={{ fontSize: '12px', color: isLight ? '#64748b' : '#64748b' }}>{rel.date}</span>
                        </div>
                        <ul style={{ paddingLeft: '20px', margin: '8px 0 0', color: isLight ? '#334155' : '#cbd5e1', fontSize: '13px', lineHeight: 1.5 }}>
                          {rel.points.map((p, idx) => <li key={idx}>{p}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-VIEW 4: ROADMAP */}
              {aboutSubTab === 'roadmap' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: isLight ? '#0284c7' : '#00e5ff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                      Architecture Vision
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 8px', color: isLight ? '#0f172a' : '#ffffff' }}>
                      🗺️ Product Roadmap
                    </h2>
                    <p style={{ fontSize: '15px', color: isLight ? '#475569' : '#94a3b8', margin: 0 }}>
                      Planned work. Items are not committed dates.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    {[
                      { quarter: 'Next', title: '🗄️ Rack Elevation Diagrams', desc: 'Auto-layout 19-inch rack elevations from node rack coordinates (U1 to U42).' },
                      { quarter: 'Next', title: '📏 Cable Lengths in the Schedule', desc: 'Capture cable length and add it to the cable schedule CSV.' },
                      { quarter: 'Next', title: '🎞️ Traffic Flow Player', desc: 'Step-by-step playback of animated paths from a node through the ToR switches to its destination.' },
                      { quarter: 'Later', title: '🧩 Switch QoS Snippets', desc: 'Reference PFC and ETS configuration snippets for the ToR ports the auditor flags as RoCE-carrying.' },
                    ].map((item, i) => (
                      <div key={i} style={{ background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.02)', border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(0, 229, 255, 0.2)', borderRadius: '14px', padding: '20px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: isLight ? '#0284c7' : '#38bdf8', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.quarter}</span>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', margin: '4px 0 8px' }}>{item.title}</h3>
                        <p style={{ fontSize: '13px', color: isLight ? '#475569' : '#94a3b8', lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-VIEW 5: CREDITS */}
              {aboutSubTab === 'credits' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: isLight ? '#0284c7' : '#00e5ff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                      Attribution & License
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 8px', color: isLight ? '#0f172a' : '#ffffff' }}>
                      ❤️ Credits & Open-Source Acknowledgements
                    </h2>
                    <p style={{ fontSize: '15px', color: isLight ? '#475569' : '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                      Draftsman is built on open-source software. We express our deep gratitude to the upstream creators, framework authors, and contributors.
                    </p>
                  </div>

                  {/* Upstream Author Card */}
                  <div
                    style={{
                      background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(0, 229, 255, 0.4)',
                      borderRadius: '16px',
                      padding: '28px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '28px' }}>👤</span>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 900, color: isLight ? '#0284c7' : '#00e5ff', margin: 0 }}>
                          Upstream Project Creator & Baseline Author
                        </h3>
                        <div style={{ fontSize: '14px', color: isLight ? '#0f172a' : '#f8fafc', fontWeight: 700, marginTop: '2px' }}>
                          Cristian Edwards Sabathe — <a href="https://github.com/CristianEdwards/AzLoFlows" target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', textDecoration: 'underline' }}>CristianEdwards/AzLoFlows</a>
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: isLight ? '#334155' : '#e2e8f0', lineHeight: 1.7, margin: 0 }}>
                      We extend our sincere appreciation to <strong>Cristian Edwards Sabathe</strong> for creating the original open-source <strong>AzLoFlows</strong> project under the <strong>MIT License</strong>. Cristian authored the baseline HTML5 2.5D isometric vector canvas, isometric projection coordinate transform helpers, neon visual tokens, and scenario-based flow filtering engine.
                    </p>
                    <div style={{ background: isLight ? '#f1f5f9' : 'rgba(0,0,0,0.4)', padding: '14px', borderRadius: '10px', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)', fontSize: '13px', color: isLight ? '#475569' : '#94a3b8' }}>
                      <strong>Upstream Repository:</strong> <a href="https://github.com/CristianEdwards/AzLoFlows" target="_blank" rel="noopener noreferrer" style={{ color: isLight ? '#0284c7' : '#00e5ff' }}>https://github.com/CristianEdwards/AzLoFlows</a>  
                      <br />
                      <strong>License:</strong> MIT License — Copyright (c) 2026 Cristian Edwards Sabathe
                    </div>
                  </div>

                  {/* Maintainers & Core Frameworks */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    {[
                      { name: 'React 19 & React-DOM', author: 'Meta & React Team', desc: 'Virtual DOM & UI component engine.' },
                      { name: 'Zustand v5', author: 'Poimandres', desc: 'Immutable state store & undo/redo history.' },
                      { name: 'Vite 6', author: 'Evan You & Vite Team', desc: 'Next-gen build tool & HMR dev server.' },
                      { name: 'TypeScript 5.8', author: 'Microsoft', desc: 'Strict static typechecking system.' },
                    ].map((lib, idx) => (
                      <div key={idx} style={{ background: isLight ? '#ffffff' : 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontWeight: 800, color: isLight ? '#0284c7' : '#00e5ff', fontSize: '14px' }}>{lib.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>By {lib.author}</div>
                        <p style={{ fontSize: '12px', color: isLight ? '#475569' : '#94a3b8', margin: '4px 0 0', lineHeight: 1.4 }}>{lib.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HOW-TO & DOCUMENTATION TAB */}
        {activeTab === 'docs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px', color: '#00e5ff' }}>
                Draftsman Documentation & Technical Standards Guide
              </h2>
              <p style={{ fontSize: '15px', color: '#94a3b8', margin: 0 }}>
                Comprehensive reference guides for Azure Local physical network wiring, logical HCI VLAN isolation, and auditor validation rules.
              </p>
            </div>

            {/* Docs Sub-tabs */}
            <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              {[
                { id: 'cabling', label: '🔌 Physical Cabling Standards' },
                { id: 'logical', label: '🌐 Logical HCI VLANs' },
                { id: 'auditor', label: '🛡️ Pre-Flight Auditor Rules' },
                { id: 'exporter', label: '📊 Exporter Workflows' },
              ].map((dt) => (
                <button
                  key={dt.id}
                  onClick={() => setDocsCategory(dt.id as any)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    background: docsCategory === dt.id ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                    border: docsCategory === dt.id ? '1px solid rgba(0, 229, 255, 0.4)' : '1px solid transparent',
                    color: docsCategory === dt.id ? '#00e5ff' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  {dt.label}
                </button>
              ))}
            </div>

            {/* Docs Content Area */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '32px' }}>
              {docsCategory === 'cabling' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: 1.6 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8', margin: 0 }}>
                    Physical Node-to-Switch Cabling Architecture
                  </h3>
                  <p style={{ color: '#cbd5e1', margin: 0 }}>
                    Azure Local HCI host nodes require high-availability physical connectivity across redundant Top-of-Rack (ToR) switches to ensure fault tolerance against switch failures or firmware maintenance.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <h4 style={{ color: '#00e5ff', margin: '0 0 8px' }}>Dual-ToR Cross-Connect Requirement</h4>
                      <ul style={{ paddingLeft: '20px', margin: 0, color: '#94a3b8', fontSize: '13px' }}>
                        <li>pNIC1 on Host Node connects to ToR Switch A (SFP28 / QSFP28 port).</li>
                        <li>pNIC2 on Host Node connects to ToR Switch B.</li>
                        <li>Ensures zero-downtime failover via Switch Embedded Teaming (SET).</li>
                      </ul>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <h4 style={{ color: '#00e5ff', margin: '0 0 8px' }}>Out-of-Band (OOB) & Serial Console</h4>
                      <ul style={{ paddingLeft: '20px', margin: 0, color: '#94a3b8', fontSize: '13px' }}>
                        <li>Dedicated iDRAC / iLO RJ45 Cat6A connection to OOB switch.</li>
                        <li>Serial RS-232 connections wired to Opengear console manager.</li>
                        <li>Enables remote bare-metal provisioning and power control.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {docsCategory === 'logical' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: 1.6 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8', margin: 0 }}>
                    Logical Network Isolation & HCI VLAN Profile
                  </h3>
                  <p style={{ color: '#cbd5e1', margin: 0 }}>
                    Traffic isolation is enforced at the network level using dedicated VLAN tags and Subnet CIDRs for Management, Compute, and Storage RoCEv2 traffic.
                  </p>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#00e5ff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <th style={{ padding: '10px' }}>Network Traffic Type</th>
                        <th style={{ padding: '10px' }}>Default VLAN ID</th>
                        <th style={{ padding: '10px' }}>MTU Requirement</th>
                        <th style={{ padding: '10px' }}>Description</th>
                      </tr>
                    </thead>
                    <tbody style={{ color: '#cbd5e1' }}>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px', fontWeight: 700 }}>Management Network</td>
                        <td style={{ padding: '10px' }}>VLAN 7 (example)</td>
                        <td style={{ padding: '10px' }}>MTU 1500</td>
                        <td style={{ padding: '10px' }}>Host OS management, Arc agent, & WAC communication</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px', fontWeight: 700 }}>Compute / VM Traffic</td>
                        <td style={{ padding: '10px' }}>VLAN 8 (example)</td>
                        <td style={{ padding: '10px' }}>MTU 1500</td>
                        <td style={{ padding: '10px' }}>Virtual Machine tenant networks & Hyper-V vSwitch</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px', fontWeight: 700 }}>Storage 1 (RoCEv2)</td>
                        <td style={{ padding: '10px' }}>VLAN 711 (Network ATC default)</td>
                        <td style={{ padding: '10px', color: '#10b981', fontWeight: 700 }}>MTU 9000 (recommended)</td>
                        <td style={{ padding: '10px' }}>Storage Spaces Direct (S2D) RDMA, storage adapter 1</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '10px', fontWeight: 700 }}>Storage 2 (RoCEv2)</td>
                        <td style={{ padding: '10px' }}>VLAN 712 (Network ATC default)</td>
                        <td style={{ padding: '10px', color: '#10b981', fontWeight: 700 }}>MTU 9000 (recommended)</td>
                        <td style={{ padding: '10px' }}>Storage Spaces Direct (S2D) RDMA, storage adapter 2</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {docsCategory === 'auditor' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: 1.6 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8', margin: 0 }}>
                    Pre-Flight Compliance Auditor Engine Rules
                  </h3>
                  <p style={{ color: '#cbd5e1', margin: 0 }}>
                    The compliance auditor validates diagram topologies in real time against the Microsoft Learn network patterns and highlights misconfigurations with pulsating canvas badges. Severity shown is the highest the rule reports.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {COMPLIANCE_RULES.map((r) => ({ code: r.id, type: r.severity === 'error' ? '🔴 ERROR' : r.severity === 'warning' ? '🟡 WARNING' : 'ℹ️ INFO', desc: r.description })).map((rule) => (
                      <div key={rule.code} style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, color: '#00e5ff', fontSize: '14px' }}>{rule.code}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700 }}>{rule.type}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>{rule.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {docsCategory === 'exporter' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: 1.6 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8', margin: 0 }}>
                    Cabling Schedule & Switch Port Map Exports
                  </h3>
                  <p style={{ color: '#cbd5e1', margin: 0 }}>
                    Generate production-ready handoff documentation for datacenter technicians and network engineers directly from the top menu.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <h4 style={{ color: '#10b981', margin: '0 0 8px' }}>📄 Cabling Schedule (CSV)</h4>
                      <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                        Exports a complete cable manifest containing Cable ID, Source Node, Source Port, Target Switch, Target Port, Cable Media (DAC/MMF/Cat6A), Speed (Gbps), and VLAN tag for physical installation technicians.
                      </p>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <h4 style={{ color: '#10b981', margin: '0 0 8px' }}>📑 Switch Port Map (TXT)</h4>
                      <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                        Exports switch port allocation specifications formatted for network engineers configuring Arista eAPI or Cisco NX-OS trunk profiles.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
