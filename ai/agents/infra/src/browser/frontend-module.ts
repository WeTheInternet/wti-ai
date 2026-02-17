// *****************************************************************************
// Copyright (C) 2026
//
// SPDX-License-Identifier: UNLICENSED
// *****************************************************************************

import { ContainerModule } from '@theia/core/shared/inversify';
import { Agent } from '@theia/ai-core/lib/common';
import { ChatAgent } from '@theia/ai-chat/lib/common/chat-agents';
import { InfraAgent } from './infra-agent';

export default new ContainerModule(bind => {
    bind(InfraAgent).toSelf().inSingletonScope();
    bind(Agent).toService(InfraAgent);
    bind(ChatAgent).toService(InfraAgent);
});
