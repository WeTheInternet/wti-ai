import React, { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ageOf, bridgeTo, position, routeEdges, stateFor, topology } from './graph.js';
import './bubbles.css';
import { RadialMap } from './RadialMap.jsx';
import { makeRadialLayout } from './radial.js';
import { ReportAge, reportDestination, Status } from './report-ui.jsx';
import { needsOperatorAttention, ParticipantLedger, ParticipantReports } from './ParticipantLedger.jsx';
import { DatasetView } from './DatasetView.jsx';
import { communicationLabel, liveLinksOf, normalizeLinkStatus, selectionFor } from './model.ts';

const priority = ['action', 'interrupted', 'check', 'hold', 'unknown', 'active', 'completed'];
const byRecent = (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || a.id.localeCompare(b.id);
const utcFormat = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' });
const symbols = {
  Driver: '✱', Person: '◈', Coordinator: '⌘', Observer: '◉',
  'Design worker': '✦', 'Adapter worker': '⌁', Helper: '✚', Verifier: '✓', Worker: '◆',
};
const clock = (at) => utcFormat.format(new Date(at));
const roleAccent = Object.assign(Object.create(null), {
  Person: '#9f4b2e', Helper: '#796122', Observer: '#166c61', Verifier: '#166c61',
});

function AttentionCard({ link, agents, color, now, inspectorId, openAgent, historical }) {
  const { attention } = link;
  const affected = agents.get(attention?.affectedId) ?? agents.get(link.to);
  const owner = agents.get(attention?.ownerId);
  const reportedStatus = normalizeLinkStatus(attention?.reportedStatus ?? link.status);
  const next = attention?.nextStep;
  const destination = historical ? undefined : reportDestination(next?.href);
  return <article className="br-alert">
    <div className="br-alert-summary">
      <a href={`#${inspectorId}`} className="br-alert-agent" style={{ '--br-alert-agent-color': color(affected) }}
        onClick={(event) => {
          event.preventDefault();
          openAgent(affected.id);
        }}><span aria-hidden="true" />{affected.name}</a>
      <div className="br-alert-report" aria-label="Last reported state and age">
        <Status status={reportedStatus} />
        <ReportAge at={attention?.reportedAt ?? link.updatedAt} now={now} />
      </div>
    </div>
    <div className="br-alert-blocker">
      <span className="br-alert-label">Blocker</span>
      <strong>{link.label}</strong>
      {attention?.detail && <p>{attention.detail}</p>}
    </div>
    {next?.label && <div className="br-alert-next">
      <span className="br-alert-label">Next step</span>
      {destination ? <a href={destination}>{next.label}</a> : <p>{next.label}</p>}
    </div>}
    {owner && owner.id !== affected.id && <p className="br-alert-owner">Decision owner · {owner.name}</p>}
  </article>;
}


function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const node = ref.current;
    const measure = () => setWidth(Math.floor(node.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

function Details({ focus, neighbors, agentById, events, history, now, openAgent, host, reports, historical, staleAfterMs, ledger }) {
  if (!focus) return (
    <div className="br-inspector-overview">
      <div className="br-compass" aria-hidden="true">◎</div>
      <h3>Pick a bubble</h3>
      <p>See who that agent works with, what they’re waiting on, and which updates have been received.</p>
    </div>
  );
  return (
    <div className="br-inspection">
      <h3>{focus.name}</h3>
      <p>{focus.role} · {focus.neighborhood}</p>
      {reports && <ParticipantReports participant={focus} reports={reports} agents={agentById}
        now={now} historical={historical} staleAfterMs={staleAfterMs} onSelectAgent={openAgent} operatorId={ledger?.operatorId} />}
      {!!focus.artifacts?.length && <ArtifactActions key={focus.id} artifacts={focus.artifacts} capability={host?.openArtifact} />}
      <h4>Live neighbors <span>{neighbors.length}</span></h4>
      {neighbors.length === 0 && <p>No live connections.</p>}
      <ul className="br-connections">
        {neighbors.map((link) => {
          const outgoing = link.from === focus.id;
          const neighbor = agentById.get(outgoing ? link.to : link.from);
          const age = ageOf(link.updatedAt, now);
          return <li key={link.id}>
            <div className="br-neighbor-title">
              <button type="button" onClick={() => openAgent(neighbor.id)}>{neighbor.name} <span aria-hidden="true">↗︎</span></button>
              <Status status={link.status} />
            </div>
            <p>{outgoing ? 'Outgoing' : 'Incoming'} {link.kind} · {link.label}</p>
            <time dateTime={link.updatedAt} title={link.updatedAt}>
              {age.label}{age.className === 'stale' ? ' · Stale' : ''} · {clock(link.updatedAt)} UTC
            </time>
          </li>;
        })}
      </ul>
      <h4>Communication and receipts</h4>
      {events.length === 0 && <p>No events in this snapshot.</p>}
      <ul className="br-events">
        {events.map((event) => <li key={event.id}>
          <strong>{communicationLabel(event.kind)}</strong>
          <p>{event.label}</p>
          <p>{agentById.get(event.from)?.name} → {agentById.get(event.to)?.name} · <time dateTime={event.at}>{clock(event.at)} UTC</time> · {event.source}</p>
        </li>)}
      </ul>
      {history.length > 0 && <details className="br-history">
        <summary>Completed connections ({history.length})</summary>
        <ul>{history.map((link) => <li key={link.id}>{link.label} · <time dateTime={link.updatedAt}>{clock(link.updatedAt)} UTC</time></li>)}</ul>
      </details>}
    </div>
  );
}

function AgentBubble({ agent, point, isDriver, selected, muted, link, age, openAgent, radial, reportAttention, historical }) {
  const colors = radial ? [...new Set([radial.branch ?? radial.primary, ...radial.secondary])] : [];
  const slices = colors.map((group, index) =>
    `${group.color} ${index * 100 / colors.length}% ${(index + 1) * 100 / colors.length - 1.7}%, #fff ${(index + 1) * 100 / colors.length - 1.7}% ${(index + 1) * 100 / colors.length}%`);
  const style = { left: point.x, top: point.y };
  if (radial) Object.assign(style, {
    '--br-crew': radial.primary.color, '--br-branch': radial.branch?.color ?? radial.primary.color, '--br-priority': radial.level + 1,
    '--br-ring': colors.length === 1 ? colors[0].color : `conic-gradient(${slices.join(', ')})`,
  });
  const crewLabel = radial
    ? `${agent.name}, ${agent.role}. Primary ${radial.primary.name}.${radial.branch && radial.branch !== radial.primary ? ` Leads ${radial.branch.name}.` : ''}${radial.secondary.length ? ` Connected work ${radial.secondary.map(({ name }) => name).join(', ')}.` : ''}${radial.tucked ? ` ${radial.tucked} tucked agents.` : ''}${link ? ` ${stateFor(link.status).label}.` : ''}`
    : undefined;
  return (
    <button type="button" className={radial ? 'br-bubble br-radial-bubble' : 'br-bubble'} style={style}
      aria-label={reportAttention ? `${crewLabel ?? `${agent.name}, ${agent.role}.`} ${historical ? 'Last verified report needed action.' : 'Participant report needs action.'}` : crewLabel}
      data-agent={agent.id} data-driver={isDriver || undefined} data-role={agent.role}
      data-muted={muted || undefined} data-report-attention={reportAttention || undefined} aria-pressed={selected} onClick={() => openAgent(agent.id)}>
      <span className="br-avatar" aria-hidden="true">
        {symbols[agent.role] || '○'}
        {reportAttention && <span className="br-bubble-notice">!</span>}
      </span>
      <span className="br-agent-name">{agent.name}</span>
      <span className="br-role">{agent.role}</span>
      {!!radial?.tucked && <span className="br-tucked">+{radial.tucked} tucked</span>}
      <span className="br-agent-state">{link && link.status !== 'active'
        ? <Status status={link.status} />
        : age?.className === 'stale' ? <span className="br-stale-label">◷ Stale</span> : null}</span>
    </button>
  );
}

function ArtifactActions({ artifacts, capability }) {
  const [opening, setOpening] = useState(null);
  const [message, setMessage] = useState('');
  const busy = useRef(false);

  async function open(artifact) {
    if (busy.current || !capability?.isAvailable(artifact.opaqueRef)) return;
    busy.current = true;
    setOpening(artifact.opaqueRef);
    setMessage('');
    try {
      const result = await capability.openArtifact(artifact.opaqueRef);
      setMessage(result.status === 'opened' ? `Opened ${artifact.label}.` : result.message);
    } catch {
      setMessage('Could not open this artifact.');
    } finally {
      busy.current = false;
      setOpening(null);
    }
  }

  return <>
    <h4>Artifacts</h4>
    <ul className="br-artifacts">
      {artifacts.map((artifact) => <li key={artifact.opaqueRef}>
        <span>{artifact.label}</span>
        {capability?.isAvailable(artifact.opaqueRef) && <button type="button"
          disabled={opening !== null} aria-label={`Open artifact ${artifact.label}`}
          onClick={() => open(artifact)}>{opening === artifact.opaqueRef ? 'Opening…' : 'Open artifact'}</button>}
      </li>)}
    </ul>
    <p role="status">{message}</p>
  </>;
}

export function GraphView({ snapshot, now = snapshot.asOf, selection, onSelectionChange, host, reports, dataset, ledger }) {
  const graph = snapshot.schemaVersion !== 1
    ? <p role="alert">This graph snapshot uses an unsupported schema version.</p>
    : <BubbleMap key={snapshot.effortId} snapshot={snapshot} now={now}
      selection={selection} onSelectionChange={onSelectionChange} host={host} reports={reports} crewFirst={!!dataset} crewReports={dataset?.crewReports} ledger={ledger} />;
  return dataset
    ? <DatasetView dataset={dataset} snapshot={snapshot}>{graph}</DatasetView>
    : graph;
}

function BubbleMap({ snapshot, now, selection, onSelectionChange, host, reports, crewFirst, crewReports, ledger }) {
  const historical = crewReports?.state === 'unavailable';
  const [view, setView] = useState(() => snapshot.participants.length > 20 ? 'radial' : 'overview');
  const [area, setArea] = useState('');
  const [trail, setTrail] = useState([]);
  const [mapRef, width] = useWidth();
  const inspectorHeading = useRef(null);
  const overviewButton = useRef(null);
  const id = useId();
  const driverId = snapshot.driverId;
  const agents = useMemo(() => snapshot.participants.map((participant, order) => ({
    ...participant, order, neighborhood: participant.workstreamIds?.[0] ?? 'Coordination',
  })), [snapshot.participants]);
  const links = useMemo(() => snapshot.links
    .filter(({ kind }) => kind === 'delegation' || kind === 'dependency')
    .map((link) => ({ ...link, status: normalizeLinkStatus(link.status) })), [snapshot.links]);
  const agentById = new Map(agents.map((agent) => [agent.id, agent]));
  const graph = useMemo(() => topology(agents, links), [agents, links]);
  const diagnostic = !agentById.has(driverId) || agentById.size !== agents.length
    || links.some((link) => !agentById.has(link.from) || !agentById.has(link.to))
    ? 'The coordination graph has invalid participant references.'
    : graph === null ? 'The coordination links contain a cycle.' : '';
  const radialLayout = useMemo(
    () => view === 'radial' && !diagnostic ? makeRadialLayout(agents, links, driverId) : null,
    [view, diagnostic, agents, links, driverId],
  );
  const agentColor = (agent) => radialLayout?.primary.get(agent.id)?.color
    ?? (agent.id === driverId ? '#4f3aa9' : roleAccent[agent.role] ?? '#5037a8');
  const live = liveLinksOf(links).filter((link) => agentById.has(link.from) && agentById.has(link.to));
  const needsAction = new Set((reports ?? []).filter(needsOperatorAttention)
    .map(({ participantId }) => participantId).filter((id) => agentById.has(id)));
  const activeIds = new Set([driverId, ...needsAction, ...live.flatMap((link) => [link.from, link.to])]);
  const archivedIds = new Set(links.filter((link) => link.status === 'completed').flatMap((link) => [link.from, link.to]));
  const activeAgents = agents.filter((agent) => activeIds.has(agent.id) || !archivedIds.has(agent.id));
  const focusId = selection === undefined
    ? trail.at(-1)
    : selection?.effortId === snapshot.effortId ? selection.participantId : undefined;
  const focus = agentById.get(focusId);
  const focusTrail = !focus ? [] : trail.at(-1) === focus.id
    ? trail.filter((agentId) => agentById.has(agentId))
    : [focus.id];
  const neighbors = focus ? live.filter((link) => link.from === focus.id || link.to === focus.id).sort(byRecent) : [];
  const nearIds = new Set(focus ? [focus.id, ...neighbors.flatMap((link) => [link.from, link.to])] : []);
  const areas = [...new Set(activeAgents.map((agent) => agent.neighborhood))];
  const selectedArea = areas.includes(area) ? area : agentById.get(driverId)?.neighborhood ?? areas[0];
  const areaAgents = new Set(activeAgents.filter((agent) => agent.neighborhood === selectedArea).map((agent) => agent.id));
  const contextIds = focus ? nearIds : new Set([...areaAgents, ...bridgeTo(driverId, areaAgents, live)]);
  const visible = activeAgents.filter((agent) => view === 'overview' || contextIds.has(agent.id));
  const slotAgents = view === 'overview' ? agents : agents.filter((agent) => contextIds.has(agent.id));
  const points = width && !diagnostic && graph ? position(slotAgents, graph, width) : null;
  const shownIds = new Set(visible.map((agent) => agent.id));
  const mapLinks = live.filter((link) => shownIds.has(link.from) && shownIds.has(link.to));
  const edges = points ? routeEdges(mapLinks, points, width).sort((a, b) => byRecent(b.link, a.link)) : [];
  const height = points ? Math.max(178, ...visible.map((agent) => points.get(agent.id).y + 70)) : 178;
  const attention = live.filter((link) => link.status === 'action').sort(byRecent);
  const events = snapshot.communication.filter((event) => focus && (event.from === focus.id || event.to === focus.id))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at) || a.id.localeCompare(b.id));
  const history = links.filter((link) => link.status === 'completed'
    && (!focus || link.from === focus.id || link.to === focus.id)).sort(byRecent);

  function changeTrail(next) {
    setTrail(next);
    onSelectionChange?.(selectionFor(snapshot, next.at(-1)));
  }

  function openAgent(agentId, moveFocus = true) {
    if (focus?.id !== agentId) changeTrail([...focusTrail, agentId]);
    if (moveFocus) requestAnimationFrame(() => inspectorHeading.current?.focus());
  }

  function back() {
    changeTrail(focusTrail.slice(0, -1));
    requestAnimationFrame(() => {
      if (focusTrail.length > 1) inspectorHeading.current?.focus();
      else {
        const map = overviewButton.current?.closest('.br-map-panel');
        const bubble = [...(map?.querySelectorAll('[data-agent]') ?? [])]
          .find((button) => button.dataset.agent === focusTrail[0]);
        (bubble ?? overviewButton.current)?.focus();
      }
    });
  }

  function bubble(agent, point, radial) {
    const incoming = live.filter((link) => link.to === agent.id)
      .sort((a, b) => priority.indexOf(a.status) - priority.indexOf(b.status) || byRecent(a, b));
    const link = incoming[0];
    return <AgentBubble key={agent.id} agent={agent} point={point} radial={radial}
      isDriver={agent.id === driverId} selected={agent.id === focus?.id} reportAttention={needsAction.has(agent.id)} historical={historical}
      muted={radial ? radial.level === 0 : !!focus && !nearIds.has(agent.id)}
      link={link} age={link && ageOf(link.updatedAt, now)} openAgent={radial?.onClick ?? openAgent} />;
  }

  return (
    <section className="br-widget" data-view={view} aria-label={`${snapshot.name} agent map`}>
      {!crewFirst && <header className="br-effort">
        <div>
          <p className="br-eyebrow"><span aria-hidden="true" /> Effort snapshot</p>
          <h2>{snapshot.name}</h2>
        </div>
        <div className="br-metrics">
          <span><strong>{activeAgents.length}</strong> Agents</span>
          <span><strong>{live.length}</strong> Live links</span>
          <time dateTime={now} title={now}>{clock(now)} UTC</time>
        </div>
      </header>}

      {(crewFirst || !!reports?.length) && <ParticipantLedger reports={reports ?? []} agents={agentById}
        color={agentColor} now={now} onSelectAgent={openAgent} title={crewFirst ? 'Crew details' : undefined}
        coverage={crewFirst ? activeAgents : undefined} historical={historical} ledger={ledger} staleAfterMs={crewReports?.staleAfterMs} />}
      <div className="br-body">
        <section className="br-attention" aria-label="Graph alerts">
          <h3>Graph alerts <span>{attention.length}</span></h3>
          {attention.length === 0 && <p>No graph alerts</p>}
          {attention.map((link) => <AttentionCard key={link.id} link={link} agents={agentById}
            color={agentColor} now={now} inspectorId={`${id}-inspect`} openAgent={openAgent} historical={historical} />)}
        </section>
        <div className="br-map-panel">
          <div className="br-map-head">
            <div className="br-map-title">
              <h3>Coordination map</h3>
              {!!needsAction.size && <p className="br-map-notice">
                <span aria-hidden="true">!</span> {historical ? `Action in last snapshot · ${needsAction.size}` : needsAction.size === 1 ? '1 participant needs action' : `${needsAction.size} participants need action`}
              </p>}
            </div>
            <div className="br-toggle" role="group" aria-label="Map view">
              <button type="button" ref={overviewButton} aria-pressed={view === 'overview'} onClick={() => setView('overview')}>Overview</button>
              <button type="button" aria-pressed={view === 'neighborhood'} onClick={() => setView('neighborhood')}>Neighborhoods</button>
              <button type="button" aria-pressed={view === 'radial'} onClick={() => setView('radial')}>Radial</button>
            </div>
          </div>
          {view === 'neighborhood' && <div className="br-areas">
            <label htmlFor={`${id}-area`}>Neighborhood</label>
            <select id={`${id}-area`} value={focus ? '' : selectedArea} onChange={(event) => {
              setArea(event.target.value);
              if (focus) changeTrail([]);
            }}>
              {focus && <option value="" disabled>{focus.name}’s live neighbors</option>}
              {areas.map((name) => <option key={name}>{name}</option>)}
            </select>
            <span>{visible.length} of {activeAgents.length} agents shown</span>
          </div>}
          {diagnostic && <>
            <p className="br-error" role="alert">{diagnostic}</p>
            <label className="br-fallback">
              Inspect participant
              <select value={focus?.id ?? ''} onChange={(event) => {
                if (event.target.value) openAgent(event.target.value, false);
                else changeTrail([]);
              }}>
                <option value="">Choose a participant</option>
                {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
              </select>
            </label>
          </>}
          {radialLayout && <RadialMap agents={agents} layout={radialLayout} liveLinks={live}
            activeAgents={activeAgents} priorityIds={needsAction} driverId={driverId} focus={focus} now={now} renderBubble={bubble}
            onSelect={(agentId) => openAgent(agentId, false)} onClear={() => changeTrail([])} />}
          <div className="br-stage" ref={mapRef} style={{ height }} hidden={!!diagnostic || view === 'radial'}>
            {points && <>
              <svg aria-hidden="true" className="br-edges" width={width} height={height}>
                <defs><marker id={`${id}-arrow`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="9" markerHeight="9"
                  markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M1 1 L7 4 L1 7" fill="none" stroke="context-stroke" strokeWidth="1.5" /></marker></defs>
                {edges.map(({ link, path }) => <path key={link.id} d={path} data-edge={link.id} data-status={link.status}
                  data-kind={link.kind} data-age={ageOf(link.updatedAt, now).className}
                  data-dim={!!focus && focus.id !== link.from && focus.id !== link.to || undefined}
                  markerEnd={`url(#${id}-arrow)`} />)}
              </svg>
              {visible.map((agent) => bubble(agent, points.get(agent.id)))}
            </>}
          </div>
          <div className="br-legend" aria-label="Map legend" hidden={!!diagnostic || view === 'radial'}>
            <span><i className="br-key-line" /> Recent link</span>
            <span><i className="br-key-line br-key-older" /> Older link</span>
            <span><i className="br-key-line br-key-stale" /> Stale link</span>
            <span><i className="br-key-line br-key-dep" /> Dependency</span>
            {view === 'neighborhood' && <span>{live.length - mapLinks.length} links in other views</span>}
          </div>
        </div>

        <section className="br-inspector" aria-labelledby={`${id}-inspect`}>
          <header className="br-inspector-head">
            <h3 id={`${id}-inspect`} tabIndex={-1} ref={inspectorHeading} aria-label={focus ? `Agent inspector for ${focus.name}` : undefined}>Agent inspector</h3>
            {focus && <button type="button" onClick={back}>← {focusTrail.length > 1 ? 'Back' : 'Clear focus'}</button>}
          </header>
          <Details focus={focus} neighbors={neighbors} agentById={agentById} events={events} history={history}
            now={now} openAgent={openAgent} host={host}
            reports={reports ?? (crewFirst ? [] : undefined)} historical={historical} staleAfterMs={crewReports?.staleAfterMs} ledger={ledger} />
          {!focus && history.length > 0 && <details className="br-history">
            <summary>Completed connections ({history.length})</summary>
            <ul>{history.map((link) => <li key={link.id}>{link.label} · {agentById.get(link.to)?.name} · <time dateTime={link.updatedAt}>{clock(link.updatedAt)} UTC</time></li>)}</ul>
          </details>}
        </section>
      </div>
    </section>
  );
}
