import React, { useId } from 'react';
import { ageOf, stateFor } from './graph.js';

const reportFormat = new Intl.DateTimeFormat('en', {
  year: 'numeric', month: 'short', day: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone: 'UTC', timeZoneName: 'short',
});

export function reportDestination(href, allowFragment = false) {
  if (typeof href !== 'string') return undefined;
  if (allowFragment && /^#[A-Za-z][A-Za-z0-9_-]*$/.test(href)) return href;
  try {
    const url = new URL(href);
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return url.href;
    if (url.protocol === 'mailto:' && url.pathname) return url.href;
  } catch {
    return undefined;
  }
  return undefined;
}

export function ReportAge({ at, now }) {
  const descriptionId = useId();
  const timestamp = Date.parse(at);
  const currentTime = Date.parse(now);
  if (!Number.isFinite(timestamp)) return <span className="br-report-age">Time unknown</span>;
  const age = Number.isFinite(currentTime) && timestamp <= currentTime
    ? ageOf(at, now).label.replace(/(\d+)m/g, '$1 min').replace(/ old$/, ' ago')
    : 'Exact time';
  const exact = reportFormat.format(timestamp);
  return <span className="br-report-age">
    <time tabIndex={0} dateTime={at} aria-describedby={descriptionId}>{age === 'Exact time' ? age : `Reported ${age}`}</time>
    <span id={descriptionId} className="br-exact-report-time">{exact}</span>
  </span>;
}

export function Status({ status }) {
  const state = stateFor(status);
  return <span className="br-status" data-status={status}><span aria-hidden="true">{state.symbol}</span> {state.label}</span>;
}

