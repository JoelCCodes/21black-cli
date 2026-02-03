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
