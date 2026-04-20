import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFilePath);
const projectDirectory = resolve(currentDirectory, '..');
const sourceDirectory = resolve(
  projectDirectory,
  'node_modules/@sqlite.org/sqlite-wasm/dist',
);
const targetDirectory = resolve(projectDirectory, 'public/assets/sqlite-wasm');

if (!existsSync(sourceDirectory)) {
  console.warn('SQLite WASM distribution folder not found.');
  process.exit(0);
}

mkdirSync(targetDirectory, { recursive: true });
cpSync(sourceDirectory, targetDirectory, { recursive: true });
