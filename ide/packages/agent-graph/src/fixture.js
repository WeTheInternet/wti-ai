// A deterministic, fictional snapshot. These IDs have no external meaning.
export const snapshotAt = '2026-02-18T14:00:00Z';
const at = (time) => `2026-02-18T${time}:00Z`;
const agent = (id, name, role, neighborhood, order) => ({ id, name, role, neighborhood, order });
const link = (id, from, to, kind, status, time, label, attention) => ({
  id, from, to, kind, status, updatedAt: at(time), label, attention,
});

const pilotAgents = [
  agent('a-pilot', 'Pilot', 'Driver', 'Coordination', 0),
  agent('a-watch', 'Lookout', 'Observer', 'Coordination', 10),
  agent('a-triage', 'Switchboard', 'Coordinator', 'Coordination', 20),
  agent('a-vale', 'Vale', 'Person', 'Coordination', 30),
  agent('a-copy', 'Scribe', 'Helper', 'Design', 35),
  agent('a-design', 'Sketch', 'Design worker', 'Design', 40),
  agent('a-adapter', 'Patch', 'Adapter worker', 'Adapter', 50),
  agent('a-probe', 'Probe', 'Helper', 'Adapter', 60),
  agent('a-verify', 'Gauge', 'Verifier', 'Verification', 70),
  agent('a-archive', 'Shelf', 'Helper', 'Coordination', 80),
];

const pilotLinks = [
  link('l-observe', 'a-pilot', 'a-watch', 'delegation', 'active', '13:58', 'Report changes in the effort'),
  link('l-triage', 'a-pilot', 'a-triage', 'delegation', 'active', '13:55', 'Route the two parallel workstreams'),
  link('l-approval', 'a-pilot', 'a-vale', 'dependency', 'action', '13:57', 'Choose the compact fallback', {
    ownerId: 'a-vale', detail: 'Choose whether the compact layout should open on the map or on its summary.',
  }),
  link('l-copy', 'a-triage', 'a-copy', 'delegation', 'hold', '13:30', 'Copy is intentionally paused until the fallback is chosen'),
  link('l-design', 'a-triage', 'a-design', 'delegation', 'active', '13:59', 'Prototype the neighborhood view'),
  link('l-adapter', 'a-triage', 'a-adapter', 'delegation', 'active', '13:42', 'Prepare the standalone adapter'),
  link('l-probe', 'a-triage', 'a-probe', 'delegation', 'interrupted', '12:42', 'Browser check stopped when its test session closed'),
  link('l-design-verify', 'a-design', 'a-verify', 'dependency', 'check', '13:59', 'Check the proposed keyboard path'),
  link('l-adapter-verify', 'a-adapter', 'a-verify', 'dependency', 'active', '13:28', 'Verify the adapter against the same fixture'),
  link('l-archive', 'a-verify', 'a-archive', 'delegation', 'completed', '12:05', 'Filed the first layout sketch'),
];

const pilot = {
  id: 'effort-lantern', name: 'Project Lantern', description: 'Prototype a compact map for following agent handoffs.',
  driverId: 'a-pilot', agents: pilotAgents, links: pilotLinks,
  events: [
    { id: 'e-a11y', from: 'a-verify', to: 'a-design', kind: 'acknowledged', at: at('13:59'), label: 'Keyboard path received' },
    { id: 'e-adapter', from: 'a-triage', to: 'a-adapter', kind: 'queued', at: at('13:56'), label: 'Adapter review request' },
    { id: 'e-watch', from: 'a-watch', to: 'a-pilot', kind: 'acknowledged', at: at('13:58'), label: 'No new interruptions' },
    { id: 'e-request', from: 'a-pilot', to: 'a-watch', kind: 'acknowledged', at: at('13:54'), label: 'Observation request received' },
  ],
};

const crews = ['Layout', 'Input', 'Platform', 'Testing', 'Docs', 'Review'];
const variants = ['Lead', 'Aster', 'Bluet', 'Clover', 'Fern', 'Moss', 'Reed'];
const denseAgents = [
  pilotAgents[0], pilotAgents[2], pilotAgents[8],
  ...crews.flatMap((name, crew) => variants.map((variant, index) => agent(
    `a-dense-${crew}-${index}`, index ? `${variant} ${crew + 1}` : `${name} lead`,
    index && !(crew === 1 && index === 4) ? 'Worker' : 'Coordinator', name, 100 + crew * 10 + index,
  ))),
  agent('a-dense-owner', 'Juniper', 'Person', 'Coordination', 15),
  agent('a-dense-listen', 'Hush', 'Observer', 'Coordination', 12),
  agent('a-dense-final', 'Beacon', 'Verifier', 'Verification', 900),
];

const dense = {
  id: 'effort-greenhouse', name: 'Greenhouse drill', description: 'Six crews branch from Switchboard and reconverge on a shared verification path.',
  driverId: 'a-pilot', agents: denseAgents,
  links: [
    link('l-dense-start', 'a-pilot', 'a-triage', 'delegation', 'active', '13:59', 'Coordinate all six crews'),
    link('l-dense-listen', 'a-pilot', 'a-dense-listen', 'delegation', 'active', '13:57', 'Observe the drill'),
    link('l-dense-owner', 'a-pilot', 'a-dense-owner', 'dependency', 'action', '13:59', 'Choose a verification budget', {
      ownerId: 'a-dense-owner', detail: 'Pick the time limit for the shared verification pass.',
    }),
    ...crews.flatMap((name, crew) => {
      const lead = `a-dense-${crew}-0`;
      return [
        link(`l-dense-${crew}-start`, 'a-triage', lead, 'delegation', 'active', '13:52', `Start the ${name.toLowerCase()} crew`),
        ...variants.slice(1).flatMap((_, offset) => {
          const index = offset + 1;
          const worker = `a-dense-${crew}-${index}`;
          return [
            link(`l-dense-${crew}-${index}-work`, crew === 1 && index > 4 ? 'a-dense-1-4' : lead, worker, 'delegation', index === 5 ? 'hold' : 'active', index === 6 ? '12:45' : '13:48', 'Work the assigned slice'),
            link(`l-dense-${crew}-${index}-verify`, worker, 'a-verify', 'dependency', index === 1 ? 'check' : 'active', index === 1 ? '13:59' : '13:40', 'Hand off a result for verification'),
          ];
        }),
      ];
    }),
    link('l-dense-input-layout', 'a-dense-1-4', 'a-dense-0-2', 'dependency', 'active', '13:57', 'Check input behavior against Layout'),
    link('l-dense-layout-testing', 'a-dense-0-3', 'a-dense-3-0', 'dependency', 'check', '13:59', 'Hand the layout edge case to Testing'),
    link('l-dense-finish', 'a-verify', 'a-dense-final', 'dependency', 'check', '13:58', 'Run the final shared check'),
  ],
  events: [],
};

export const baseline = { pilot, dense };
