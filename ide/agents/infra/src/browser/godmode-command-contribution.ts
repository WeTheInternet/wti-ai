import { inject, injectable } from '@theia/core/shared/inversify';
import { Command, CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { MessageService } from '@theia/core/lib/common/message-service';
import { GodmodeService } from './godmode-service';

export namespace GodmodeCommands {
    export const TOGGLE: Command = {
        id: 'wti.ai.godmode.toggle',
        label: 'Toggle Godmode'
    };

    export const ENABLE: Command = {
        id: 'wti.ai.godmode.enable',
        label: 'Enable Godmode'
    };

    export const DISABLE: Command = {
        id: 'wti.ai.godmode.disable',
        label: 'Disable Godmode'
    };

    export const STATUS: Command = {
        id: 'wti.ai.godmode.status',
        label: 'Godmode Status'
    };
}

@injectable()
export class GodmodeCommandContribution implements CommandContribution {

    @inject(GodmodeService)
    protected readonly godmodeService!: GodmodeService;

    @inject(MessageService)
    protected readonly messageService!: MessageService;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(GodmodeCommands.TOGGLE, {
            execute: () => {
                const enabled = this.godmodeService.toggle();
                this.messageService.info(`Godmode: ${enabled ? 'ON' : 'OFF'}`);
            }
        });

        registry.registerCommand(GodmodeCommands.ENABLE, {
            execute: () => {
                this.godmodeService.setEnabled(true);
                this.messageService.info('Godmode: ON');
            }
        });

        registry.registerCommand(GodmodeCommands.DISABLE, {
            execute: () => {
                this.godmodeService.setEnabled(false);
                this.messageService.info('Godmode: OFF');
            }
        });

        registry.registerCommand(GodmodeCommands.STATUS, {
            execute: () => {
                const enabled = this.godmodeService.isEnabled();
                this.messageService.info(`Godmode: ${enabled ? 'ON' : 'OFF'}`);
            }
        });
    }
}
