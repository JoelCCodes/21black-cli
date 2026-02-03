// src/game.test.js — Unit tests for game logic

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createDeck, shuffleDeck, createGameState, calculateHandTotal, dealInitialCards, checkForBlackjack } from './game.js';

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

// dealInitialCards tests (item 1.5)
describe('dealInitialCards', () => {
  it('deals 2 cards to player and 2 to dealer', () => {
    const state = createGameState();
    state.deck = shuffleDeck(createDeck());
    const newState = dealInitialCards(state);
    assert.equal(newState.playerHand.length, 2);
    assert.equal(newState.dealerHand.length, 2);
  });

  it('removes 4 cards from the deck', () => {
    const state = createGameState();
    state.deck = shuffleDeck(createDeck());
    const newState = dealInitialCards(state);
    assert.equal(newState.deck.length, 48);
  });

  it('sets phase to playing', () => {
    const state = createGameState();
    state.deck = shuffleDeck(createDeck());
    const newState = dealInitialCards(state);
    assert.equal(newState.phase, 'playing');
  });

  it('does not mutate the original state', () => {
    const state = createGameState();
    state.deck = shuffleDeck(createDeck());
    const originalDeckLen = state.deck.length;
    dealInitialCards(state);
    assert.equal(state.deck.length, originalDeckLen);
    assert.equal(state.playerHand.length, 0);
    assert.equal(state.dealerHand.length, 0);
    assert.equal(state.phase, 'welcome');
  });

  it('dealt cards are valid card objects', () => {
    const state = createGameState();
    state.deck = shuffleDeck(createDeck());
    const newState = dealInitialCards(state);
    for (const card of [...newState.playerHand, ...newState.dealerHand]) {
      assert.ok('suit' in card);
      assert.ok('rank' in card);
      assert.ok('value' in card);
    }
  });

  it('dealt cards are no longer in the deck', () => {
    const state = createGameState();
    state.deck = shuffleDeck(createDeck());
    const newState = dealInitialCards(state);
    const deckKeys = new Set(newState.deck.map(c => `${c.suit}${c.rank}`));
    for (const card of [...newState.playerHand, ...newState.dealerHand]) {
      const key = `${card.suit}${card.rank}`;
      assert.ok(!deckKeys.has(key), `dealt card ${key} should not be in deck`);
    }
  });

  it('preserves other state fields', () => {
    const state = createGameState();
    state.deck = shuffleDeck(createDeck());
    state.chips = 500;
    state.bet = 100;
    const newState = dealInitialCards(state);
    assert.equal(newState.chips, 500);
    assert.equal(newState.bet, 100);
  });

  // 4.10 — Deck reshuffle tests
  it('reshuffles when deck has fewer than 15 cards', () => {
    const state = createGameState();
    state.deck = shuffleDeck(createDeck()).slice(0, 10); // only 10 cards
    const newState = dealInitialCards(state);
    assert.equal(newState.reshuffled, true);
    // After reshuffle + dealing 4 cards, deck should be 48
    assert.equal(newState.deck.length, 48);
  });

  it('reshuffles when deck is empty', () => {
    const state = createGameState();
    state.deck = [];
    const newState = dealInitialCards(state);
    assert.equal(newState.reshuffled, true);
    assert.equal(newState.deck.length, 48);
    assert.equal(newState.playerHand.length, 2);
    assert.equal(newState.dealerHand.length, 2);
  });

  it('reshuffles when deck has exactly 14 cards', () => {
    const state = createGameState();
    state.deck = shuffleDeck(createDeck()).slice(0, 14);
    const newState = dealInitialCards(state);
    assert.equal(newState.reshuffled, true);
    assert.equal(newState.deck.length, 48);
  });

  it('does not reshuffle when deck has exactly 15 cards', () => {
    const state = createGameState();
    state.deck = shuffleDeck(createDeck()).slice(0, 15);
    const newState = dealInitialCards(state);
    assert.equal(newState.reshuffled, false);
    assert.equal(newState.deck.length, 11); // 15 - 4
  });

  it('does not reshuffle when deck is full', () => {
    const state = createGameState();
    state.deck = shuffleDeck(createDeck());
    const newState = dealInitialCards(state);
    assert.equal(newState.reshuffled, false);
    assert.equal(newState.deck.length, 48);
  });

  it('reshuffled deck has 52 cards (before dealing)', () => {
    const state = createGameState();
    state.deck = [];
    const newState = dealInitialCards(state);
    // deck(48) + player(2) + dealer(2) = 52
    const totalCards = newState.deck.length + newState.playerHand.length + newState.dealerHand.length;
    assert.equal(totalCards, 52);
  });
});

