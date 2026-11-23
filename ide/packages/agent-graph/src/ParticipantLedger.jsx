import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { ReportAge, reportDestination, Status } from './report-ui.jsx';
import { isStaleReport } from './model.ts';
import './ledger.css';

export const needsOperatorAttention = ({ kind }) => kind === 'blocker' || kind === 'operatorRequest';

function ParticipantName({ agent, color }) {
  return <span className="br-ledger-name" style={{ '--br-ledger-color': agent ? color(agent) : undefined }}>
    <span className="br-ledger-dot" aria-hidden="true" />
    <span className="br-ledger-person-label">{agent?.name ?? 'Unknown participant'}</span>
  </span>;
}

function ReportState({ report, now, staleAfterMs }) {
  return <span className="br-ledger-state">
    {report.status === 'blocked'
      ? <span className="br-status" data-status="blocked"><span aria-hidden="true">!</span> Blocked</span>
      : <Status status={report.status} />}
    <ReportAge at={report.reportedAt} now={now} />
    {isStaleReport(report.reportedAt, now, staleAfterMs) && <span className="br-crew-stale">Stale report</span>}
  </span>;
}

function ViewAgent({ agent, onSelectAgent, primary }) {
  return agent && <button type="button" className={primary ? 'br-ledger-primary' : 'br-ledger-action'}
    onClick={() => onSelectAgent(agent.id)}>View agent details</button>;
}

function RequestDialog({ request, onDismiss }) {
  const ref = useRef(null);
  const close = useRef(null);
  const leaving = useRef(false);
  const titleId = useId();
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog.open) dialog.showModal();
    close.current.focus();
  }, []);

  const { label, preview } = request.report.action;
  return <dialog ref={ref} className="br-request-dialog" aria-labelledby={titleId}
    onClose={() => onDismiss(!leaving.current)}>
    <header>
      <div>
        <p>Request details · {request.agent?.name ?? 'Participant'}</p>
        <h3 id={titleId}>{preview?.title ?? label}</h3>
      </div>
      <button ref={close} className="br-request-close" type="button" aria-label="Close request"
        onClick={() => ref.current.close()}>×</button>
    </header>
    <p>{preview?.body ?? request.report.reason}</p>
    <div className="br-request-actions">
      <a href={request.destination} onClick={() => {
        leaving.current = true;
        ref.current.close();
      }}>View source record</a>
    </div>
  </dialog>;
}

function historyDestination(history) {
  if (!history?.verified || !history.href.startsWith('/')) return undefined;
  const base = 'https://local.invalid';
  try {
    const parsed = new URL(history.href, base);
    if (parsed.origin === base) return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return undefined;
  }
  return undefined;
}

function ReportEvidence({ report, agent, showSource = true }) {
  const history = historyDestination(report.history);
  const source = report.source;
  const sourceHref = source && reportDestination(source.href);
  if (!report.history && !source) return null;
  return <div className="br-report-evidence">
    {report.history && (history
      ? <a href={history} aria-label={`Open ${agent?.name ?? 'participant'} history`}>Open agent history</a>
      : <span>History unavailable</span>)}
    {showSource && source && <details className="br-report-source">
      <summary>Report source</summary>
      <p>Revision <code>{source.revision}</code></p>
      {source.blob && <p>Blob <code>{source.blob}</code></p>}
      <p>{source.publisher ? `Publisher · ${source.publisher}` : 'Publisher unconfirmed'}</p>
      {sourceHref && <a href={sourceHref}>View pinned Git report</a>}
    </details>}
  </div>;
}

function WorkBreakdown({ report, operatorId, historical }) {
  const dependency = report.humanDependency;
  const applies = !historical && !!operatorId && dependency?.assigneeId === operatorId;
  if (!dependency && !report.agentFollowUp) return null;
  return <div className="br-report-breakdown">
    {dependency && <div>
      <strong>Human dependency</strong>
      {applies ? <span className="br-report-assignee">Needs you</span>
        : <span className="br-report-assignee">{dependency.assigneeLabel
          ? `Assigned to ${dependency.assigneeLabel}`
          : dependency.assigneeId ? 'Personal assignee recorded' : 'Personal assignee unknown'}</span>}
      <p>{dependency.detail}</p>
    </div>}
    {report.agentFollowUp && <div><strong>Agent follow-up</strong><p>{report.agentFollowUp}</p></div>}
  </div>;
}

