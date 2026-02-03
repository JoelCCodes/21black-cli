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
