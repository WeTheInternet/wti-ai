// *****************************************************************************
// Copyright (C) 2026
//
// SPDX-License-Identifier: UNLICENSED
// *****************************************************************************

import { AbstractStreamParsingChatAgent, ChatMode } from '@theia/ai-chat/lib/common/chat-agents';
import { MarkdownChatResponseContentImpl, MutableChatRequestModel } from '@theia/ai-chat/lib/common/chat-model';
import { LanguageModelRequirement } from '@theia/ai-core';
import { injectable } from '@theia/core/shared/inversify';
import { nls } from '@theia/core';

type InfraModeId = 'design' | 'implement' | 'review' | 'test';

type InfraVariant = 0 | 1 | 2;

@injectable()
export class InfraAgent extends AbstractStreamParsingChatAgent {
    id: string = 'Infra';
    name: string = 'Infra';

    languageModelRequirements: LanguageModelRequirement[] = [{
        purpose: 'chat',
        identifier: 'default/universal'
    }];
    protected defaultLanguageModelPurpose: string = 'chat';

    override description = nls.localize('wti/infra/description',
        'Produces structured, ready-to-send delegations to specialist agents, using explicit modes.');

    override iconClass: string = 'codicon codicon-tools';

    modes: ChatMode[] = [
        { id: 'design', name: nls.localizeByDefault('Design'), isDefault: true },
        { id: 'implement', name: nls.localizeByDefault('Implement') },
        { id: 'review', name: nls.localizeByDefault('Review') },
        { id: 'test', name: nls.localizeByDefault('Test') }
    ];

    override async invoke(request: MutableChatRequestModel): Promise<void> {
        try {
            const modeId = (request.request.modeId as InfraModeId | undefined) ?? 'design';
            const userText = this.getUserText(request);

            const variant: InfraVariant = 0;

            const md = [
                this.renderHeading(modeId),
                '',
                this.generateDelegationBlock({ modeId, userTask: userText, variant })
            ].join('\n');

            request.response.response.addContent(new MarkdownChatResponseContentImpl(md));
            request.response.complete();
        } catch (e) {
            this.handleError(request, e as Error);
        }
    }

    protected renderHeading(modeId: InfraModeId): string {
        const target = this.getTargetAgent(modeId);
        return `**Mode:** ${modeId}  \\\n**Target:** @${target}`;
    }

    protected getUserText(request: MutableChatRequestModel): string {
        const allText = request.message.parts.map(p => p.text).join('');
        return allText.trim();
    }

    protected generateDelegationBlock(params: { modeId: InfraModeId; userTask: string; variant: InfraVariant }): string {
        const targetAgent = this.getTargetAgent(params.modeId);
        const risk = this.getRisk(params.modeId);
        const preconditions = this.getPreconditions(params.modeId, params.variant);
        const expected = this.getExpectedOutputs(params.modeId, params.variant);
        const rollback = this.getRollback(params.modeId, params.variant);

        return [
            '```ops',
            `Title: Infra delegation (${params.modeId})`,
            `Mode: ${params.modeId}`,
            `TargetAgent: @${targetAgent}`,
            `Risk: ${risk}`,
            'Preconditions:',
            ...preconditions.map(p => `- ${p}`),
            'Prompt:',
            this.getPromptForTarget(params.modeId, params.userTask, params.variant),
            'ExpectedOutputs:',
            ...expected.map(e => `- ${e}`),
            'Rollback:',
            ...rollback.map(r => `- ${r}`),
            '```'
        ].join('\n');
    }

    protected getTargetAgent(modeId: InfraModeId): string {
        switch (modeId) {
            case 'implement':
                return 'Coder';
            case 'design':
                return 'Architect';
            case 'review':
                return 'Reviewer';
            case 'test':
                return 'AppTester';
        }
    }

    protected getRisk(modeId: InfraModeId): string {
        switch (modeId) {
            case 'implement':
                return 'MEDIUM';
            case 'design':
                return 'LOW';
            case 'review':
                return 'LOW';
            case 'test':
                return 'MEDIUM';
        }
    }

    protected getPreconditions(_modeId: InfraModeId, variant: InfraVariant): string[] {
        if (variant === 0) {
            return ['Do not run tasks/commands unless the user explicitly asks.'];
        }
        if (variant === 1) {
            return [
                'Do not run tasks/commands unless the user explicitly asks.',
                'Confirm file paths by listing directories before editing.'
            ];
        }
        return [
            'Do not run tasks/commands unless the user explicitly asks.',
            'Confirm file paths by listing directories before editing.',
            'Respect repo boundary markers (WTI-ROLES.md) and avoid vendor trees unless instructed.'
        ];
    }

    protected getExpectedOutputs(modeId: InfraModeId, variant: InfraVariant): string[] {
        const base = ['Concrete next steps or code changes proposed as diffs.'];
        if (variant === 0) {
            return base;
        }
        if (modeId === 'implement') {
            return [...base, 'Files changed are minimal and scoped to the task.'];
        }
        return [...base, 'Clear rationale for the recommendation.'];
    }

    protected getRollback(_modeId: InfraModeId, variant: InfraVariant): string[] {
        if (variant === 0) {
            return ['Revert the proposed file changes.'];
        }
        return [
            'Revert the proposed file changes.',
            'If behavior regresses, disable/uninstall the extension and retry.'
        ];
    }

    protected getPromptForTarget(modeId: InfraModeId, userTask: string, variant: InfraVariant): string {
        const task = userTask.length > 0 ? userTask : 'Perform the requested task.';
        const tail = variant === 0
            ? []
            : variant === 1
                ? ['', 'Include a short verification checklist at the end.']
                : ['', 'Include a short verification checklist at the end.', 'Include a rollback note if the change is risky.'];

        if (modeId === 'implement') {
            return [
                '@Coder',
                '',
                'Implement the following task in this repository.',
                'Do not run tasks unless the user asks.',
                '',
                task,
                ...tail
            ].join('\n');
        }

        if (modeId === 'design') {
            return [
                '@Architect',
                '',
                'Produce a concrete design and implementation plan.',
                'Do not modify files.',
                '',
                task,
                ...tail
            ].join('\n');
        }

        if (modeId === 'review') {
            return [
                '@Reviewer',
                '',
                'Review the current approach/code and propose improvements.',
                'Do not run tasks unless the user asks.',
                '',
                task,
                ...tail
            ].join('\n');
        }

        return [
            '@AppTester',
            '',
            'Propose a minimal test/verification plan and how to execute it.',
            'Do not run tasks unless the user asks.',
            '',
            task,
            ...tail
        ].join('\n');
    }
}