const reportTime = (report) => Number.isFinite(Date.parse(report.reportedAt)) ? Date.parse(report.reportedAt) : -Infinity;

export function ParticipantLedger({ reports, agents, color, now, onSelectAgent, title = 'Participant ledger', coverage, historical, staleAfterMs, ledger }) {
  const [openRequest, setOpenRequest] = useState(null);
  useLayoutEffect(() => {
    if (historical) setOpenRequest(null);
  }, [historical]);
  const trigger = useRef(null);
  const filterId = useId();
  const [filter, setFilter] = useState('all');
  const attention = reports.filter(needsOperatorAttention);
  const routine = reports.filter(({ kind }) => kind === 'routine');
  const reportedIds = new Set(reports.map(({ participantId }) => participantId));
  const unreported = (coverage ?? []).filter(({ id }) => !reportedIds.has(id));
  const request = historical ? null : openRequest;

  function renderPriority(report) {
    const agent = agents.get(report.participantId);
    const destination = historical ? undefined : reportDestination(report.action?.href, true);
    const ownerName = agents.get(report.actionOwnerId)?.name ?? report.actionOwnerLabel;
    return <li key={report.id} className="br-ledger-card">
      <div className="br-ledger-card-top">
        <div className="br-ledger-identity">
          <span className="br-ledger-label">{report.kind === 'blocker' ? 'Blocker' : 'Operator request'}</span>
          <ParticipantName agent={agent} color={color} />
        </div>
        {destination && report.action?.label
          ? <button type="button" className="br-ledger-primary" aria-haspopup="dialog" onClick={(event) => {
            trigger.current = event.currentTarget;
            if (agent) onSelectAgent(agent.id, false);
            setOpenRequest({ report, agent, destination });
          }}>{report.action.label}</button>
          : <ViewAgent agent={agent} onSelectAgent={onSelectAgent} primary />}
      </div>
      <ReportState report={report} now={now} staleAfterMs={staleAfterMs} />
      <p>{report.reason}</p>
      <WorkBreakdown report={report} operatorId={ledger?.operatorId} historical={historical} />
      {ownerName && !report.agentFollowUp && <p className="br-ledger-owner">
        Next-action owner · {ownerName}
      </p>}
      <ReportEvidence report={report} agent={agent} />
    </li>;
  }

  function renderRoutine(report) {
    const agent = agents.get(report.participantId);
    return <li key={report.id}>
      <details>
        <summary>
          <ParticipantName agent={agent} color={color} />
          <ReportState report={report} now={now} staleAfterMs={staleAfterMs} />
          <span className="br-ledger-chevron" aria-hidden="true">⌄</span>
        </summary>
        <div className="br-ledger-details">
          {report.details && <p>{report.details}</p>}
          <WorkBreakdown report={report} historical={historical} />
          <ViewAgent agent={agent} onSelectAgent={onSelectAgent} />
        </div>
      </details>
      <ReportEvidence report={report} agent={agent} />
    </li>;
  }

  const chronological = ledger?.order === 'chronological';
  const ordered = chronological
    ? [...(filter === 'attention' ? attention : reports)].sort((a, b) => reportTime(b) - reportTime(a))
    : [];

  return <section className="br-ledger" aria-label={title}>
    <h3>{title}</h3>
    {coverage && !reports.length && <p className="br-crew-empty">
      {historical ? 'No participant reports in the last verified snapshot.' : 'No participant reports in this dataset.'}
    </p>}
    {chronological && <>
      <div className="br-chronological-control">
        <label htmlFor={filterId}>Reports</label>
        <select id={filterId} value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">All reports</option>
          <option value="attention">Needs attention</option>
        </select>
      </div>
      {ordered.length ? <ul className="br-ledger-routine br-ledger-chronological" aria-label="Chronological reports">
        {ordered.map((report) => needsOperatorAttention(report) ? renderPriority(report) : renderRoutine(report))}
      </ul> : filter === 'attention' && <p>No reports need attention.</p>}
    </>}
    {!chronological && !!attention.length && <>
      {coverage && <h4 className="br-crew-group">{historical ? 'Needed attention in last snapshot' : 'Needs attention'}</h4>}
      <ul className="br-ledger-priority">
        {attention.map(renderPriority)}
      </ul>
    </>}
    {!chronological && !!routine.length && <>
      {coverage && <h4 className="br-crew-group">Other reports</h4>}
      <ul className="br-ledger-routine" aria-label="Routine reports">
        {routine.map(renderRoutine)}
      </ul>
    </>}
    {(!chronological || filter === 'all') && !!unreported.length && <>
      <h4 className="br-crew-group">No reports</h4>
      <ul className="br-crew-unreported" aria-label="Participants without reports">
        {unreported.map((agent) => <li key={agent.id}>
          <button type="button" onClick={() => onSelectAgent(agent.id)}>
            <ParticipantName agent={agent} color={color} />
          </button>
          <span>{historical ? 'No report in last snapshot' : 'No report yet'}</span>
        </li>)}
      </ul>
    </>}
    {request && <RequestDialog request={request} onDismiss={(restoreFocus) => {
      setOpenRequest(null);
      if (restoreFocus) trigger.current?.focus({ preventScroll: true });
    }} />}
  </section>;
}

