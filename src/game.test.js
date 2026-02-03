// src/game.test.js — Unit tests for game logic

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createDeck, shuffleDeck, createGameState, calculateHandTotal } from './game.js';

// 4.1 — Deck tests
describe('createDeck', () => {
  it('returns exactly 52 cards', () => {
    const deck = createDeck();
    assert.equal(deck.length, 52);
  });

  it('has correct card object shape { suit, rank, value }', () => {
    const deck = createDeck();
    for (const card of deck) {
      assert.ok('suit' in card, 'card must have suit');
      assert.ok('rank' in card, 'card must have rank');
      assert.ok('value' in card, 'card must have value');
      assert.equal(Object.keys(card).length, 3, 'card must have exactly 3 properties');
    }
  });

  it('contains all 4 suits', () => {
    const deck = createDeck();
    const suits = new Set(deck.map(c => c.suit));
    assert.deepEqual(suits, new Set(['♠', '♥', '♦', '♣']));
  });

  it('contains all 13 ranks', () => {
    const deck = createDeck();
    const ranks = new Set(deck.map(c => c.rank));
    assert.deepEqual(ranks, new Set(['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']));
  });

  it('has no duplicate cards', () => {
    const deck = createDeck();
    const keys = deck.map(c => `${c.suit}${c.rank}`);
    const unique = new Set(keys);
    assert.equal(unique.size, 52);
  });

  it('assigns correct values to number cards', () => {
    const deck = createDeck();
    for (const card of deck) {
      if (!['J', 'Q', 'K', 'A'].includes(card.rank)) {
        assert.equal(card.value, parseInt(card.rank, 10));
      }
    }
  });

  it('assigns value 10 to face cards (J, Q, K)', () => {
    const deck = createDeck();
    for (const card of deck) {
      if (['J', 'Q', 'K'].includes(card.rank)) {
        assert.equal(card.value, 10);
      }
    }
  });

  it('assigns value 11 to Aces', () => {
    const deck = createDeck();
    for (const card of deck) {
      if (card.rank === 'A') {
        assert.equal(card.value, 11);
      }
    }
  });

  it('has 13 cards per suit', () => {
    const deck = createDeck();
    for (const suit of ['♠', '♥', '♦', '♣']) {
      const count = deck.filter(c => c.suit === suit).length;
      assert.equal(count, 13);
    }
  });

  it('has 4 cards per rank', () => {
    const deck = createDeck();
    for (const rank of ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']) {
      const count = deck.filter(c => c.rank === rank).length;
      assert.equal(count, 4);
    }
  });
});

// createGameState tests (item 1.3)
describe('createGameState', () => {
  it('returns an object with all required fields', () => {
    const state = createGameState();
    assert.ok(Array.isArray(state.deck));
    assert.ok(Array.isArray(state.playerHand));
    assert.ok(Array.isArray(state.dealerHand));
    assert.equal(typeof state.chips, 'number');
    assert.equal(typeof state.bet, 'number');
    assert.equal(typeof state.phase, 'string');
    assert.equal(typeof state.activeHandIndex, 'number');
    assert.equal(typeof state.reshuffled, 'boolean');
    assert.equal(typeof state.stats, 'object');
  });

  it('starts with 1000 chips', () => {
    const state = createGameState();
    assert.equal(state.chips, 1000);
  });

  it('starts with zero bet', () => {
    const state = createGameState();
    assert.equal(state.bet, 0);
  });

  it('starts in welcome phase', () => {
    const state = createGameState();
    assert.equal(state.phase, 'welcome');
  });

  it('starts with empty hands and deck', () => {
    const state = createGameState();
    assert.equal(state.deck.length, 0);
    assert.equal(state.playerHand.length, 0);
    assert.equal(state.dealerHand.length, 0);
  });

  it('starts with splitHands undefined', () => {
    const state = createGameState();
    assert.equal(state.splitHands, undefined);
  });

  it('starts with activeHandIndex 0', () => {
    const state = createGameState();
    assert.equal(state.activeHandIndex, 0);
  });

  it('starts with result null', () => {
    const state = createGameState();
    assert.equal(state.result, null);
  });

  it('starts with reshuffled false', () => {
    const state = createGameState();
    assert.equal(state.reshuffled, false);
  });

  it('has correct initial stats', () => {
    const state = createGameState();
    assert.deepEqual(state.stats, {
      handsPlayed: 0,
      handsWon: 0,
      handsLost: 0,
      handsPushed: 0,
      blackjacks: 0,
      peakChips: 1000,
    });
  });

  it('returns a fresh object each call (no shared references)', () => {
    const a = createGameState();
    const b = createGameState();
    assert.notEqual(a, b);
    assert.notEqual(a.deck, b.deck);
    assert.notEqual(a.playerHand, b.playerHand);
    assert.notEqual(a.dealerHand, b.dealerHand);
    assert.notEqual(a.stats, b.stats);
  });
});

