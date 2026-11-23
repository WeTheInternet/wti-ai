import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

export type StartedTheia = {
  port: number;
  url: string;
  proc: ChildProcess;
  dispose: () => Promise<void>;
};

export async function startTheia(params?: { port?: number; timeout?: number; backendPath?: string }): Promise<StartedTheia> {
  // Own the backend directly: the CLI otherwise forks it into a separate process group.
  if (process.platform === 'win32') throw new Error('Theia smoke fixture requires POSIX process groups');
  const port = params?.port ?? Number(process.env.WTI_IDE_TEST_PORT ?? '1337');
  const url = `http://127.0.0.1:${port}`;
  const appRoot = path.resolve(__dirname, '../../../apps/wti-ide');
  const backend = params?.backendPath ?? path.join(appRoot, 'lib/backend/main.js');
  const configDir = await mkdtemp(path.join(tmpdir(), 'wti-theia-test-'));
  let proc: ChildProcess;
  try {
    proc = spawn(process.execPath, [backend, '--plugins=local-dir:plugins', '--hostname', '127.0.0.1', '--port', String(port)], {
      cwd: appRoot,
      detached: true,
      stdio: 'inherit',
      env: { ...process.env, THEIA_CONFIG_DIR: configDir, WTI_IDE_PORT: String(port), THEIA_PARENT_PID: String(process.pid) }
    });
  } catch (error) {
    await rm(configDir, { recursive: true, force: true }).catch(cleanupError => console.error('Theia config cleanup failed:', cleanupError));
    throw error;
  }

  let failure: Error | undefined;
  let closed = false;
  let stopping = false;
  proc.once('error', error => { failure = error; });
  proc.once('exit', (code, signal) => {
    if (!stopping) failure ??= new Error(`Theia exited before/during test (code=${code}, signal=${signal})`);
  });
  proc.once('close', () => { closed = true; });

  function signalGroup(signal: NodeJS.Signals | 0): boolean {
    if (!proc.pid) return false;
    try {
      process.kill(-proc.pid, signal);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ESRCH') return false;
      throw error;
    }
  }

  let disposal: Promise<void> | undefined;
  const cleanup = (): Promise<void> => disposal ??= (async () => {
    stopping = true;
    signalGroup('SIGTERM');
    const deadline = Date.now() + 3_000;
    while (signalGroup(0) && Date.now() < deadline) await delay(50);
    // Descendants may outlive the backend or ignore TERM. Always address the group.
    if (signalGroup(0)) signalGroup('SIGKILL');
    const closeDeadline = Date.now() + 5_000;
    while (!closed && Date.now() < closeDeadline) await delay(50);
    if (!closed) throw new Error('Theia process did not close after SIGKILL');
    await rm(configDir, { recursive: true, force: true });
  })();

  // Also clean up on unexpected server exit after a successful start.
  proc.once('close', () => { void cleanup().catch(error => console.error('Theia cleanup failed:', error)); });
  try {
    const deadline = Date.now() + (params?.timeout ?? 120_000);
    while (true) {
      if (failure) throw failure;
      if (Date.now() >= deadline) throw new Error(`Timed out waiting for Theia at ${url}`);
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(500) });
        await response.body?.cancel();
        if (failure) throw failure;
        if (response.status >= 200 && response.status < 500) break;
      } catch (error) {
        if (failure) throw failure;
        // Connection refusal/timeouts are expected until the server is ready.
      }
      await delay(100);
    }
    return {
      port, url, proc,
      async dispose() {
        await cleanup();
        if (failure) throw failure;
      }
    };
  } catch (error) {
    try {
      await cleanup();
    } catch (cleanupError) {
      // Keep the actual startup failure as the primary error.
      console.error('Theia cleanup failed after startup error:', cleanupError);
    }
    throw error;
  }
}
