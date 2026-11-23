import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AgentGraph } from 'agent-graph/react';
import { crewStateFixtures, cyclicFixture, fixtures, ledgerReviewFixture, participantLedgerFixture } from 'agent-graph/fixtures';
import './demo.css';

const samples = {
  ...crewStateFixtures,
  ledger: { label: 'Graph alert example', snapshot: ledgerReviewFixture },
  small: { label: 'Project Lantern', snapshot: fixtures.small },
  dense: { label: 'Greenhouse drill', snapshot: fixtures.dense },
  before: { label: 'Status before', snapshot: fixtures.status.before },
  after: { label: 'Status after', snapshot: fixtures.status.after },
  cycle: { label: 'Cycle diagnostic', snapshot: cyclicFixture },
};

const options = Object.entries(samples).map(([id, { label }]) => ({ id, label, source: 'fixture' }));

function Demo() {
  const [sample, setSample] = useState('mixed');
  const { snapshot, reports, now, crewReports } = samples[sample];
  return (
    <main className="demo-shell">
      <header className="demo-head">
        <div className="demo-brand">
          <div className="demo-logo" aria-hidden="true"><span /><span /><span /></div>
          <div><h1>Agent Graph</h1></div>
        </div>
      </header>
      <AgentGraph snapshot={snapshot} reports={reports} now={now} dataset={{ options, selectedId: sample, onChange: setSample, crewReports }} />
      {sample === 'mixed' && <section className="demo-record" id={participantLedgerFixture.request.id}
        tabIndex={-1} aria-labelledby="demo-record-title">
        <h2 id="demo-record-title">{participantLedgerFixture.request.title}</h2>
        <p>{participantLedgerFixture.request.detail}</p>
      </section>}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<Demo />);
