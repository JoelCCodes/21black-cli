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
