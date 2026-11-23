import * as React from '@theia/core/shared/react';
import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { AgentGraph } from '@wti/agent-graph/react';
import { fixtures, cyclicFixture } from '@wti/agent-graph/fixtures';
import type { AgentGraphHost, GraphSnapshotV1 } from '@wti/agent-graph';
import { createArtifactCapability } from './agent-graph-artifacts.js';
import { GraphLedgerService } from '../common/graph-ledger-protocol.js';
import { GraphLedgerPanel } from './graph-ledger-panel.js';
import { ARTIFACT_REF, ARTIFACT_URI } from './agent-graph-resource.js';

const snapshots: Readonly<Record<string, GraphSnapshotV1>> = {
    small: fixtures.small,
    dense: fixtures.dense,
    'status-before': fixtures.status.before,
    'status-after': fixtures.status.after,
    cyclic: cyclicFixture
};

@injectable()
export class AgentGraphWidget extends ReactWidget {
    static readonly ID = 'wti-agent-graph';
    @inject(EditorManager) protected readonly editors!: EditorManager;
    @inject(GraphLedgerService) protected readonly ledger!: GraphLedgerService;
    protected fixture = 'small';
    protected host!: AgentGraphHost;

    @postConstruct()
    protected init(): void {
        this.id = AgentGraphWidget.ID;
        this.title.label = 'Agent Graph (Preview)';
        this.title.caption = 'Synthetic agent coordination graphs';
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-type-hierarchy';
        this.node.style.overflow = 'auto';
        this.host = {
            openArtifact: createArtifactCapability(new Map([[ARTIFACT_REF, ARTIFACT_URI]]),
                uri => this.editors.open(uri, { mode: 'activate', preview: false }))
        };
        this.update();
    }

    protected render(): React.ReactNode {
        return React.createElement('div', { style: { minWidth: 280, padding: 12 } },
            React.createElement('p', {}, 'Read-only preview'),
            React.createElement('label', {}, 'View ',
                React.createElement('select', {
                    'aria-label': 'Graph fixture', value: this.fixture,
                    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
                        if (event.target.value === 'ledger' || Object.hasOwn(snapshots, event.target.value)) {
                            this.fixture = event.target.value;
                            this.update();
                        }
                    }
                }, ...[...Object.keys(snapshots), 'ledger'].map(key => React.createElement('option', { key, value: key }, key)))),
            // Do not key by revision: same-effort updates preserve portable focus/camera.
            this.fixture === 'ledger' ? React.createElement(GraphLedgerPanel, { service: this.ledger })
                : React.createElement(AgentGraph, { snapshot: snapshots[this.fixture], host: this.host })
        );
    }
}
