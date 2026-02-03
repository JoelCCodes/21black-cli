// src/game.js — All game logic. Pure functions, no I/O.

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/**
 * Creates a standard 52-card deck.
 * Each card: { suit, rank, value }
 * Face cards = 10, Ace = 11, number cards = face value.
 */
/**
 * Fisher-Yates shuffle. Returns a new shuffled array (does not mutate input).
 */
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createGameState() {
  return {
    deck: [],
    playerHand: [],
    dealerHand: [],
    chips: 1000,
    bet: 0,
    phase: 'welcome',
    splitHands: undefined,
    activeHandIndex: 0,
    result: null,
    reshuffled: false,
    stats: {
      handsPlayed: 0,
      handsWon: 0,
      handsLost: 0,
      handsPushed: 0,
      blackjacks: 0,
      peakChips: 1000,
    },
  };
}

export function calculateHandTotal(cards) {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += card.value;
    if (card.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return { total, soft: aces > 0 };
}

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      let value;
      if (rank === 'A') {
        value = 11;
      } else if (rank === 'J' || rank === 'Q' || rank === 'K') {
        value = 10;
      } else {
        value = parseInt(rank, 10);
      }
      deck.push({ suit, rank, value });
    }
  }
  return deck;
}

function isBlackjack(hand) {
  return hand.length === 2 && calculateHandTotal(hand).total === 21;
}

export function checkForBlackjack(state) {
  const playerBJ = isBlackjack(state.playerHand);
  const dealerBJ = isBlackjack(state.dealerHand);

  if (!playerBJ && !dealerBJ) {
    return state;
  }

  const stats = { ...state.stats, handsPlayed: state.stats.handsPlayed + 1 };

  if (playerBJ && dealerBJ) {
    // Mutual blackjack — push, bet returned
    stats.handsPushed++;
    return {
      ...state,
      phase: 'result',
      chips: state.chips + state.bet,
      stats: { ...stats, peakChips: Math.max(stats.peakChips, state.chips + state.bet) },
      result: { outcome: 'push', message: 'Both have Blackjack — Push!', chipChange: 0 },
    };
  }

  if (playerBJ) {
    // Player blackjack — pays 3:2
    const payout = Math.round(state.bet * 1.5);
    const newChips = state.chips + state.bet + payout;
    stats.handsWon++;
    stats.blackjacks++;
    return {
      ...state,
      phase: 'result',
      chips: newChips,
      stats: { ...stats, peakChips: Math.max(stats.peakChips, newChips) },
      result: { outcome: 'blackjack', message: 'BLACKJACK!', chipChange: payout },
    };
  }

  // Dealer blackjack — player loses
  stats.handsLost++;
  return {
    ...state,
    phase: 'result',
    stats,
    result: { outcome: 'lose', message: 'Dealer has Blackjack!', chipChange: -state.bet },
  };
}

export function playerHit(state) {
  const deck = [...state.deck];
  const card = deck.pop();
  const playerHand = [...state.playerHand, card];
  const { total } = calculateHandTotal(playerHand);

  if (total > 21) {
    // Bust
    return {
      ...state,
      deck,
      playerHand,
      phase: 'result',
      result: { outcome: 'bust', message: 'BUST!', chipChange: -state.bet },
      stats: {
        ...state.stats,
        handsPlayed: state.stats.handsPlayed + 1,
        handsLost: state.stats.handsLost + 1,
      },
    };
  }

  if (total === 21) {
    // Auto-stand at 21
    return {
      ...state,
      deck,
      playerHand,
      phase: 'dealerTurn',
    };
  }

  return {
    ...state,
    deck,
    playerHand,
  };
}

export function playerStand(state) {
  return {
    ...state,
    phase: 'dealerTurn',
  };
}

export function playerDouble(state) {
  const deck = [...state.deck];
  const card = deck.pop();
  const playerHand = [...state.playerHand, card];
  const newBet = state.bet * 2;
  const newChips = state.chips - state.bet; // deduct additional bet equal to original
  const { total } = calculateHandTotal(playerHand);

  if (total > 21) {
    return {
      ...state,
      deck,
      playerHand,
      bet: newBet,
      chips: newChips,
      phase: 'result',
      result: { outcome: 'bust', message: 'BUST!', chipChange: -newBet },
      stats: {
        ...state.stats,
        handsPlayed: state.stats.handsPlayed + 1,
        handsLost: state.stats.handsLost + 1,
      },
    };
  }

  return {
    ...state,
    deck,
    playerHand,
    bet: newBet,
    chips: newChips,
    phase: 'dealerTurn',
  };
}

