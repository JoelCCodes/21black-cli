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

// ─── Header Bar (Item 2.6) ──────────────────────────────────────────

/**
 * Render the title header bar: ♠ BLACKJACK 21 ♠ centered within the frame.
 * Returns an array of frame lines: top border, title row, divider.
 */
const renderHeader = () => {
  const title = `♠ ${bold('BLACKJACK 21')} ♠`;
  return [
    frameTop(),
    frameCenter(title),
    frameDivider(),
  ];
};

// ─── Chip/Bet Status Bar (Item 2.7) ─────────────────────────────────

/**
 * Render the chip/bet status bar.
 * Chips displayed in yellow, Bet in white.
 * Layout: "Chips: $1,000          Bet: $50" spread across frame width.
 * Returns an array of frame lines: status row, divider.
 */
const renderStatusBar = (chips, bet) => {
  const chipsText = `Chips: ${yellow(formatChips(chips))}`;
  const betText = `Bet: ${formatChips(bet)}`;
  const chipsVisual = stripAnsi(chipsText).length;
  const betVisual = stripAnsi(betText).length;
  const available = FRAME_INNER - 2; // 1 space padding each side
  const gap = available - chipsVisual - betVisual;
  const content = chipsText + ' '.repeat(Math.max(1, gap)) + betText;
  return [
    frameLine(content),
    frameDivider(),
  ];
};

// ─── Dealer Area (Item 2.8) ─────────────────────────────────────────

/**
 * Render the dealer area: label + cards within frame lines.
 *
 * During player turn (phase === 'playing' or 'betting'):
 *   - Label: "DEALER (showing X)" where X = face-up card value
 *   - Cards: first card face-up, rest face-down
 *
 * After dealer plays (phase === 'dealerTurn', 'result', 'gameOver'):
 *   - Label: "DEALER (X)" with total, "DEALER (Soft X)" if soft
 *   - All cards face-up
 *
 * @param {object} state - game state with dealerHand and phase
 * @param {function} calculateHandTotal - from game.js
 * @returns {string[]} array of frame lines
 */
const renderDealerArea = (state, calculateHandTotal) => {
  const { dealerHand, phase } = state;
  const lines = [];

  // Determine if dealer hole card is hidden
  const hideHole = phase === 'playing' || phase === 'betting';

  // Build label
  let label;
  if (hideHole) {
    // Show only the face-up card's value
    const faceUpCard = dealerHand[0];
    const showing = faceUpCard ? faceUpCard.value : 0;
    label = `DEALER (showing ${showing})`;
  } else {
    // Show full hand total
    const { total, soft } = calculateHandTotal(dealerHand);
    label = soft ? `DEALER (Soft ${total})` : `DEALER (${total})`;
  }

  lines.push(frameEmpty());
  lines.push(frameLine(dim(label)));

  // Render cards
  if (dealerHand.length > 0) {
    const cardsToRender = dealerHand.map((card, i) => {
      if (hideHole && i >= 1) return null; // face-down
      return card;
    });
    const cardLines = renderHand(cardsToRender);
    for (const cl of cardLines) {
      lines.push(frameLine(cl));
    }
  }

  return lines;
};

// ─── Player Area (Item 2.9) ─────────────────────────────────────────

/**
 * Render the player area: label + cards within frame lines.
 *
 * Label formats:
 *   - "YOUR HAND (X)" for hard totals
 *   - "YOUR HAND (Soft X)" when hand is soft (ace counting as 11)
 *   - "BLACKJACK!" in bold magenta for natural 21 (2-card 21)
 *
 * @param {object} state - game state with playerHand
 * @param {function} calculateHandTotal - from game.js
 * @returns {string[]} array of frame lines
 */
const renderPlayerArea = (state, calculateHandTotal) => {
  const { playerHand } = state;
  const lines = [];

  // Build label
  const { total, soft } = calculateHandTotal(playerHand);
  let label;
  if (playerHand.length === 2 && total === 21) {
    label = bold(magenta('BLACKJACK!'));
  } else if (soft) {
    label = `YOUR HAND (Soft ${total})`;
  } else {
    label = `YOUR HAND (${total})`;
  }

  lines.push(frameEmpty());
  lines.push(frameLine(label));

  // Render cards
  if (playerHand.length > 0) {
    const cardLines = renderHand(playerHand);
    for (const cl of cardLines) {
      lines.push(frameLine(cl));
    }
  }

  return lines;
};

// ─── Action Prompt Bar (Item 2.10) ─────────────────────────────────

/**
 * Render the action prompt bar showing available actions.
 *
 * Normal play: [H]it  [S]tand  [D]ouble  [P]plit  [Q]uit
 *   - Unavailable actions are dimmed
 *   - [P]lit only shown when split is available
 *
 * Split play: Hand N: [H]it  [S]tand
 *   - Only hit and stand on the active hand
 *
 * @param {object} actions - return value from getAvailableActions(state)
 * @param {object} state - game state (for split hand index)
 * @returns {string[]} array of frame lines: divider + action row + bottom border
 */
const renderActionPrompt = (actions, state) => {
  const lines = [];
  lines.push(frameDivider());

  const isSplit = state && state.splitHands !== undefined;

  if (isSplit && (actions.splitHit || actions.splitStand)) {
    // Split mode: "Hand N: [H]it  [S]tand"
    const handNum = (state.activeHandIndex || 0) + 1;
    const parts = [];
    parts.push(bold(`Hand ${handNum}:`));
    parts.push(actions.splitHit ? bold('[H]') + 'it' : dim('[H]it'));
    parts.push(actions.splitStand ? bold('[S]') + 'tand' : dim('[S]tand'));
    parts.push(bold('[Q]') + 'uit');
    lines.push(frameLine(parts.join('  ')));
  } else {
    // Normal mode: [H]it  [S]tand  [D]ouble  [P]plit  [Q]uit
    const parts = [];
    parts.push(actions.hit ? bold('[H]') + 'it' : dim('[H]it'));
    parts.push(actions.stand ? bold('[S]') + 'tand' : dim('[S]tand'));
    parts.push(actions.double ? bold('[D]') + 'ouble' : dim('[D]ouble'));
    // Only show [P]lit when split is available
    if (actions.split) {
      parts.push(bold('[P]') + 'lit');
    }
    parts.push(actions.quit ? bold('[Q]') + 'uit' : dim('[Q]uit'));
    lines.push(frameLine(parts.join('  ')));
  }

  lines.push(frameBottom());
  return lines;
};

export {
  RESET, red, green, yellow, cyan, magenta, bold, dim, formatChips,
  stripAnsi, FRAME_INNER, FRAME_OUTER,
  frameLine, frameCenter, frameTop, frameBottom, frameDivider, frameEmpty, frameMargin,
  renderCard, renderHand, renderHeader, renderStatusBar, renderDealerArea, renderPlayerArea,
  renderActionPrompt,
};
