import { execFile } from 'node:child_process';
import path from 'node:path';
import { TextDecoder } from 'node:util';
import type { GraphLedgerService, LedgerResult, LedgerSource } from '../common/graph-ledger-protocol.js';
import { decodeLedgerSummary } from './graph-ledger-summary.js';

export interface LedgerSourceConfig extends LedgerSource {
    repo: string;
    ref: string;
    summaryPath: string;
    staleAfterMs: number;
}
const MAX_BYTES = 1024 * 1024;
const TIMEOUT_MS = 5000;
const message = {
    unconfigured: 'This ledger source is not configured.',
    missing: 'The configured local ref or summary is missing. No fetch was attempted.',
    invalid: 'The ledger summary or source configuration is invalid or exceeds the read limit.',
    timeout: 'The local ledger read timed out.',
    unavailable: 'The local ledger could not be read.',
    busy: 'A local ledger refresh is already in progress.'
} as const;
type ErrorCode = keyof typeof message;
export class LedgerReadError extends Error {
    constructor(readonly code: ErrorCode) { super(message[code]); }
}
export function parseLedgerSources(raw?: string): LedgerSourceConfig[] {
    if (!raw) return [];
    if (raw.length > 16384) throw new LedgerReadError('invalid');
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || value.length > 8) throw new LedgerReadError('invalid');
    const result = value.map(entry => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new LedgerReadError('invalid');
        const data = entry as Record<string, unknown>;
        if (Object.keys(data).some(key => !['id', 'label', 'repo', 'ref', 'summaryPath', 'staleAfterMs'].includes(key))) throw new LedgerReadError('invalid');
        const { id, label, repo, ref, summaryPath } = data;
        const staleAfterMs = data.staleAfterMs ?? 300000;
        if (typeof id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(id)
            || typeof label !== 'string' || !label.trim() || label.length > 128
            || typeof repo !== 'string' || !path.isAbsolute(repo) || repo.length > 4096 || /[\x00-\x1f]/.test(repo)
            || typeof ref !== 'string' || ref.length > 256 || !/^refs\/(heads|remotes)\/[A-Za-z0-9_./-]+$/.test(ref)
            || ref.includes('..') || ref.includes('//') || ref.endsWith('/') || ref.endsWith('.lock')
            || typeof summaryPath !== 'string' || summaryPath.length > 256
            || !/^[A-Za-z0-9][A-Za-z0-9._/-]*\.json$/.test(summaryPath)
            || summaryPath.split('/').some(part => !part || part === '.' || part === '..' || part.startsWith('.'))
            || !Number.isInteger(staleAfterMs) || Number(staleAfterMs) < 1000 || Number(staleAfterMs) > 86400000) {
            throw new LedgerReadError('invalid');
        }
        return Object.freeze({ id, label, repo, ref, summaryPath, staleAfterMs: Number(staleAfterMs) });
    });
    if (new Set(result.map(source => source.id)).size !== result.length) throw new LedgerReadError('invalid');
    return result;
}

export type GitRead = (repo: string, args: readonly string[], limits: { timeoutMs: number; maxBytes: number }) => Promise<Buffer>;
/** No shell, inherited credentials, hooks, optional writes, protocol or lazy fetch. */
export const readGit: GitRead = (repo, args, limits) => new Promise((resolve, reject) => {
    execFile('/usr/bin/git', ['--no-pager', '--no-optional-locks', '-c', 'core.hooksPath=/dev/null',
        '-c', 'core.fsmonitor=false', '-c', 'protocol.allow=never', '-C', repo, ...args], {
        encoding: 'buffer', timeout: limits.timeoutMs, maxBuffer: Math.max(4096, limits.maxBytes),
        killSignal: 'SIGKILL', windowsHide: true,
        env: { PATH: '/usr/bin:/bin', LANG: 'C', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
            GIT_TERMINAL_PROMPT: '0', GIT_NO_LAZY_FETCH: '1', GIT_NO_REPLACE_OBJECTS: '1',
            GIT_ALLOW_PROTOCOL: '', GIT_OPTIONAL_LOCKS: '0' }
    }, (error, stdout) => {
        if (error) {
            const code = error.code;
            reject(new LedgerReadError(error.killed ? 'timeout'
                : code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' ? 'invalid'
                : typeof code === 'number' ? 'missing' : 'unavailable'));
        } else if (stdout.length > limits.maxBytes) reject(new LedgerReadError('invalid'));
        else resolve(stdout);
    });
});

