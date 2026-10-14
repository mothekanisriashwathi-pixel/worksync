import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const rootDir = resolve(__dirname, '..');
const backendDir = join(rootDir, 'worksync-backend');

function getPythonCommand() {
  const isWindows = process.platform === 'win32';
  const venvCandidates = [
    join(backendDir, '.venv', isWindows ? 'Scripts/python.exe' : 'bin/python'),
    join(backendDir, 'venv', isWindows ? 'Scripts/python.exe' : 'bin/python'),
    join(rootDir, '.venv', isWindows ? 'Scripts/python.exe' : 'bin/python'),
    join(rootDir, 'venv', isWindows ? 'Scripts/python.exe' : 'bin/python'),
  ];

  for (const candidate of venvCandidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return 'python';
}

const pythonCmd = getPythonCommand();
const args = ['-m', 'uvicorn', 'main:app', '--reload', '--port', '8000', '--host', '127.0.0.1'];

console.log(`[WorkSync Backend] Starting FastAPI via ${pythonCmd}...`);

const backend = spawn(pythonCmd, args, {
  cwd: backendDir,
  stdio: 'inherit',
  shell: false,
});

backend.on('error', (err) => {
  console.error('[WorkSync Backend] Failed to start backend:', err.message);
  process.exit(1);
});

backend.on('close', (code) => {
  if (code !== 0 && code !== null) {
    process.exit(code);
  }
});
