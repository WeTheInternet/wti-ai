import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import waitOn from 'wait-on';

export type StartedTheia = {
  port: number;
  url: string;
  proc: ChildProcess;
  dispose: () => Promise<void>;
};

export async function startTheia(params?: { port?: number }): Promise<StartedTheia> {
  const port = params?.port ?? Number(process.env.WTI_IDE_TEST_PORT ?? '1337');
  const url = `http://127.0.0.1:${port}`;

  const ideRoot = path.resolve(__dirname, '../../..');

  const proc = spawn('pnpm', ['--filter', '@wti/wti-ide', 'run', 'start', '--', '--port', String(port)], {
    cwd: ideRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      WTI_IDE_PORT: String(port)
    }
  });

  await waitOn({
    resources: [url],
    timeout: 120_000,
    interval: 250,
    validateStatus: (status: number) => status >= 200 && status < 500
  });

  return {
    port,
    url,
    proc,
    dispose: async () => {
      if (!proc.killed) {
        proc.kill();
      }
    }
  };
}
