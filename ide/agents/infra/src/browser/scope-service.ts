import { injectable } from '@theia/core/shared/inversify';

export const SCOPE_STORAGE_KEY = 'wti.ai.agent.scope';

export type AgentScope = 'CONSERVATIVE' | 'EXPANSIVE';

@injectable()
export class ScopeService {
    protected scope: AgentScope = 'CONSERVATIVE';

    constructor() {
        this.scope = this.readFromSessionStorage();
    }

    getScope(): AgentScope {
        return this.scope;
    }

    setScope(scope: AgentScope): void {
        this.scope = scope;
        this.writeToSessionStorage(scope);
    }

    toggle(): AgentScope {
        const next: AgentScope = this.scope === 'CONSERVATIVE' ? 'EXPANSIVE' : 'CONSERVATIVE';
        this.setScope(next);
        return next;
    }

    protected readFromSessionStorage(): AgentScope {
        if (typeof window === 'undefined') {
            return 'CONSERVATIVE';
        }
        const raw = window.sessionStorage.getItem(SCOPE_STORAGE_KEY);
        return raw === 'EXPANSIVE' ? 'EXPANSIVE' : 'CONSERVATIVE';
    }

    protected writeToSessionStorage(scope: AgentScope): void {
        if (typeof window === 'undefined') {
            return;
        }
        window.sessionStorage.setItem(SCOPE_STORAGE_KEY, scope);
    }
}
