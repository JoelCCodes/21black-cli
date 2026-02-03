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

// ─── Full Screen Render (Item 2.11) ──────────────────────────────────

/**
 * Render the full game screen: clear terminal, compose all sections, write once.
 *
 * Composes: header → status bar → dealer area → player area → action prompt.
 * Shows reshuffle notification ("♻ Deck reshuffled") above dealer area if
 * state.reshuffled is true.
 *
 * @param {object} state - full game state
 * @param {function} calculateHandTotal - from game.js
 * @param {function} getAvailableActions - from game.js
 */
const renderGameScreen = (state, calculateHandTotal, getAvailableActions) => {
  const margin = frameMargin();
  const lines = [];

  // Header
  lines.push(...renderHeader());

  // Status bar
  lines.push(...renderStatusBar(state.chips, state.bet));

  // Reshuffle notification (dim, above dealer area)
  if (state.reshuffled) {
    lines.push(frameLine(dim('♻ Deck reshuffled')));
  }

  // Dealer area
  lines.push(...renderDealerArea(state, calculateHandTotal));

  // Player area (normal or split)
  if (state.splitHands !== undefined) {
    lines.push(...renderSplitPlayerArea(state, calculateHandTotal));
  } else {
    lines.push(...renderPlayerArea(state, calculateHandTotal));
  }

  lines.push(frameEmpty());

  // Action prompt bar (only during playing phase) or result display
  if (state.phase === 'playing') {
    const actions = getAvailableActions(state);
    lines.push(...renderActionPrompt(actions, state));
  } else if (state.phase === 'result' && state.result) {
    lines.push(...renderResultDisplay(state.result));
    lines.push(frameBottom());
  } else {
    lines.push(frameBottom());
  }

  // Clear screen + cursor home, write all lines at once
  const output = '\x1b[2J\x1b[H' + lines.map((l) => margin + l).join('\n') + '\n';
  process.stdout.write(output);
};

// ─── Welcome Screen (Item 2.12) ──────────────────────────────────────

/**
 * Render the welcome screen: clear terminal, show framed title + prompt.
 * ♠ ♥ BLACKJACK 21 ♣ ♦ centered, "Press ENTER to play" below.
 * Writes directly to process.stdout.
 */
const renderWelcomeScreen = () => {
  const margin = frameMargin();
  const title = `♠ ${red('♥')} ${bold('BLACKJACK 21')} ♣ ${red('♦')}`;
  const prompt = 'Press ENTER to play';
  const lines = [
    frameTop(),
    frameEmpty(),
    frameCenter(title),
    frameEmpty(),
    frameCenter(prompt),
    frameEmpty(),
    frameBottom(),
  ];
  const output = '\x1b[2J\x1b[H' + lines.map((l) => margin + l).join('\n') + '\n';
  process.stdout.write(output);
};

// ─── Betting Prompt Screen (Item 2.13) ────────────────────────────────

/**
 * Render the betting screen: chip count, bet input prompt, quit option.
 * Clears terminal and redraws. Writes directly to process.stdout.
 *
 * @param {number} chips - current chip count
 * @param {string} [error] - optional error message to display (e.g., invalid bet)
 */
const renderBettingScreen = (chips, error) => {
  const margin = frameMargin();
  const title = `♠ ${bold('BLACKJACK 21')} ♠`;
  const chipsLine = `Chips: ${yellow(formatChips(chips))}`;
  const promptLine = 'Place your bet ($10-$500):';
  const quitLine = dim('[Q]uit');

  const lines = [
    frameTop(),
    frameCenter(title),
    frameDivider(),
    frameEmpty(),
    frameCenter(chipsLine),
    frameEmpty(),
    frameCenter(promptLine),
    frameEmpty(),
  ];

  if (error) {
    lines.push(frameCenter(red(error)));
    lines.push(frameEmpty());
  }

  lines.push(frameCenter(quitLine));
  lines.push(frameEmpty());
  lines.push(frameBottom());

  const output = '\x1b[2J\x1b[H' + lines.map((l) => margin + l).join('\n') + '\n';
  process.stdout.write(output);
};

// ─── Result Display (Item 2.14) ──────────────────────────────────────

