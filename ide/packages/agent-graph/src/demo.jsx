import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AgentGraph } from 'agent-graph/react';
import { cyclicFixture, fixtures } from 'agent-graph/fixtures';
import './demo.css';

const samples = {
  small: fixtures.small,
  dense: fixtures.dense,
  before: fixtures.status.before,
  after: fixtures.status.after,
  cycle: cyclicFixture,
};

function Demo() {
  const [sample, setSample] = useState('small');
  return (
    <main className="demo-shell">
      <header className="demo-head">
        <div className="demo-brand">
          <div className="demo-logo" aria-hidden="true"><span /><span /><span /></div>
          <div><h1>Agent Graph</h1><p>Deterministic synthetic fixtures</p></div>
        </div>
        <label className="demo-picker">
          <span>Fictional sample</span>
          <select value={sample} onChange={(event) => setSample(event.target.value)}>
            <option value="small">Project Lantern</option>
            <option value="dense">Greenhouse drill</option>
            <option value="before">Status before</option>
            <option value="after">Status after</option>
            <option value="cycle">Cycle diagnostic</option>
          </select>
        </label>
      </header>
      <AgentGraph snapshot={samples[sample]} />
    </main>
  );
}

createRoot(document.getElementById('root')).render(<Demo />);
