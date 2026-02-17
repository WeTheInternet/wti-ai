import { inject, injectable, named } from '@theia/core/shared/inversify';
import { CommandService, ContributionProvider, Emitter } from '@theia/core';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application-contribution';
import { MessageService } from '@theia/core/lib/common/message-service';
import { MutableChatRequestModel } from '@theia/ai-chat';
import { GodmodeCommands } from './godmode-command-contribution';

export const GODMODE_SLASH_COMMAND_ID = 'godmode';

export interface ChatSlashCommandHandler {
    readonly id: string;
    tryHandle(input: string): Promise<boolean>;
    tryHandleChatRequest?(request: MutableChatRequestModel): Promise<boolean>;
}

export const ChatSlashCommandHandler = Symbol('ChatSlashCommandHandler');

@injectable()
export class ChatSlashCommandRegistry {
    protected readonly onDidHandleEmitter = new Emitter<void>();
    readonly onDidHandle = this.onDidHandleEmitter.event;

    @inject(ContributionProvider)
    @named(ChatSlashCommandHandler)
    protected readonly contributions!: ContributionProvider<ChatSlashCommandHandler>;

    async tryHandleRawInput(input: string): Promise<boolean> {
        const handlers = this.contributions.getContributions();
        for (const handler of handlers) {
            if (await handler.tryHandle(input)) {
                this.onDidHandleEmitter.fire();
                return true;
            }
        }
        return false;
    }

    async tryHandleChatRequest(request: MutableChatRequestModel): Promise<boolean> {
        const handlers = this.contributions.getContributions();
        for (const handler of handlers) {
            if (handler.tryHandleChatRequest && (await handler.tryHandleChatRequest(request))) {
                this.onDidHandleEmitter.fire();
                return true;
            }
        }
        return false;
    }
}

@injectable()
export class GodmodeSlashCommandContribution implements ChatSlashCommandHandler, FrontendApplicationContribution {
    readonly id: string = GODMODE_SLASH_COMMAND_ID;

    @inject(CommandService)
    protected readonly commandService!: CommandService;

    @inject(MessageService)
    protected readonly messageService!: MessageService;

    @inject(ChatSlashCommandRegistry)
    protected readonly registry!: ChatSlashCommandRegistry;

    onStart(): void {
        this.registry.onDidHandle(() => undefined);
    }

    async tryHandle(input: string): Promise<boolean> {
        const trimmed = input.trim();
        if (!trimmed.startsWith('/godmode')) {
            return false;
        }

        const parts = trimmed.split(/\s+/).filter(Boolean);
        const arg = (parts[1] ?? '').toLowerCase();

        if (arg === 'on') {
            await this.commandService.executeCommand(GodmodeCommands.ENABLE.id);
            return true;
        }

        if (arg === 'off') {
            await this.commandService.executeCommand(GodmodeCommands.DISABLE.id);
            return true;
        }

        if (arg === 'status') {
            await this.commandService.executeCommand(GodmodeCommands.STATUS.id);
            return true;
        }

        if (arg === '' || arg === 'toggle') {
            await this.commandService.executeCommand(GodmodeCommands.TOGGLE.id);
            return true;
        }

        this.messageService.info('Usage: /godmode [on|off|status]');
        return true;
    }

    protected getRequestText(request: MutableChatRequestModel): string {
        const anyReq = request as any;
        if (typeof anyReq.text === 'string') {
            return anyReq.text;
        }
        if (typeof anyReq.message === 'string') {
            return anyReq.message;
        }
        if (anyReq.message && typeof anyReq.message.text === 'string') {
            return anyReq.message.text;
        }
        if (anyReq.message && typeof anyReq.message.content === 'string') {
            return anyReq.message.content;
        }
        if (typeof anyReq.prompt === 'string') {
            return anyReq.prompt;
        }
        if (anyReq.request && typeof anyReq.request.text === 'string') {
            return anyReq.request.text;
        }
        return '';
    }

    async tryHandleChatRequest(request: MutableChatRequestModel): Promise<boolean> {
        const text = this.getRequestText(request).trim();
        return this.tryHandle(text);
    }
}
