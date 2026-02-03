// Terminal renderer — all rendering via process.stdout.write(), no console.log.
// ANSI color utilities and screen rendering functions.

// ─── ANSI Color Utilities (Item 2.1) ────────────────────────────────

const RESET = '\x1b[0m';

const red = (s) => `\x1b[91m${s}${RESET}`;
const green = (s) => `\x1b[92m${s}${RESET}`;
const yellow = (s) => `\x1b[93m${s}${RESET}`;
const cyan = (s) => `\x1b[96m${s}${RESET}`;
const magenta = (s) => `\x1b[95m${s}${RESET}`;
const bold = (s) => `\x1b[1m${s}${RESET}`;
const dim = (s) => `\x1b[2m${s}${RESET}`;

// ─── Number Formatting (Item 2.2) ───────────────────────────────────

/**
 * Format a chip amount as a dollar string with commas.
 * formatChips(1000) → "$1,000"
 * formatChips(-50) → "-$50"
 * formatChips(0) → "$0"
 */
const formatChips = (n) => {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('en-US');
  return n < 0 ? `-$${formatted}` : `$${formatted}`;
};

export { RESET, red, green, yellow, cyan, magenta, bold, dim, formatChips };