export function isDealerDone(state) {
  const { total } = calculateHandTotal(state.dealerHand);
  return total >= 17;
}

export function dealerDrawOne(state) {
  const deck = [...state.deck];
  const card = deck.pop();
  const dealerHand = [...state.dealerHand, card];
  return {
    ...state,
    deck,
    dealerHand,
  };
}

export function getWinRate(stats) {
  if (stats.handsPlayed === 0) return '0.0';
  return (stats.handsWon / stats.handsPlayed * 100).toFixed(1);
}

function settleOneHand(playerTotal, playerBust, dealerTotal, bet) {
  if (playerBust) {
    return { outcome: 'lose', message: 'Bust!', chipChange: -bet };
  }
  if (dealerTotal > 21) {
    return { outcome: 'win', message: 'Dealer busts!', chipChange: bet };
  }
  if (playerTotal > dealerTotal) {
    return { outcome: 'win', message: 'You win!', chipChange: bet };
  }
  if (playerTotal < dealerTotal) {
    return { outcome: 'lose', message: 'Dealer wins.', chipChange: -bet };
  }
  return { outcome: 'push', message: 'Push!', chipChange: 0 };
}

export function settleRound(state) {
  if (state.splitHands !== undefined) {
    return settleSplitRound(state);
  }

  const playerTotal = calculateHandTotal(state.playerHand).total;
  const dealerTotal = calculateHandTotal(state.dealerHand).total;

  const stats = { ...state.stats, handsPlayed: state.stats.handsPlayed + 1 };
  let outcome, message, chipChange, newChips;

  if (dealerTotal > 21) {
    outcome = 'win';
    message = 'Dealer busts!';
    chipChange = state.bet;
    newChips = state.chips + state.bet + state.bet;
    stats.handsWon++;
  } else if (playerTotal > dealerTotal) {
    outcome = 'win';
    message = 'You win!';
    chipChange = state.bet;
    newChips = state.chips + state.bet + state.bet;
    stats.handsWon++;
  } else if (playerTotal < dealerTotal) {
    outcome = 'lose';
    message = 'Dealer wins.';
    chipChange = -state.bet;
    newChips = state.chips;
    stats.handsLost++;
  } else {
    outcome = 'push';
    message = 'Push!';
    chipChange = 0;
    newChips = state.chips + state.bet;
    stats.handsPushed++;
  }

  stats.peakChips = Math.max(stats.peakChips, newChips);

  return {
    ...state,
    phase: 'result',
    chips: newChips,
    stats,
    result: { outcome, message, chipChange },
  };
}

function settleSplitRound(state) {
  const dealerTotal = calculateHandTotal(state.dealerHand).total;
  const stats = { ...state.stats };
  let newChips = state.chips;
  let totalChipChange = 0;

  const settledHands = state.splitHands.map(hand => {
    const playerTotal = calculateHandTotal(hand.cards).total;
    const playerBust = hand.status === 'bust';
    const result = settleOneHand(playerTotal, playerBust, dealerTotal, hand.bet);

    stats.handsPlayed++;
    if (result.outcome === 'win') {
      stats.handsWon++;
      newChips += hand.bet + hand.bet; // return bet + winnings
    } else if (result.outcome === 'lose') {
      stats.handsLost++;
      // bet already deducted, no change for bust/loss
    } else {
      stats.handsPushed++;
      newChips += hand.bet; // return bet on push
    }
    totalChipChange += result.chipChange;

    return { ...hand, result };
  });

  stats.peakChips = Math.max(stats.peakChips, newChips);

  return {
    ...state,
    phase: 'result',
    chips: newChips,
    splitHands: settledHands,
    stats,
    result: { outcome: 'split', message: 'Split results', chipChange: totalChipChange },
  };
}

export function placeBet(state, amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    return { valid: false, error: 'Bet must be a whole number greater than zero.' };
  }
  if (amount < 10) {
    return { valid: false, error: 'Minimum bet is $10.' };
  }
  if (amount > 500) {
    return { valid: false, error: 'Maximum bet is $500.' };
  }
  if (amount > state.chips) {
    return { valid: false, error: `You only have $${state.chips}. Bet must be within your chip count.` };
  }
  return {
    valid: true,
    state: {
      ...state,
      bet: amount,
      chips: state.chips - amount,
      phase: 'playing',
    },
  };
}

