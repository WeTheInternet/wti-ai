// *****************************************************************************
// Copyright (C) 2026
//
// SPDX-License-Identifier: UNLICENSED
// *****************************************************************************

import { ContainerModule } from '@theia/core/shared/inversify';
import { Agent } from '@theia/ai-core/lib/common';
import { ChatAgent } from '@theia/ai-chat/lib/common/chat-agents';
import { InfraAgent } from './infra-agent';
import { WorkspaceDeleteHandler } from '@theia/workspace/lib/browser/workspace-delete-handler';
import { TrashFallbackWorkspaceDeleteHandler } from './trash-fallback-delete-handler';
import { GodmodeService } from './godmode-service';
import { CommandContribution } from '@theia/core/lib/common/command';
import { GodmodeCommandContribution } from './godmode-command-contribution';

export default new ContainerModule(bind => {
    bind(GodmodeService).toSelf().inSingletonScope();

    bind(GodmodeCommandContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(GodmodeCommandContribution);

    bind(InfraAgent).toSelf().inSingletonScope();
    bind(Agent).toService(InfraAgent);
    bind(ChatAgent).toService(InfraAgent);
    // Replace default handler with our fallback implementation.
    bind(TrashFallbackWorkspaceDeleteHandler).toSelf().inSingletonScope();
    bind(WorkspaceDeleteHandler).toService(TrashFallbackWorkspaceDeleteHandler);
});