export function ParticipantReports({ participant, reports, agents, now, historical, staleAfterMs, onSelectAgent, operatorId }) {
  const own = reports.filter(({ participantId }) => participantId === participant.id)
    .sort((left, right) => Number(needsOperatorAttention(right)) - Number(needsOperatorAttention(left))
      || Date.parse(right.reportedAt) - Date.parse(left.reportedAt));
  const waiting = reports.filter((report) => needsOperatorAttention(report)
    && report.participantId !== participant.id && report.actionOwnerId === participant.id);
  const ownLabel = historical ? 'Reports in last verified snapshot' : 'Participant reports';
  return <div className="br-participant-reports">
    <section aria-label={ownLabel}>
      <h4>{ownLabel}</h4>
      {!own.length && <p>{historical ? 'No report in last snapshot.' : 'No report yet.'}</p>}
      {!!own.length && <ul>
        {own.map((report) => {
          const attention = needsOperatorAttention(report);
          const owner = attention ? agents.get(report.actionOwnerId) : undefined;
          const destination = attention && !historical ? reportDestination(report.action?.href, true) : undefined;
          return <li key={report.id} data-attention={attention || undefined}>
            {attention && <strong>{report.kind === 'blocker' ? 'Blocker' : 'Operator request'}</strong>}
            <ReportState report={report} now={now} staleAfterMs={staleAfterMs} />
            {(attention ? report.reason : report.details) && <p>{attention ? report.reason : report.details}</p>}
            <WorkBreakdown report={report} operatorId={operatorId} historical={historical} />
            {attention && !report.agentFollowUp && <p>Next-action owner · {owner
              ? owner.id === participant.id ? owner.name : <button type="button" onClick={() => onSelectAgent(owner.id)}>{owner.name}</button>
              : report.actionOwnerLabel ?? 'Unknown'}</p>}
            {destination && <a href={destination}>View source record</a>}
            <ReportEvidence report={report} agent={participant} />
          </li>;
        })}
      </ul>}
    </section>
    {!!waiting.length && <section aria-label={historical ? 'Waiting on this participant in last snapshot' : 'Waiting on this participant'}>
      <h4>{historical ? 'Waiting on this participant in last snapshot' : 'Waiting on this participant'}</h4>
      <ul>
        {waiting.map((report) => {
          const affected = agents.get(report.participantId);
          return <li key={report.id} data-attention="true">
            {affected
              ? <button type="button" onClick={() => onSelectAgent(affected.id)}>{affected.name}</button>
              : <strong>Unknown participant</strong>}
            <p>{report.reason}</p>
          </li>;
        })}
      </ul>
    </section>}
  </div>;
}