export class LocalGraphLedger implements GraphLedgerService {
    private readonly sources: ReadonlyMap<string, LedgerSourceConfig>;
    private busy = false;
    constructor(sources: LedgerSourceConfig[], private readonly run: GitRead = readGit,
        private readonly clock: () => number = Date.now, private readonly configurationError?: string) {
        // Revalidate and copy even caller-provided configuration before retaining it.
        this.sources = new Map(parseLedgerSources(JSON.stringify(sources)).map(source => [source.id, source]));
    }
    async listSources(): Promise<{ sources: LedgerSource[]; configurationError?: string }> {
        return { sources: [...this.sources.values()].map(({ id, label }) => ({ id, label })),
            ...(this.configurationError ? { configurationError: this.configurationError } : {}) };
    }
    async refresh(sourceId: string): Promise<LedgerResult> {
        const source = this.sources.get(sourceId);
        if (!source) return this.failure('unconfigured');
        if (this.busy) return this.failure('busy');
        this.busy = true;
        const deadline = this.clock() + TIMEOUT_MS;
        const run = (args: string[], maxBytes: number): Promise<Buffer> => {
            const remaining = deadline - this.clock();
            if (remaining <= 0) throw new LedgerReadError('timeout');
            return this.run(source.repo, args, { timeoutMs: remaining, maxBytes });
        };
        try {
            const commit = (await run(['rev-parse', '--verify', '--end-of-options', `${source.ref}^{commit}`], 256)).toString('ascii').trim();
            if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(commit)) throw new LedgerReadError('invalid');
            const object = `${commit}:${source.summaryPath}`;
            if ((await run(['cat-file', '-t', object], 64)).toString('ascii').trim() !== 'blob') throw new LedgerReadError('invalid');
            const sizeText = (await run(['cat-file', '-s', object], 64)).toString('ascii').trim();
            if (!/^\d+$/.test(sizeText)) throw new LedgerReadError('invalid');
            const size = Number(sizeText);
            if (size > MAX_BYTES) throw new LedgerReadError('invalid');
            const bytes = await run(['cat-file', 'blob', object], MAX_BYTES);
            if (bytes.length !== size || bytes.length > MAX_BYTES) throw new LedgerReadError('invalid');
            const decoded = decodeLedgerSummary(new TextDecoder('utf-8', { fatal: true }).decode(bytes), commit);
            return { ok: true, value: { ...decoded, source: { id: source.id, label: source.label, commit,
                reportedAt: decoded.snapshot.asOf, readAt: new Date(this.clock()).toISOString(), staleAfterMs: source.staleAfterMs } } };
        } catch (error) {
            return this.failure(error instanceof LedgerReadError ? error.code : 'invalid');
        } finally { this.busy = false; }
    }
    private failure(code: ErrorCode): LedgerResult { return { ok: false, error: { code, message: message[code] } }; }
}

export function configuredGraphLedger(raw = process.env.WTI_AGENT_GRAPH_LEDGER_SOURCES): LocalGraphLedger {
    try { return new LocalGraphLedger(parseLedgerSources(raw)); }
    catch { return new LocalGraphLedger([], readGit, Date.now, message.invalid); }
}

/** JSON-RPC must never see private runtime fields on LocalGraphLedger. */
export function publicLedgerEndpoint(service: GraphLedgerService): GraphLedgerService {
    return Object.assign(Object.create(null), {
        listSources: () => service.listSources(),
        refresh: (sourceId: string) => service.refresh(sourceId)
    });
}
