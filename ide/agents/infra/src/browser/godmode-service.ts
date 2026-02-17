import { injectable } from '@theia/core/shared/inversify';

export const GODMODE_STORAGE_KEY = 'wti.ai.godmode.enabled';

@injectable()
export class GodmodeService {
    protected enabled: boolean = false;

    constructor() {
        this.enabled = this.readFromSessionStorage();
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        this.writeToSessionStorage(enabled);
    }

    toggle(): boolean {
        const next = !this.enabled;
        this.setEnabled(next);
        return next;
    }

    protected readFromSessionStorage(): boolean {
        if (typeof window === 'undefined') {
            return false;
        }
        const raw = window.sessionStorage.getItem(GODMODE_STORAGE_KEY);
        return raw === 'true';
    }

    protected writeToSessionStorage(enabled: boolean): void {
        if (typeof window === 'undefined') {
            return;
        }
        window.sessionStorage.setItem(GODMODE_STORAGE_KEY, String(enabled));
    }
}