/**
 * Render the result display: large color-coded win/loss/push/blackjack message
 * with chip change amount.
 *
 * Color coding:
 *   - win: green
 *   - lose/bust: red
 *   - push: yellow
 *   - blackjack: bold magenta
 *
 * Shows chip change: "+$150" in green or "-$50" in red.
 *
 * @param {object} result - { outcome, message, chipChange }
 * @returns {string[]} array of frame lines
 */
const renderResultDisplay = (result) => {
  if (!result) return [];
  const lines = [];

  lines.push(frameDivider());
  lines.push(frameEmpty());

  // Main result message — large and color-coded
  let resultMsg;
  switch (result.outcome) {
    case 'blackjack':
      resultMsg = bold(magenta(result.message));
      break;
    case 'win':
      resultMsg = bold(green(result.message));
      break;
    case 'lose':
    case 'bust':
      resultMsg = bold(red(result.message));
      break;
    case 'push':
      resultMsg = bold(yellow(result.message));
      break;
    case 'split':
      resultMsg = bold(cyan(result.message));
      break;
    default:
      resultMsg = bold(result.message);
  }
  lines.push(frameCenter(resultMsg));

  // Chip change line
  let chipText;
  if (result.chipChange > 0) {
    chipText = green(`+${formatChips(result.chipChange)}`);
  } else if (result.chipChange < 0) {
    chipText = red(formatChips(result.chipChange));
  } else {
    chipText = yellow(formatChips(0));
  }
  lines.push(frameCenter(chipText));

  lines.push(frameEmpty());

  // Continue prompt
  lines.push(frameCenter(dim('Press ENTER for next hand')));
  lines.push(frameCenter(dim('Press Q to quit')));

  lines.push(frameEmpty());

  return lines;
};

// ─── Game Over Screen (Item 2.15) ────────────────────────────────────

/**
 * Render the game over screen: final chips, hands played, win rate,
 * and play again / quit prompt. All within box frame.
 *
 * Clears terminal and redraws. Writes directly to process.stdout.
 *
 * @param {object} state - game state with chips and stats
 * @param {function} getWinRate - from game.js, returns win rate string
 */
const renderGameOverScreen = (state, getWinRate) => {
  const margin = frameMargin();
  const { chips, stats } = state;

  const titleLine = bold(red('GAME OVER'));
  const chipsLine = `You finished with ${yellow(formatChips(chips))}`;
  const handsLine = `Hands played: ${stats.handsPlayed}`;
  const winRateLine = `Win rate: ${getWinRate(stats)}%`;
  const playAgain = 'Press ENTER to play again';
  const quitLine = 'Press Q to quit';

  const lines = [
    frameTop(),
    frameEmpty(),
    frameCenter(titleLine),
    frameEmpty(),
    frameCenter(chipsLine),
    frameCenter(handsLine),
    frameCenter(winRateLine),
    frameEmpty(),
    frameCenter(playAgain),
    frameCenter(dim(quitLine)),
    frameEmpty(),
    frameBottom(),
  ];

  const output = '\x1b[2J\x1b[H' + lines.map((l) => margin + l).join('\n') + '\n';
  process.stdout.write(output);
};

// ─── Split Player Area (Item 2.16) ───────────────────────────────────

/**
 * Render split player hands within the frame.
 * Active hand is bold, inactive hand is dimmed.
 * Labels: "HAND 1 (X) *active*" / "HAND 2 (X) - Stand/Bust/21"
 *
 * Primary: side-by-side layout (hands rendered next to each other).
 * Fallback: vertical stacking (when hands are too wide to fit side-by-side).
 *
 * Side-by-side fits when: hand1Width + MIN_GAP + hand2Width <= usable width (40).
 * Each hand's card width = numCards * 7 + (numCards - 1) for spacing.
 *
 * @param {object} state - game state with splitHands
 * @param {function} calculateHandTotal - from game.js
 * @returns {string[]} array of frame lines
 */
