import { inject, injectable } from '@theia/core/shared/inversify';
import { CommandService } from '@theia/core';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application-contribution';
import { MessageService } from '@theia/core/lib/common/message-service';
import { MutableChatRequestModel } from '@theia/ai-chat';
import { ScopeCommands } from './scope-command-contribution';
import { ChatSlashCommandHandler, ChatSlashCommandRegistry } from './godmode-slash-command-contribution';

export const SCOPE_SLASH_COMMAND_ID = 'scope';

@injectable()
export class ScopeSlashCommandContribution implements ChatSlashCommandHandler, FrontendApplicationContribution {
    readonly id: string = SCOPE_SLASH_COMMAND_ID;

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
        if (!trimmed.startsWith('/scope')) {
            return false;
        }

        const parts = trimmed.split(/\s+/).filter(Boolean);
        const arg = (parts[1] ?? '').toLowerCase();

        if (arg === 'conservative' || arg === 'safe' || arg === 'min') {
            await this.commandService.executeCommand(ScopeCommands.CONSERVATIVE.id);
            return true;
        }

        if (arg === 'expansive' || arg === 'broad' || arg === 'max') {
            await this.commandService.executeCommand(ScopeCommands.EXPANSIVE.id);
            return true;
        }

        if (arg === 'status') {
            await this.commandService.executeCommand(ScopeCommands.STATUS.id);
            return true;
        }

        if (arg === '' || arg === 'toggle') {
            await this.commandService.executeCommand(ScopeCommands.TOGGLE.id);
            return true;
        }

        this.messageService.info('Usage: /scope [conservative|expansive|status]');
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
