import { inject, injectable } from '@theia/core/shared/inversify';
import { Command, CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { MessageService } from '@theia/core/lib/common/message-service';
import { ScopeService } from './scope-service';

export namespace ScopeCommands {
    export const TOGGLE: Command = {
        id: 'wti.ai.scope.toggle',
        label: 'Toggle Agent Scope'
    };

    export const CONSERVATIVE: Command = {
        id: 'wti.ai.scope.conservative',
        label: 'Set Agent Scope: Conservative'
    };

    export const EXPANSIVE: Command = {
        id: 'wti.ai.scope.expansive',
        label: 'Set Agent Scope: Expansive'
    };

    export const STATUS: Command = {
        id: 'wti.ai.scope.status',
        label: 'Agent Scope Status'
    };
}

@injectable()
export class ScopeCommandContribution implements CommandContribution {

    @inject(ScopeService)
    protected readonly scopeService!: ScopeService;

    @inject(MessageService)
    protected readonly messageService!: MessageService;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(ScopeCommands.TOGGLE, {
            execute: () => {
                const scope = this.scopeService.toggle();
                this.messageService.info(`Agent scope: ${scope}`);
            }
        });

        registry.registerCommand(ScopeCommands.CONSERVATIVE, {
            execute: () => {
                this.scopeService.setScope('CONSERVATIVE');
                this.messageService.info('Agent scope: CONSERVATIVE');
            }
        });

        registry.registerCommand(ScopeCommands.EXPANSIVE, {
            execute: () => {
                this.scopeService.setScope('EXPANSIVE');
                this.messageService.info('Agent scope: EXPANSIVE');
            }
        });

        registry.registerCommand(ScopeCommands.STATUS, {
            execute: () => {
                const scope = this.scopeService.getScope();
                this.messageService.info(`Agent scope: ${scope}`);
            }
        });
    }
}