// checkForBlackjack tests (item 1.6, part of 4.6)
describe('checkForBlackjack', () => {
  const card = (rank, suit = '♠') => {
    let value;
    if (rank === 'A') value = 11;
    else if (['J', 'Q', 'K'].includes(rank)) value = 10;
    else value = parseInt(rank, 10);
    return { suit, rank, value };
  };

  const makeState = (playerCards, dealerCards, bet = 100) => {
    const state = createGameState();
    state.playerHand = playerCards;
    state.dealerHand = dealerCards;
    state.bet = bet;
    state.chips = 900; // 1000 - 100 bet
    state.phase = 'playing';
    state.deck = shuffleDeck(createDeck());
    return state;
  };

  it('returns state unchanged when neither has blackjack', () => {
    const state = makeState([card('K'), card('5')], [card('8'), card('9')]);
    const result = checkForBlackjack(state);
    assert.equal(result, state); // same reference — no change
    assert.equal(result.phase, 'playing');
    assert.equal(result.result, null);
  });

  it('detects player blackjack (A + K)', () => {
    const state = makeState([card('A'), card('K')], [card('8'), card('9')]);
    const result = checkForBlackjack(state);
    assert.equal(result.phase, 'result');
    assert.equal(result.result.outcome, 'blackjack');
    assert.equal(result.result.chipChange, 150); // 3:2 on $100
  });

  it('pays 3:2 for player blackjack ($100 bet → $150 payout)', () => {
    const state = makeState([card('A'), card('K')], [card('8'), card('9')], 100);
    state.chips = 900;
    const result = checkForBlackjack(state);
    // chips = 900 (remaining) + 100 (bet returned) + 150 (payout) = 1150
    assert.equal(result.chips, 1150);
    assert.equal(result.result.chipChange, 150);
  });

  it('pays 3:2 rounded for odd bet ($50 bet → $75 payout)', () => {
    const state = makeState([card('A'), card('10')], [card('7'), card('9')], 50);
    state.chips = 950;
    const result = checkForBlackjack(state);
    assert.equal(result.chips, 1075); // 950 + 50 + 75
    assert.equal(result.result.chipChange, 75);
  });

  it('rounds 3:2 payout to nearest dollar ($30 bet → $45 payout)', () => {
    const state = makeState([card('A'), card('J')], [card('5'), card('6')], 30);
    state.chips = 970;
    const result = checkForBlackjack(state);
    assert.equal(result.result.chipChange, 45);
    assert.equal(result.chips, 1045); // 970 + 30 + 45
  });

  it('detects dealer blackjack — player loses', () => {
    const state = makeState([card('K'), card('5')], [card('A'), card('Q')]);
    const result = checkForBlackjack(state);
    assert.equal(result.phase, 'result');
    assert.equal(result.result.outcome, 'lose');
    assert.equal(result.result.chipChange, -100);
    // chips stay at 900 (bet already deducted)
    assert.equal(result.chips, 900);
  });

  it('detects mutual blackjack — push', () => {
    const state = makeState([card('A'), card('K')], [card('A'), card('Q')]);
    const result = checkForBlackjack(state);
    assert.equal(result.phase, 'result');
    assert.equal(result.result.outcome, 'push');
    assert.equal(result.result.chipChange, 0);
    // chips = 900 + 100 (bet returned) = 1000
    assert.equal(result.chips, 1000);
  });

  it('player blackjack with 10 (not face card)', () => {
    const state = makeState([card('A'), card('10')], [card('8'), card('9')]);
    const result = checkForBlackjack(state);
    assert.equal(result.result.outcome, 'blackjack');
  });

  it('21 with 3+ cards is NOT blackjack', () => {
    const state = makeState([card('7'), card('7'), card('7')], [card('8'), card('9')]);
    const result = checkForBlackjack(state);
    assert.equal(result, state); // unchanged
  });

  it('updates stats.handsPlayed on player blackjack', () => {
    const state = makeState([card('A'), card('K')], [card('8'), card('9')]);
    const result = checkForBlackjack(state);
    assert.equal(result.stats.handsPlayed, 1);
    assert.equal(result.stats.handsWon, 1);
    assert.equal(result.stats.blackjacks, 1);
  });

  it('updates stats.handsPlayed on dealer blackjack', () => {
    const state = makeState([card('K'), card('5')], [card('A'), card('Q')]);
    const result = checkForBlackjack(state);
    assert.equal(result.stats.handsPlayed, 1);
    assert.equal(result.stats.handsLost, 1);
    assert.equal(result.stats.blackjacks, 0);
  });

  it('updates stats.handsPushed on mutual blackjack', () => {
    const state = makeState([card('A'), card('K')], [card('A'), card('Q')]);
    const result = checkForBlackjack(state);
    assert.equal(result.stats.handsPlayed, 1);
    assert.equal(result.stats.handsPushed, 1);
    assert.equal(result.stats.blackjacks, 0);
  });

  it('updates peakChips on player blackjack win', () => {
    const state = makeState([card('A'), card('K')], [card('8'), card('9')], 100);
    state.chips = 900;
    const result = checkForBlackjack(state);
    assert.equal(result.stats.peakChips, 1150); // 900 + 100 + 150
  });

  it('does not mutate original state', () => {
    const state = makeState([card('A'), card('K')], [card('8'), card('9')]);
    const originalPhase = state.phase;
    const originalChips = state.chips;
    checkForBlackjack(state);
    assert.equal(state.phase, originalPhase);
    assert.equal(state.chips, originalChips);
    assert.equal(state.result, null);
    assert.equal(state.stats.handsPlayed, 0);
  });

  it('preserves other state fields', () => {
    const state = makeState([card('A'), card('K')], [card('8'), card('9')]);
    state.reshuffled = true;
    const result = checkForBlackjack(state);
    assert.equal(result.reshuffled, true);
    assert.ok(result.deck.length > 0);
  });
});
