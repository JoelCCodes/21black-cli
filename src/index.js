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
  renderGameOverScreen, getTerminalWidth, dim,
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

    const onData = (data) => {
      cleanup();
      const key = data.toString();
      // Ctrl+C in raw mode comes as \x03
      if (key === '\x03') cleanExit(0);
      resolve(key);
    };

    const onEnd = () => {
      cleanup();
      cleanExit(0);
    };

    function cleanup() {
      process.stdin.removeListener('data', onData);
      process.stdin.removeListener('end', onEnd);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.pause();
    }

    process.stdin.once('data', onData);
    process.stdin.once('end', onEnd);
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
    let answered = false;
    rl.question(prompt, (answer) => {
      answered = true;
      rl.close();
      resolve(answer.trim());
    });
    // Ctrl+C in line mode triggers 'close' without answer — treat as quit
    rl.on('close', () => {
      if (!answered) resolve(null);
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

  // Terminal width warning (item 5.1)
  const termWidth = getTerminalWidth();
  if (termWidth < 80) {
    process.stderr.write(dim(`Warning: terminal width is ${termWidth} columns (80 recommended)\n`));
  }

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

  let lastBet = 0;

  while (true) {
    // Transition to betting phase
    state = { ...state, phase: 'betting', result: null, playerHand: [], dealerHand: [], splitHands: undefined, activeHandIndex: 0 };

    // ── 3.3 Betting Input Loop ─────────────────────────────────────────
    let betError = null;
    while (true) {
      renderBettingScreen(state.chips, betError, lastBet, state.stats);
      process.stdout.write(SHOW_CURSOR);
      const input = await readLine('  > ');
      process.stdout.write(HIDE_CURSOR);

      // Ctrl+C / closed stream
      if (input === null) cleanExit(0);

      // Quit
      if (input.toLowerCase() === 'q') cleanExit(0);

      // Empty input — repeat last bet (clamped to available chips)
      if (input === '') {
        if (lastBet <= 0) {
          betError = 'Enter a bet amount.';
          continue;
        }
        const repeatAmount = Math.min(lastBet, state.chips);
        const betResult = placeBet(state, repeatAmount);
        if (!betResult.valid) {
          betError = betResult.error;
          continue;
        }
        state = betResult.state;
        lastBet = repeatAmount;
        betError = null;
        break;
      }

      // Parse numeric bet — reject hex (0x), octal (0o), binary (0b), and other non-decimal formats
      if (!/^[+-]?\d+(\.\d+)?$/.test(input)) {
        betError = 'Enter a whole number.';
        continue;
      }
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

      // Valid bet — advance state and remember for next hand
      state = betResult.state;
      lastBet = amount;
      betError = null;
      break;
    }

    // ── 3.4 Deal & Blackjack Check ───────────────────────────────────
    state = dealInitialCards(state);
    renderGameScreen(state, calculateHandTotal, getAvailableActions);

    // Brief pause after deal for dramatic effect
    await sleep(400);

    // Check for blackjack (player and/or dealer)
    const postBJ = checkForBlackjack(state);
    if (postBJ.phase === 'result') {
      // Blackjack detected — show the result
      state = postBJ;
      renderGameScreen(state, calculateHandTotal, getAvailableActions);
      await sleep(2500);

      // Check game over
      state = checkGameOver(state);
      if (state.phase === 'gameOver') {
        renderGameOverScreen(state, getWinRate);
        while (true) {
          const key = await waitForKey();
          if (key.toLowerCase() === 'q') cleanExit(0);
          if (key === '\r' || key === '\n') {
            // Play again — reset chips, keep stats
            state = { ...state, chips: 1000, phase: 'betting' };
            break;
          }
        }
        continue; // back to outer loop (betting)
      }

      // Clear reshuffled flag after displaying
      state = { ...state, reshuffled: false };

      // Not game over — prompt for next hand
      // Wait for ENTER or Q
      while (true) {
        const key = await waitForKey();
        if (key.toLowerCase() === 'q') cleanExit(0);
        if (key === '\r' || key === '\n') break;
      }
      continue; // back to outer loop (betting)
    }

    // No blackjack — clear reshuffled flag after it's been rendered
    state = { ...state, reshuffled: false };

    // ── 3.5 Player Action Loop ─────────────────────────────────────────
    while (state.phase === 'playing') {
      renderGameScreen(state, calculateHandTotal, getAvailableActions);
      const key = await waitForKey();
      const k = key.toLowerCase();
      const actions = getAvailableActions(state);

      if (k === '\x03') cleanExit(0); // Ctrl+C
      if (k === 'q' && actions.quit) cleanExit(0);

      // Normal (non-split) actions
      if (k === 'h' && actions.hit) {
        state = playerHit(state);
      } else if (k === 's' && actions.stand) {
        state = playerStand(state);
      } else if (k === 'd' && actions.double) {
        state = playerDouble(state);
      } else if (k === 'p' && actions.split) {
        state = playerSplit(state);
      }
      // Split-mode actions (item 3.10)
      else if (k === 'h' && actions.splitHit) {
        state = splitHit(state);
      } else if (k === 's' && actions.splitStand) {
        state = splitStand(state);
      }
      // else: ignore unrecognized / unavailable keys
    }

    // Re-render after player phase ends (bust, auto-stand at 21, etc.)
    renderGameScreen(state, calculateHandTotal, getAvailableActions);

    // If player busted, phase is already 'result' — show result and continue
    if (state.phase === 'result') {
      await sleep(2500);
      state = checkGameOver(state);
      if (state.phase === 'gameOver') {
        renderGameOverScreen(state, getWinRate);
        while (true) {
          const key = await waitForKey();
          if (key.toLowerCase() === 'q') cleanExit(0);
          if (key === '\r' || key === '\n') {
            state = { ...state, chips: 1000, phase: 'betting' };
            break;
          }
        }
        continue;
      }
      // Not game over — prompt for next hand
      while (true) {
        const key = await waitForKey();
        if (key.toLowerCase() === 'q') cleanExit(0);
        if (key === '\r' || key === '\n') break;
      }
      continue;
    }

    // ── 3.6 Dealer Turn with Dramatic Pauses ───────────────────────────
    // Reveal hole card first (dealer's full hand visible)
    state = { ...state, phase: 'dealerTurn' };
    renderGameScreen(state, calculateHandTotal, getAvailableActions);
    await sleep(300);

    // Dealer draws until done
    while (!isDealerDone(state)) {
      state = dealerDrawOne(state);
      renderGameScreen(state, calculateHandTotal, getAvailableActions);
      await sleep(350);
    }

    // ── 3.7 Result Display & Pause ─────────────────────────────────────
    state = settleRound(state);
    renderGameScreen(state, calculateHandTotal, getAvailableActions);
    await sleep(2500);

    // Check game over
    state = checkGameOver(state);
    if (state.phase === 'gameOver') {
      renderGameOverScreen(state, getWinRate);
      while (true) {
        const key = await waitForKey();
        if (key.toLowerCase() === 'q') cleanExit(0);
        if (key === '\r' || key === '\n') {
          state = { ...state, chips: 1000, phase: 'betting' };
          break;
        }
      }
      continue;
    }

    // Not game over — prompt: press ENTER for next hand or Q to quit
    while (true) {
      const key = await waitForKey();
      if (key.toLowerCase() === 'q') cleanExit(0);
      if (key === '\r' || key === '\n') break;
    }
  }
}

main();
