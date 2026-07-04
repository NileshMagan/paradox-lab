import { spawn } from 'node:child_process';

/**
 * Dev convenience: run the Vite dev server and the multiplayer room server
 * together (`npm run dev:mp`). Vite proxies /ws → the room server, so the
 * client connects same-origin. Ctrl-C stops both. No extra deps.
 */

const procs = [
  spawn('npm', ['run', 'server'], { stdio: 'inherit', shell: true }),
  spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: true }),
];

function shutdown() {
  for (const p of procs) p.kill('SIGINT');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
for (const p of procs) {
  p.on('exit', (code) => {
    if (code) shutdown();
  });
}
