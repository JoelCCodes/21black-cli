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

// ─── Screen Frame (Item 2.5) ───────────────────────────────────────

const FRAME_INNER = 42;  // inner content width between ║ characters
const FRAME_OUTER = 44;  // total frame width: ║ + 42 + ║

/**
 * Strip ANSI escape codes from a string to get its visual/printed width.
 */
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

/**
 * Pad/truncate content to fit within ║...║ frame line.
 * Content is left-aligned with 1 space padding on each side.
 * frameLine("Hello") → "║ Hello                                    ║"
 */
const frameLine = (content = '') => {
  const visual = stripAnsi(content);
  const available = FRAME_INNER - 2; // 2 spaces for left+right padding
  const visLen = visual.length;
  if (visLen > available) {
    // Truncate: walk the original string counting visible chars
    let count = 0;
    let i = 0;
    while (i < content.length && count < available) {
      if (content[i] === '\x1b') {
        const end = content.indexOf('m', i);
        if (end !== -1) { i = end + 1; continue; }
      }
      count++;
      i++;
    }
    // Include any trailing ANSI reset
    const remaining = content.slice(i);
    const resetMatch = remaining.match(/^(\x1b\[[0-9;]*m)*/);
    const trailingReset = resetMatch ? resetMatch[0] : '';
    return dim('║') + ' ' + content.slice(0, i) + trailingReset + ' ' + dim('║');
  }
  const pad = available - visLen;
  return dim('║') + ' ' + content + ' '.repeat(pad) + ' ' + dim('║');
};

/**
 * Center a line of text within the frame (FRAME_INNER - 2 usable chars).
 * frameCenter("HELLO") → "║              HELLO                       ║"
 */
const frameCenter = (content = '') => {
  const visual = stripAnsi(content);
  const available = FRAME_INNER - 2;
  const visLen = visual.length;
  if (visLen >= available) return frameLine(content);
  const leftPad = Math.floor((available - visLen) / 2);
  const rightPad = available - visLen - leftPad;
  return dim('║') + ' ' + ' '.repeat(leftPad) + content + ' '.repeat(rightPad) + ' ' + dim('║');
};

/** Top border: ╔══════...══════╗ */
const frameTop = () => dim('╔' + '═'.repeat(FRAME_INNER) + '╗');

/** Bottom border: ╚══════...══════╝ */
const frameBottom = () => dim('╚' + '═'.repeat(FRAME_INNER) + '╝');

/** Horizontal divider: ╠══════...══════╣ */
const frameDivider = () => dim('╠' + '═'.repeat(FRAME_INNER) + '╣');

/** Empty line within frame: ║                                          ║ */
const frameEmpty = () => dim('║') + ' '.repeat(FRAME_INNER) + dim('║');

/**
 * Center the entire frame within the terminal width.
 * Returns a padding string to prepend to each frame line.
 */
const frameMargin = () => {
  const cols = process.stdout.columns || 80;
  const margin = Math.max(0, Math.floor((cols - FRAME_OUTER) / 2));
  return ' '.repeat(margin);
};

// ─── Card ASCII Art Rendering (Item 2.3) ─────────────────────────────

const isRedSuit = (suit) => suit === '♥' || suit === '♦';
const colorSuit = (suit) => isRedSuit(suit) ? red(suit) : suit;

/**
 * Render a single card as an array of 5 strings (one per line).
 * If faceDown is true, renders the back of a card with ░ fill.
 * Suit colors: ♥♦ in red, ♠♣ in white/default.
 * Borders are dimmed.
 */
const renderCard = (card, faceDown = false) => {
  const border = dim;
  if (faceDown) {
    return [
      border('┌─────┐'),
      border('│') + '░░░░░' + border('│'),
      border('│') + '░░░░░' + border('│'),
      border('│') + '░░░░░' + border('│'),
      border('└─────┘'),
    ];
  }

  const r = card.rank;
  const s = colorSuit(card.suit);
  const is10 = r === '10';

  // Top rank line: rank left-aligned in 5-char inner area
  // "│ A   │" or "│10   │"
  const topRank = is10 ? `${r}   ` : ` ${r}   `;

  // Middle suit line: suit centered in 5-char inner area
  // "│  ♠  │"
  const midSuit = `  ${s}  `;

  // Bottom rank line: rank right-aligned in 5-char inner area
  // "│   A │" or "│  10 │"
  const botRank = is10 ? `  ${r} ` : `   ${r} `;

  return [
    border('┌─────┐'),
    border('│') + topRank + border('│'),
    border('│') + midSuit + border('│'),
    border('│') + botRank + border('│'),
    border('└─────┘'),
  ];
};

/**
 * Render multiple cards side-by-side as an array of 5 strings.
 * Each card separated by 1 space.
 * options.dimmed: render entire output dimmed (for inactive split hand).
 */
const renderHand = (cards, options = {}) => {
  if (!cards || cards.length === 0) return ['', '', '', '', ''];
  const cardLines = cards.map((c) =>
    c === null ? renderCard(null, true) : renderCard(c)
  );
  const lines = [];
  for (let row = 0; row < 5; row++) {
    const line = cardLines.map((cl) => cl[row]).join(' ');
    lines.push(options.dimmed ? dim(line) : line);
  }
  return lines;
};

export {
  RESET, red, green, yellow, cyan, magenta, bold, dim, formatChips,
  stripAnsi, FRAME_INNER, FRAME_OUTER,
  frameLine, frameCenter, frameTop, frameBottom, frameDivider, frameEmpty, frameMargin,
  renderCard, renderHand,
};