// 4.2 — Shuffle tests
describe('shuffleDeck', () => {
  it('returns an array of 52 cards', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    assert.equal(shuffled.length, 52);
  });

  it('does not mutate the original deck', () => {
    const deck = createDeck();
    const original = deck.map(c => `${c.suit}${c.rank}`);
    shuffleDeck(deck);
    const after = deck.map(c => `${c.suit}${c.rank}`);
    assert.deepEqual(original, after);
  });

  it('preserves all 52 cards (no cards lost or duplicated)', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    const originalKeys = deck.map(c => `${c.suit}${c.rank}`).sort();
    const shuffledKeys = shuffled.map(c => `${c.suit}${c.rank}`).sort();
    assert.deepEqual(originalKeys, shuffledKeys);
  });

  it('produces a different order from the original', () => {
    const deck = createDeck();
    // Run 5 shuffles — at least one must differ from original order.
    // Probability of all 5 matching original is astronomically small.
    let allSame = true;
    for (let i = 0; i < 5; i++) {
      const shuffled = shuffleDeck(deck);
      const originalKeys = deck.map(c => `${c.suit}${c.rank}`).join(',');
      const shuffledKeys = shuffled.map(c => `${c.suit}${c.rank}`).join(',');
      if (originalKeys !== shuffledKeys) {
        allSame = false;
        break;
      }
    }
    assert.equal(allSame, false, 'shuffle should produce a different order');
  });

  it('produces different results on successive calls', () => {
    const deck = createDeck();
    const results = new Set();
    for (let i = 0; i < 10; i++) {
      const shuffled = shuffleDeck(deck);
      results.add(shuffled.map(c => `${c.suit}${c.rank}`).join(','));
    }
    assert.ok(results.size > 1, 'multiple shuffles should produce different orderings');
  });
});

// 4.3 — Hand evaluation tests
describe('calculateHandTotal', () => {
  const card = (rank, suit = '♠') => {
    let value;
    if (rank === 'A') value = 11;
    else if (['J', 'Q', 'K'].includes(rank)) value = 10;
    else value = parseInt(rank, 10);
    return { suit, rank, value };
  };

  it('calculates basic totals (7 + 5 = 12)', () => {
    const result = calculateHandTotal([card('7'), card('5')]);
    assert.equal(result.total, 12);
    assert.equal(result.soft, false);
  });

  it('calculates face card totals (K + Q = 20)', () => {
    const result = calculateHandTotal([card('K'), card('Q')]);
    assert.equal(result.total, 20);
    assert.equal(result.soft, false);
  });

  it('calculates soft hand (A + 6 = soft 17)', () => {
    const result = calculateHandTotal([card('A'), card('6')]);
    assert.equal(result.total, 17);
    assert.equal(result.soft, true);
  });

  it('demotes ace when total exceeds 21 (A + 6 + 8 = 15)', () => {
    const result = calculateHandTotal([card('A'), card('6'), card('8')]);
    assert.equal(result.total, 15);
    assert.equal(result.soft, false);
  });

  it('handles multiple aces (A + A = soft 12)', () => {
    const result = calculateHandTotal([card('A'), card('A')]);
    assert.equal(result.total, 12);
    assert.equal(result.soft, true);
  });

  it('handles three aces (A + A + A = soft 13)', () => {
    const result = calculateHandTotal([card('A'), card('A'), card('A')]);
    assert.equal(result.total, 13);
    assert.equal(result.soft, true);
  });

  it('detects blackjack (A + K = 21 with 2 cards)', () => {
    const result = calculateHandTotal([card('A'), card('K')]);
    assert.equal(result.total, 21);
    assert.equal(result.soft, true);
  });

  it('detects blackjack with 10 (A + 10 = 21)', () => {
    const result = calculateHandTotal([card('A'), card('10')]);
    assert.equal(result.total, 21);
    assert.equal(result.soft, true);
  });

  it('handles bust (K + Q + 5 = 25)', () => {
    const result = calculateHandTotal([card('K'), card('Q'), card('5')]);
    assert.equal(result.total, 25);
    assert.equal(result.soft, false);
  });

  it('demotes multiple aces when needed (A + A + 9 + K = 21)', () => {
    const result = calculateHandTotal([card('A'), card('A'), card('9'), card('K')]);
    assert.equal(result.total, 21);
    assert.equal(result.soft, false);
  });

  it('handles empty hand', () => {
    const result = calculateHandTotal([]);
    assert.equal(result.total, 0);
    assert.equal(result.soft, false);
  });

  it('handles single card', () => {
    const result = calculateHandTotal([card('7')]);
    assert.equal(result.total, 7);
    assert.equal(result.soft, false);
  });

  it('handles single ace (soft 11)', () => {
    const result = calculateHandTotal([card('A')]);
    assert.equal(result.total, 11);
    assert.equal(result.soft, true);
  });

  it('handles four aces (A + A + A + A = 14)', () => {
    const result = calculateHandTotal([card('A'), card('A'), card('A'), card('A')]);
    assert.equal(result.total, 14);
    assert.equal(result.soft, true);
  });

  it('hard 21 is not soft (7 + 7 + 7 = 21)', () => {
    const result = calculateHandTotal([card('7'), card('7'), card('7')]);
    assert.equal(result.total, 21);
    assert.equal(result.soft, false);
  });

  it('ace demoted then another ace stays high (A + 5 + A + 4 = 21 soft)', () => {
    // A(11) + 5 + A(11) + 4 = 31 → demote one ace → 21, one ace still at 11
    const result = calculateHandTotal([card('A'), card('5'), card('A'), card('4')]);
    assert.equal(result.total, 21);
    assert.equal(result.soft, true);
  });
});
