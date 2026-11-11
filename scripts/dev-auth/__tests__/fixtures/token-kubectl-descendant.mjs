import { spawn } from 'node:child_process';
import { writeFileSync, writeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const config = JSON.parse(process.env.TOKEN_FIXTURE_CONFIG);
if (process.argv[2] === '--descendant') {
  writeFileSync(config.readyPath, String(process.pid));
  setInterval(() => {}, 1000);
} else {
  writeFileSync(
    config.recordPath,
    JSON.stringify({ args: process.argv.slice(2), pid: process.pid }),
  );
  process.on('SIGTERM', () => {});
  const descendant = spawn(process.execPath, [fileURLToPath(import.meta.url), '--descendant'], {
    stdio: ['ignore', 'ignore', 'inherit'],
    detached: true,
  });
  descendant.unref();
  if (config.exitAfterSpawn) writeSync(1, config.stdout);
  else setInterval(() => {}, 1000);
}