export function checkGameOver(state) {
  if (state.chips < 10) {
    return { ...state, phase: 'gameOver' };
  }
  return state;
}

export function playerSplit(state) {
  const deck = [...state.deck];
  const originalBet = state.bet;
  const newChips = state.chips - originalBet; // deduct additional bet

  // Deal one card to each split hand
  const card1 = deck.pop();
  const card2 = deck.pop();

  const hand1Cards = [state.playerHand[0], card1];
  const hand2Cards = [state.playerHand[1], card2];

  // Check if splitting aces — auto-stand both hands
  const isAceSplit = state.playerHand[0].rank === 'A';

  const hand1Status = isAceSplit ? 'stand' : 'playing';
  const hand2Status = isAceSplit ? 'stand' : 'playing';

  const splitHands = [
    { cards: hand1Cards, bet: originalBet, status: hand1Status },
    { cards: hand2Cards, bet: originalBet, status: hand2Status },
  ];

  // If aces split, both hands are done — advance to dealer turn
  const phase = isAceSplit ? 'dealerTurn' : 'playing';

  return {
    ...state,
    deck,
    chips: newChips,
    splitHands,
    activeHandIndex: 0,
    phase,
  };
}

export function splitHit(state) {
  const deck = [...state.deck];
  const card = deck.pop();
  const handIndex = state.activeHandIndex;
  const hand = state.splitHands[handIndex];
  const newCards = [...hand.cards, card];
  const { total } = calculateHandTotal(newCards);

  let newStatus = 'playing';
  if (total > 21) {
    newStatus = 'bust';
  } else if (total === 21) {
    newStatus = 'stand';
  }

  const newHand = { ...hand, cards: newCards, status: newStatus };
  const newSplitHands = state.splitHands.map((h, i) => i === handIndex ? newHand : h);

  // If this hand is done, check if we advance to next hand or dealer turn
  if (newStatus !== 'playing') {
    return advanceSplitHand({ ...state, deck, splitHands: newSplitHands });
  }

  return { ...state, deck, splitHands: newSplitHands };
}

export function splitStand(state) {
  const handIndex = state.activeHandIndex;
  const hand = state.splitHands[handIndex];
  const newHand = { ...hand, status: 'stand' };
  const newSplitHands = state.splitHands.map((h, i) => i === handIndex ? newHand : h);

  return advanceSplitHand({ ...state, splitHands: newSplitHands });
}

function advanceSplitHand(state) {
  const allDone = state.splitHands.every(h => h.status !== 'playing');

  if (allDone) {
    return { ...state, phase: 'dealerTurn' };
  }

  // Move to next hand that is still playing
  const nextIndex = state.splitHands.findIndex((h, i) => i > state.activeHandIndex && h.status === 'playing');
  if (nextIndex !== -1) {
    return { ...state, activeHandIndex: nextIndex };
  }

  // All hands done (shouldn't reach here due to allDone check above, but safety)
  return { ...state, phase: 'dealerTurn' };
}

export function getAvailableActions(state) {
  const playing = state.phase === 'playing';
  const handCards = state.playerHand;
  const { total } = playing ? calculateHandTotal(handCards) : { total: 0 };
  const isSplit = state.splitHands !== undefined;

  // During split, only splitHit and splitStand are available on the active hand
  if (isSplit && playing) {
    const activeHand = state.splitHands[state.activeHandIndex];
    const activeTotal = calculateHandTotal(activeHand.cards).total;
    return {
      hit: false,
      stand: false,
      double: false,
      split: false,
      splitHit: activeTotal < 21 && activeHand.status === 'playing',
      splitStand: activeHand.status === 'playing',
      quit: true,
    };
  }

  return {
    hit: playing && total < 21,
    stand: playing,
    double: playing && handCards.length === 2 && state.chips >= state.bet,
    split: playing && handCards.length === 2 && handCards[0].rank === handCards[1].rank && state.chips >= state.bet,
    splitHit: false,
    splitStand: false,
    quit: true,
  };
}

export function dealInitialCards(state) {
  let deck = [...state.deck];
  let reshuffled = state.reshuffled;

  if (deck.length < 15) {
    deck = shuffleDeck(createDeck());
    reshuffled = true;
  }

  const playerHand = [deck.pop(), deck.pop()];
  const dealerHand = [deck.pop(), deck.pop()];

  return {
    ...state,
    deck,
    playerHand,
    dealerHand,
    reshuffled,
    phase: 'playing',
  };
}
