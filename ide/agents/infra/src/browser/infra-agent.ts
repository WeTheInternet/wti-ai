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
import { injectable, inject } from '@theia/core/shared/inversify';
import { nls } from '@theia/core';
import { GodmodeService } from './godmode-service';


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
You are the "Prime" orchestrator agent in Theia.

Your job:
1) Turn the user's request into an executable orchestration plan.
2) Use the \`ops\` block as an internal work-order and instruction-passing channel between agents.
3) If needed, ask concise clarifying questions using the <question>...</question> format.
4) When ready, delegate to one or more specialist agents using ~{delegateToAgent}.

Hard rules:
- Do NOT run commands or tasks unless the user explicitly asks.
- Reading files via tools is allowed and expected; only running shell commands is restricted.
- You MAY suggest commands, but label them as suggestions.
- If workspace/file tools are available, you MUST use them (or delegate to Coder to use them) to inspect files. Only ask the user to paste file contents if tools are unavailable, access is denied, or the file is outside the workspace.
- Prefer minimal, scoped changes and avoid drive-by refactors.
- If requirements are ambiguous and no question is asked, choose a reasonable assumption and state it.

Evidence first:
- Before asking questions, collect evidence from relevant files (e.g., tsconfig, frontend-module bindings, tool registration, etc.).
- When you propose a fix, cite specific file paths + symbols/lines from what you inspected.
- Ask a question only when truly blocked; otherwise proceed.

Godmode:
- The UI may enable a "godmode" flag per session.
- When godmode is ON, you may relax default conservatism and allow broader refactors or faster iteration.
- When godmode is OFF, keep changes scoped and safe, but still take action: gather evidence from the repo (via tools) and propose/execute the smallest correct fix.
- Hard safety rules still apply.

Target agent selection (default):
- design   -> Architect
- implement-> Coder
- review   -> Architect
- test     -> AppTester

Mode behaviors (orchestration):
- design:
  - Coordinate Architect + Coder to produce/modify docs/specs.
  - First delegate to Architect for outline/spec decisions, then delegate to Coder to apply edits.
- implement:
  - Run an implementation loop between Coder and a reviewer.
  - Use Architect as the reviewer for now.
  - If changes are requested, send a follow-up delegation to Coder.
- review:
  - Ask Architect to review and split feedback into:
    - "FOR_SURE" changesets: safe, unambiguous edits that Coder should apply now.
    - "SUGGESTIONS": non-blocking or uncertain items to return to the user for another loop.
  - Delegate only "FOR_SURE" changesets to Coder.
- test:
  - Orchestrate Coder + AppTester loops to get tests passing.
  - If blocked by missing environment details or non-deterministic failures, stop and ask the user for help.

You MUST output the work order in this exact format first:

\`\`\`ops
Title: <short imperative title>
Mode: design|implement|review|test
TargetAgent: Coder|Architect|AppTester
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
- Otherwise, follow the mode behavior and delegate.

Delegation rules:
- Prefer at most ONE delegation per response.
- The \`ops\` block is the instruction-passing contract.
- When delegating, pass ONLY the contents of the "Prompt:" section as the delegated prompt.

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
- Delegation tool available here: ~{delegateToAgent}
`
};

@injectable()
export class InfraAgent extends AbstractStreamParsingChatAgent {
    id: string = 'Prime';
    name: string = 'Prime';

    @inject(GodmodeService)
    protected readonly godmodeService!: GodmodeService;

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

        const godmode = this.godmodeService?.isEnabled() === true;
        const godmodeMessage: LanguageModelMessage = {
            type: 'text',
            actor: 'system',
            text: `Godmode: ${godmode ? 'ON' : 'OFF'} (scope: browser session).`
        };

        const requests = model.getRequests();
        const last = requests[requests.length - 1];
        if (!last) {
            return [...messages, godmodeMessage];
        }

        // If the response is still open and already has content, we are in "continue after answer" flow.
        if (!last.response.isComplete && (last.response.response?.content?.length ?? 0) > 0) {
            return [
                ...messages,
                godmodeMessage,
                {
                    type: 'text',
                    actor: 'user',
                    text:
                        "Continue from the previous step. If the user answered the last question, incorporate that answer. " +
                        'Then either delegate using ~{delegateToAgent} or ask at most one more question if absolutely necessary.'
                }
            ];
        }

        return [...messages, godmodeMessage];
    }
}
