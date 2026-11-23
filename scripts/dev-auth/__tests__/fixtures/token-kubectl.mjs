import { existsSync, writeFileSync, writeSync } from 'node:fs';

const config = JSON.parse(process.env.TOKEN_FIXTURE_CONFIG);
writeFileSync(config.recordPath, JSON.stringify({ args: process.argv.slice(2), pid: process.pid }));
if (config.ignoreTerm) process.on('SIGTERM', () => {});
if (config.stderr) writeSync(2, config.stderr);
if (config.readyPath) writeFileSync(config.readyPath, 'ready');

const finish = () => {
  if (config.stdout) writeSync(1, config.stdout);
  process.exitCode = config.exitCode ?? 0;
};
if (config.releasePath) {
  const timer = setInterval(() => {
    if (existsSync(config.releasePath)) {
      clearInterval(timer);
      finish();
    }
  }, 5);
} else if (config.hang) {
  setInterval(() => {}, 1000);
} else {
  finish();
}
