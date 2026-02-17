// *****************************************************************************
// Copyright (C) 2026
//
// SPDX-License-Identifier: UNLICENSED
// *****************************************************************************

import {
    AbstractStreamParsingChatAgent,
    ChatMode,
    ChatModel,
    MutableChatRequestModel,
    lastProgressMessage,
    QuestionResponseContentImpl,
    unansweredQuestions,
    ProgressChatResponseContentImpl
} from '@theia/ai-chat';
import { BasePromptFragment, LanguageModelRequirement, LanguageModelMessage } from '@theia/ai-core';
import { injectable } from '@theia/core/shared/inversify';
import { nls } from '@theia/core';

type InfraModeId = 'design' | 'implement' | 'review' | 'test';

/**
 * Orchestrator agent:
 * - Produces a strict "ops" work order.
 * - Uses interactive AI flows via <question>...</question> blocks (content matcher + waitForInput).
 * - Enables agent-to-agent interaction by exposing ~{delegateToAgent} in the prompt template.
 *
 * The interactive pattern matches the Theia "Ask and Continue" sample approach:
 * - contentMatchers detect <question> blocks
 * - waitForInput() if unanswered
 * - continue generation after user selection
 */
const infraSystemPrompt: BasePromptFragment = {
    id: 'infra-system',
    template: `
You are the "Infra" orchestrator agent in Theia.

Your job:
1) Turn the user's request into a "smart work order" that a specialist agent can execute with minimal ambiguity.
2) If needed, ask concise clarifying questions using the <question>...</question> format.
3) When ready, delegate to the specialist agent using ~{delegateToAgent}.

Hard rules:
- Do NOT run commands or tasks unless the user explicitly asks.
- You MAY suggest commands, but label them as suggestions.
- Never pretend you read files you haven't been given. Instead list what you'd inspect.
- Prefer minimal, scoped changes and avoid drive-by refactors.
- If requirements are ambiguous and no question is asked, choose a reasonable assumption and state it.

Target agent selection:
- design   -> @Architect
- implement-> @Coder
- review   -> @Reviewer
- test     -> @AppTester

You MUST output the work order in this exact format first:

\`\`\`ops
Title: <short imperative title>
Mode: design|implement|review|test
TargetAgent: @Coder|@Architect|@Reviewer|@AppTester
Risk: LOW|MEDIUM|HIGH
Context:
- <what the user asked>
- <what repo info you still need / will inspect>
Objectives:
- <3-7 bullets>
Constraints:
- Do not run tasks/commands unless the user explicitly asks.
- <other constraints>
Deliverables:
- <what the target agent must produce>
AcceptanceCriteria:
- <what "done" means>
Verification:
- <how to verify; suggest commands if relevant>
Rollback:
- <how to revert safely>
Prompt:
<the exact prompt you want the TargetAgent to follow; include strict output format and diff requirements>
\`\`\`

After the ops block:
- If you need a user decision or clarification, ask ONE question using the exact <question>...</question> format.
- Otherwise, delegate immediately using ~{delegateToAgent} (agentId should match without "@", e.g. "Coder") and then summarize results.

Interactive question format (exact):
<question>
{
  "question": "YOUR QUESTION HERE",
  "options": [
    { "text": "OPTION 1" },
    { "text": "OPTION 2" }
  ]
}
</question>

IMPORTANT:
- Only use <question> when truly necessary (missing critical info or user must choose).
- If you delegate, pass ONLY the contents of the "Prompt:" section as the delegated prompt.
- Delegation tool available here: ~{delegateToAgent}
`
};

@injectable()
export class InfraAgent extends AbstractStreamParsingChatAgent {
    id: string = 'Infra';
    name: string = 'Infra';

    override description = nls.localize(
        'wti/infra/description',
        'Produces smart work orders and optionally delegates execution to specialist agents using interactive AI flows.'
    );

    override iconClass: string = 'codicon codicon-tools';

    protected defaultLanguageModelPurpose: string = 'chat';
    override languageModelRequirements: LanguageModelRequirement[] = [
        {
            purpose: 'chat',
            identifier: 'default/universal'
        }
    ];

    override prompts = [{ id: infraSystemPrompt.id, defaultVariant: infraSystemPrompt }];
    protected override systemPromptId: string | undefined = infraSystemPrompt.id;

    modes: ChatMode[] = [
        { id: 'design', name: nls.localizeByDefault('Design'), isDefault: true },
        { id: 'implement', name: nls.localizeByDefault('Implement') },
        { id: 'review', name: nls.localizeByDefault('Review') },
        { id: 'test', name: nls.localizeByDefault('Test') }
    ];

    constructor() {
        super();
        // Avoid @postConstruct because many repos use TS 5+ "standard decorators"
        // which are not compatible with legacy inversify decorators by default.
        this.addContentMatchers();
    }

    protected addContentMatchers(): void {
        // Turn <question> JSON blocks into an interactive question UI.
        this.contentMatchers.push({
            start: /^<question>.*$/m,
            end: /^<\/question>$/m,
            contentFactory: (content: string, request: MutableChatRequestModel) => {
                // Content includes the <question> wrapper. Strip it.
                const questionJson = content
                    .replace(/^<question>\r?\n/, '')
                    .replace(/\r?\n<\/question>$/, '');

                const parsed = JSON.parse(questionJson) as {
                    question: string;
                    options: Array<{ text: string; value?: string }>;
                };

                return new QuestionResponseContentImpl(parsed.question, parsed.options, request, selectedOption => {
                    this.handleAnswer(selectedOption, request);
                });
            },
            incompleteContentFactory: () => new ProgressChatResponseContentImpl('Preparing question...')
        });
    }

    protected override async onResponseComplete(request: MutableChatRequestModel): Promise<void> {
        // If there are unanswered interactive questions, keep the response open.
        const unanswered = unansweredQuestions(request);
        if (unanswered.length < 1) {
            return super.onResponseComplete(request);
        }
        request.response.addProgressMessage({
            content: 'Waiting for input...',
            show: 'whileIncomplete'
        });
        request.response.waitForInput();
    }

    protected handleAnswer(selectedOption: { text: string; value?: string }, request: MutableChatRequestModel): void {
        // Mark progress done, stop waiting, then continue the agent response
        const progressMessage = lastProgressMessage(request);
        if (progressMessage) {
            request.response.updateProgressMessage({
                ...progressMessage,
                show: 'untilFirstContent',
                status: 'completed'
            });
        }
        request.response.stopWaitingForInput();

        // Continue by invoking again, same pattern as Theia sample agents.
        this.invoke(request);
    }

    /**
     * When continuing within the same response after a user answers a question,
     * append a hint message so the LLM continues rather than restarting.
     */
    protected override async getMessages(model: ChatModel): Promise<LanguageModelMessage[]> {
        const messages = await super.getMessages(model, true);

        const requests = model.getRequests();
        const last = requests[requests.length - 1];
        if (!last) {
            return messages;
        }

        // If the response is still open and already has content, we are in "continue after answer" flow.
        if (!last.response.isComplete && (last.response.response?.content?.length ?? 0) > 0) {
            return [
                ...messages,
                {
                    type: 'text',
                    actor: 'user',
                    text:
                        "Continue from the previous step. If the user answered the last question, incorporate that answer. " +
                        'Then either delegate using ~{delegateToAgent} or ask at most one more question if absolutely necessary.'
                }
            ];
        }

        return messages;
    }
}
