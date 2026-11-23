import React, { useId } from 'react';
import './dataset.css';

const sourceLabel = (source) => source === 'crew-ledger' ? 'Crew Ledger' : 'Synthetic fixture';

export function DatasetView({ dataset, snapshot, children }) {
  const id = useId();
  const availability = dataset.crewReports;
  const unavailable = availability?.state === 'unavailable';
  const retained = unavailable && availability.lastVerified === true;
  const selected = dataset.options.find(({ id }) => id === dataset.selectedId);
  return <div className="br-dataset-view">
    <header className="br-dataset-bar">
      <div className="br-dataset-control">
        <label htmlFor={id}>Dataset</label>
        <select id={id} value={selected?.id ?? ''} onChange={(event) => dataset.onChange(event.target.value)}>
          {!selected && <option value="" disabled>Choose a dataset</option>}
          {['crew-ledger', 'fixture'].map((source) => {
            const options = dataset.options.filter((option) => option.source === source);
            return options.length ? <optgroup key={source} label={sourceLabel(source)}>
              {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </optgroup> : null;
          })}
        </select>
      </div>
      {selected && <p className="br-dataset-source" data-source={selected.source} aria-live="polite">
        <span>Source</span> <strong>{sourceLabel(selected.source)}</strong>
      </p>}
    </header>
    {selected && <>
      {unavailable && <section className="br-crew-source-note" role="status" aria-label="Crew source availability">
        <h3>Crew source unavailable</h3>
        {availability.reason && <p>{availability.reason}</p>}
        {retained
          ? <p>Showing the last verified snapshot. Current status is unknown.</p>
          : <p>Current status is unknown. Choose another dataset above.</p>}
      </section>}
      {(!unavailable || retained) && <>
        {snapshot.participants.length === 0
          ? <section className="br-crew-source-note" aria-label="Crew details">
              <h3>Crew details</h3><p>No crew members in this dataset.</p>
            </section>
          : children}
        <details className="br-dataset-provenance">
          <summary>Source and provenance</summary>
          <dl>
            <div><dt>Dataset</dt><dd>{selected.label}</dd></div>
            {dataset.provenance?.sourceLabel && <div><dt>Source</dt><dd>{dataset.provenance.sourceLabel}</dd></div>}
            <div><dt>Snapshot revision</dt><dd>{snapshot.revision}</dd></div>
            <div><dt>As of</dt><dd><time dateTime={snapshot.asOf}>{snapshot.asOf}</time></dd></div>
            {dataset.provenance?.observedAt && <div><dt>Observed</dt>
              <dd><time dateTime={dataset.provenance.observedAt}>{dataset.provenance.observedAt}</time></dd>
            </div>}
          </dl>
        </details>
      </>}
    </>}
  </div>;
}

