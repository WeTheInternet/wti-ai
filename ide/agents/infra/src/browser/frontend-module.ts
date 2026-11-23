import '@wti/agent-graph/style.css';
import '@wti/agent-graph/chrome.css';
// *****************************************************************************
// Copyright (C) 2026
//
// SPDX-License-Identifier: UNLICENSED
// *****************************************************************************

import { ContainerModule } from '@theia/core/shared/inversify';
import { Agent } from '@theia/ai-core/lib/common';
import { ChatAgent } from '@theia/ai-chat/lib/common/chat-agents';
import { InfraAgent } from './infra-agent.js';

import { WidgetFactory } from '@theia/core/lib/browser/widget-manager';
import { bindViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { ResourceResolver } from '@theia/core/lib/common/resource';
import { AgentGraphWidget } from './agent-graph-widget.js';
import { AgentGraphContribution } from './agent-graph-contribution.js';
import { AgentGraphResourceResolver } from './agent-graph-resource.js';

import { ServiceConnectionProvider } from '@theia/core/lib/browser/messaging/service-connection-provider';
import { GraphLedgerService, graphLedgerPath } from '../common/graph-ledger-protocol.js';

export default new ContainerModule(bind => {
    bind(GraphLedgerService).toDynamicValue(context =>
        ServiceConnectionProvider.createProxy<GraphLedgerService>(context.container, graphLedgerPath)).inSingletonScope();
    bind(AgentGraphWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: AgentGraphWidget.ID,
        createWidget: () => context.container.get(AgentGraphWidget)
    })).inSingletonScope();
    bindViewContribution(bind, AgentGraphContribution);
    bind(AgentGraphResourceResolver).toSelf().inSingletonScope();
    bind(ResourceResolver).toService(AgentGraphResourceResolver);
    bind(InfraAgent).toSelf().inSingletonScope();
    bind(Agent).toService(InfraAgent);
    bind(ChatAgent).toService(InfraAgent);
});