const renderSplitPlayerArea = (state, calculateHandTotal) => {
  const { splitHands, activeHandIndex } = state;
  const USABLE = FRAME_INNER - 2; // 40 chars of content inside ║ ... ║
  const MIN_GAP = 2;

  // ── Build per-hand metadata ──────────────────────────────────────

  const handData = splitHands.map((hand, i) => {
    const { total, soft } = calculateHandTotal(hand.cards);
    const isActive = hand.status === 'playing' && i === activeHandIndex;
    const isDimmed = !isActive && hand.status !== 'playing';

    const totalStr = soft ? `Soft ${total}` : `${total}`;
    let label;
    if (isActive) {
      label = bold(`HAND ${i + 1} (${totalStr}) *active*`);
    } else {
      const statusLabel = hand.status === 'stand' ? 'Stand'
        : hand.status === 'bust' ? 'Bust'
        : hand.status === 'blackjack' ? '21'
        : hand.status;
      label = `HAND ${i + 1} (${totalStr}) - ${statusLabel}`;
      if (isDimmed) label = dim(label);
    }

    const betStr = `Bet: ${formatChips(hand.bet)}`;
    const styledBet = isDimmed ? dim(betStr) : betStr;

    const numCards = hand.cards.length;
    const cardWidth = numCards > 0 ? numCards * 7 + (numCards - 1) : 0;
    const cardLines = renderHand(hand.cards, { dimmed: isDimmed });

    let resultText = null;
    if (hand.result) {
      const r = hand.result;
      if (r.outcome === 'win' || r.outcome === 'blackjack') {
        resultText = green(`${r.outcome === 'blackjack' ? 'BLACKJACK' : 'WIN'} +${formatChips(r.chipChange)}`);
      } else if (r.outcome === 'lose' || r.outcome === 'bust') {
        resultText = red(`${r.outcome === 'bust' ? 'BUST' : 'LOSE'} ${formatChips(r.chipChange)}`);
      } else {
        resultText = yellow(`PUSH ${formatChips(0)}`);
      }
    }

    return { label, styledBet, cardWidth, cardLines, resultText, isDimmed };
  });

  // ── Determine layout mode ────────────────────────────────────────

  const h1 = handData[0];
  const h2 = handData[1];
  const sideBySideFits = h2 !== undefined &&
    (h1.cardWidth + MIN_GAP + h2.cardWidth <= USABLE);

  // ── Side-by-side rendering ───────────────────────────────────────

  if (sideBySideFits) {
    const lines = [];
    const gap = USABLE - h1.cardWidth - h2.cardWidth;

    const padTo = (str, width) => {
      const vis = stripAnsi(str).length;
      return vis >= width ? str : str + ' '.repeat(width - vis);
    };

    lines.push(frameEmpty());
    lines.push(frameLine(padTo(h1.label, h1.cardWidth + gap) + h2.label));
    lines.push(frameLine(padTo(h1.styledBet, h1.cardWidth + gap) + h2.styledBet));

    for (let row = 0; row < 5; row++) {
      const left = h1.cardLines[row] || '';
      const leftVis = stripAnsi(left).length;
      const padding = (h1.cardWidth + gap) - leftVis;
      const right = h2.cardLines[row] || '';
      lines.push(frameLine(left + ' '.repeat(Math.max(0, padding)) + right));
    }

    if (h1.resultText || h2.resultText) {
      const r1 = h1.resultText || '';
      const r2 = h2.resultText || '';
      lines.push(frameLine(padTo(r1, h1.cardWidth + gap) + r2));
    }

    return lines;
  }

  // ── Vertical stacking fallback ───────────────────────────────────

  const lines = [];
  for (const h of handData) {
    lines.push(frameEmpty());
    lines.push(frameLine(h.label + '  ' + h.styledBet));
    for (const cl of h.cardLines) {
      lines.push(frameLine(cl));
    }
    if (h.resultText) {
      lines.push(frameLine(h.resultText));
    }
  }
  return lines;
};

export {
  RESET, red, green, yellow, cyan, magenta, bold, dim, formatChips,
  stripAnsi, FRAME_INNER, FRAME_OUTER,
  frameLine, frameCenter, frameTop, frameBottom, frameDivider, frameEmpty, frameMargin,
  renderCard, renderHand, renderHeader, renderStatusBar, renderDealerArea, renderPlayerArea,
  renderActionPrompt, renderResultDisplay, renderGameScreen, renderGameOverScreen,
  renderSplitPlayerArea, renderWelcomeScreen, renderBettingScreen,
};
