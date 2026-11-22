// *****************************************************************************
// Copyright (C) 2026
//
// SPDX-License-Identifier: UNLICENSED
// *****************************************************************************

import { bindContributionProvider } from '@theia/core';
import { ContainerModule } from '@theia/core/shared/inversify';
import { Agent } from '@theia/ai-core/lib/common';
import { ChatAgent } from '@theia/ai-chat/lib/common/chat-agents';
import { InfraAgent } from './infra-agent';
import { TrashFallbackWorkspaceDeleteHandler } from './trash-fallback-delete-handler';
import { GodmodeService } from './godmode-service';
import { CommandContribution } from '@theia/core/lib/common/command';
import { GodmodeCommandContribution } from './godmode-command-contribution';
import {
    ChatSlashCommandHandler,
    ChatSlashCommandRegistry,
    GodmodeSlashCommandContribution
} from './godmode-slash-command-contribution';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application-contribution';
import { ScopeService } from './scope-service';
import { ScopeCommandContribution } from './scope-command-contribution';
import { ScopeSlashCommandContribution } from './scope-slash-command-contribution';

export default new ContainerModule(bind => {
    bind(GodmodeService).toSelf().inSingletonScope();
    bind(ScopeService).toSelf().inSingletonScope();

    bind(GodmodeCommandContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(GodmodeCommandContribution);

    bind(ScopeCommandContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(ScopeCommandContribution);

    bind(ChatSlashCommandRegistry).toSelf().inSingletonScope();

    bindContributionProvider(bind, ChatSlashCommandHandler);

    bind(GodmodeSlashCommandContribution).toSelf().inSingletonScope();
    bind(ChatSlashCommandHandler).toService(GodmodeSlashCommandContribution);
    bind(FrontendApplicationContribution).toService(GodmodeSlashCommandContribution);

    bind(ScopeSlashCommandContribution).toSelf().inSingletonScope();
    bind(ChatSlashCommandHandler).toService(ScopeSlashCommandContribution);
    bind(FrontendApplicationContribution).toService(ScopeSlashCommandContribution);


    bind(InfraAgent).toSelf().inSingletonScope();
    bind(Agent).toService(InfraAgent);
    bind(ChatAgent).toService(InfraAgent);
    // Replace default handler with our fallback implementation.
    bind(TrashFallbackWorkspaceDeleteHandler).toSelf().inSingletonScope();
});
