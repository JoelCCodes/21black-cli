#!/usr/bin/env node
// src/index.js — Entry point. Wires game logic + renderer + user input.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ─── CLI Argument Handling (Item 3.0) ────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);

if (args.includes('--help')) {
  process.stdout.write(
    `21black - Terminal Blackjack

Usage: 21black [options]

Options:
  --help      Show this help message
  --version   Show version number

Start a game of blackjack right in your terminal.
`
  );
  process.exit(0);
}

if (args.includes('--version')) {
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
  process.stdout.write(`21black v${pkg.version}\n`);
  process.exit(0);
}

// ─── Game Launch ─────────────────────────────────────────────────────
// Items 3.1–3.10 will build out the full game loop below.
// For now, the entry point is ready for CLI usage.
