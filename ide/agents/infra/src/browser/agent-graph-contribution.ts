import { injectable } from '@theia/core/shared/inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { AgentGraphWidget } from './agent-graph-widget.js';

@injectable()
export class AgentGraphContribution extends AbstractViewContribution<AgentGraphWidget> {
    constructor() {
        super({
            widgetId: AgentGraphWidget.ID,
            widgetName: 'Agent Graph (Preview)',
            defaultWidgetOptions: { area: 'main' },
            toggleCommandId: 'wti.agentGraph.toggle',
            toggleKeybinding: 'ctrlcmd+alt+g'
        });
    }
}
