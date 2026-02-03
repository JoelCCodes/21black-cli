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

// ─── Game Imports ────────────────────────────────────────────────────

import {
  createGameState, createDeck, shuffleDeck, dealInitialCards, calculateHandTotal,
  checkForBlackjack, playerHit, playerStand, playerDouble, playerSplit,
  splitHit, splitStand, dealerDrawOne, isDealerDone, settleRound,
  placeBet, checkGameOver, getAvailableActions, getWinRate,
} from './game.js';

import {
  renderWelcomeScreen, renderBettingScreen, renderGameScreen,
  renderGameOverScreen,
} from './renderer.js';

import * as readline from 'node:readline';

// ─── Terminal Helpers (Item 3.1) ─────────────────────────────────────

const SHOW_CURSOR = '\x1b[?25h';
const HIDE_CURSOR = '\x1b[?25l';

/**
 * Restore terminal to a clean state: show cursor, disable raw mode.
 * Safe to call multiple times — checks stdin.isRaw first.
 */
function restoreTerminal() {
  process.stdout.write(SHOW_CURSOR);
  if (process.stdin.isTTY && process.stdin.isRaw) {
    process.stdin.setRawMode(false);
  }
}

/**
 * Clean exit: restore terminal state, then exit.
 */
function cleanExit(code = 0) {
  restoreTerminal();
  process.exit(code);
}

// Catch SIGINT (Ctrl+C) — restore terminal and exit cleanly.
process.on('SIGINT', () => cleanExit(0));

// Safety net: restore terminal on uncaught errors so we don't leave a broken tty.
process.on('uncaughtException', (err) => {
  restoreTerminal();
  process.stderr.write(`\nFatal: ${err.message}\n`);
  process.exit(1);
});

/**
 * Wait for a single keypress in raw mode.
 * Returns the key string (lowercase).
 */
function waitForKey() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', (data) => {
      const key = data.toString();
      // Ctrl+C in raw mode comes as \x03
      if (key === '\x03') cleanExit(0);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve(key);
    });
  });
}

/**
 * Read a line of input (for bet amounts). Uses readline interface.
 * Returns the trimmed line. Handles 'q'/'Q' as quit.
 */
function readLine(prompt = '') {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
    // Ctrl+C in line mode triggers 'close' without answer — treat as quit
    rl.on('close', () => {
      resolve(null);
    });
  });
}

/**
 * Pause for a given number of milliseconds.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Game Loop (Items 3.2–3.10) ─────────────────────────────────────

async function main() {
  // Initialize game state and deck
  let state = createGameState();
  state = { ...state, deck: shuffleDeck(createDeck()) };

  // ── 3.2 Welcome Flow ──────────────────────────────────────────────
  process.stdout.write(HIDE_CURSOR);
  renderWelcomeScreen();

  // Wait for ENTER to start (or Q to quit)
  while (true) {
    const key = await waitForKey();
    if (key.toLowerCase() === 'q') cleanExit(0);
    if (key === '\r' || key === '\n') break;
  }

  // ── Main game loop (items 3.3–3.10) ────────────────────────────────
  // Outer loop: one iteration per hand. Exits on quit or game over quit.

  while (true) {
    // Transition to betting phase
    state = { ...state, phase: 'betting', result: null, playerHand: [], dealerHand: [], splitHands: undefined, activeHandIndex: 0 };

    // ── 3.3 Betting Input Loop ─────────────────────────────────────────
    let betError = null;
    while (true) {
      renderBettingScreen(state.chips, betError);
      process.stdout.write(SHOW_CURSOR);
      const input = await readLine('  > ');
      process.stdout.write(HIDE_CURSOR);

      // Ctrl+C / closed stream
      if (input === null) cleanExit(0);

      // Quit
      if (input.toLowerCase() === 'q') cleanExit(0);

      // Empty input — re-prompt
      if (input === '') {
        betError = 'Enter a bet amount.';
        continue;
      }

      // Parse numeric bet
      const amount = Number(input);
      if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
        betError = 'Enter a whole number.';
        continue;
      }

      const betResult = placeBet(state, amount);
      if (!betResult.valid) {
        betError = betResult.error;
        continue;
      }

      // Valid bet — advance state
      state = betResult.state;
      betError = null;
      break;
    }

    // TODO: Items 3.4–3.10 will continue the game loop here.
    // For now, re-loop back to betting after a valid bet (placeholder).
  }
}

main();
