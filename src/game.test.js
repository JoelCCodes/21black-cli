// src/game.test.js — Unit tests for game logic

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createDeck, shuffleDeck, createGameState, calculateHandTotal, dealInitialCards, checkForBlackjack, playerHit, playerStand, playerDouble, isDealerDone, dealerDrawOne } from './game.js';

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

// playerHit tests (item 1.7, part of 4.4)
describe('playerHit', () => {
  const card = (rank, suit = '♠') => {
    let value;
    if (rank === 'A') value = 11;
    else if (['J', 'Q', 'K'].includes(rank)) value = 10;
    else value = parseInt(rank, 10);
    return { suit, rank, value };
  };

  const makeState = (playerCards, deckCards, bet = 100) => {
    const state = createGameState();
    state.playerHand = playerCards;
    state.dealerHand = [card('8'), card('9')];
    state.deck = deckCards;
    state.bet = bet;
    state.chips = 900;
    state.phase = 'playing';
    return state;
  };

  it('draws one card from the deck and adds to player hand', () => {
    const state = makeState([card('7'), card('5')], [card('3'), card('4'), card('2')]);
    const result = playerHit(state);
    assert.equal(result.playerHand.length, 3);
    assert.equal(result.deck.length, 2);
  });

  it('draws the top card (last element) from the deck', () => {
    const topCard = card('K');
    const state = makeState([card('7'), card('5')], [card('3'), topCard]);
    const result = playerHit(state);
    assert.equal(result.playerHand[2].rank, 'K');
    assert.equal(result.playerHand[2].suit, '♠');
  });

  it('keeps phase as playing when total < 21', () => {
    const state = makeState([card('7'), card('5')], [card('3')]);
    const result = playerHit(state);
    assert.equal(result.phase, 'playing');
    assert.equal(result.result, null);
  });

  it('busts when total > 21 (sets phase to result)', () => {
    // 10 + 8 + 7 = 25 → bust
    const state = makeState([card('10'), card('8')], [card('7')]);
    const result = playerHit(state);
    assert.equal(result.phase, 'result');
    assert.equal(result.result.outcome, 'bust');
    assert.equal(result.result.message, 'BUST!');
  });

  it('sets chipChange to negative bet on bust', () => {
    const state = makeState([card('K'), card('8')], [card('7')], 200);
    state.chips = 800;
    const result = playerHit(state);
    assert.equal(result.result.chipChange, -200);
  });

  it('updates stats on bust (handsPlayed and handsLost)', () => {
    const state = makeState([card('K'), card('8')], [card('7')]);
    const result = playerHit(state);
    assert.equal(result.stats.handsPlayed, 1);
    assert.equal(result.stats.handsLost, 1);
  });

  it('auto-stands at exactly 21 (sets phase to dealerTurn)', () => {
    // 10 + 5 + 6 = 21 → auto-stand
    const state = makeState([card('10'), card('5')], [card('6')]);
    const result = playerHit(state);
    assert.equal(result.phase, 'dealerTurn');
    assert.equal(result.result, null);
  });

  it('auto-stands at 21 with ace soft hand (A + 3 + 7 = 21)', () => {
    // A(11) + 3 + 7 = 21
    const state = makeState([card('A'), card('3')], [card('7')]);
    const result = playerHit(state);
    assert.equal(result.phase, 'dealerTurn');
    assert.equal(calculateHandTotal(result.playerHand).total, 21);
  });

  it('does not mutate original state', () => {
    const state = makeState([card('7'), card('5')], [card('3'), card('4')]);
    const originalHandLen = state.playerHand.length;
    const originalDeckLen = state.deck.length;
    playerHit(state);
    assert.equal(state.playerHand.length, originalHandLen);
    assert.equal(state.deck.length, originalDeckLen);
    assert.equal(state.phase, 'playing');
  });

  it('preserves other state fields', () => {
    const state = makeState([card('7'), card('5')], [card('3')]);
    state.reshuffled = true;
    const result = playerHit(state);
    assert.equal(result.reshuffled, true);
    assert.equal(result.chips, 900);
    assert.equal(result.bet, 100);
    assert.equal(result.dealerHand.length, 2);
  });

  it('handles ace demotion correctly when hitting (A + 8 + 5 = 14 not bust)', () => {
    // A(11) + 8 = 19, then hit 5 → A(1) + 8 + 5 = 14
    const state = makeState([card('A'), card('8')], [card('5')]);
    const result = playerHit(state);
    assert.equal(result.phase, 'playing');
    const { total } = calculateHandTotal(result.playerHand);
    assert.equal(total, 14);
  });

  it('bust with ace already demoted (A + 9 + 5 + K = 25)', () => {
    // A(11)+9=20 → hit 5 → A(1)+9+5=15 → hit K → 25 bust
    // We need to do two hits, so set up after first hit
    const state = makeState([card('A'), card('9'), card('5')], [card('K')]);
    const result = playerHit(state);
    assert.equal(result.phase, 'result');
    assert.equal(result.result.outcome, 'bust');
    assert.equal(calculateHandTotal(result.playerHand).total, 25);
  });
});

// playerStand tests (item 1.8, part of 4.4)
describe('playerStand', () => {
  const card = (rank, suit = '♠') => {
    let value;
    if (rank === 'A') value = 11;
    else if (['J', 'Q', 'K'].includes(rank)) value = 10;
    else value = parseInt(rank, 10);
    return { suit, rank, value };
  };

  const makeState = (playerCards, bet = 100) => {
    const state = createGameState();
    state.playerHand = playerCards;
    state.dealerHand = [card('8'), card('9')];
    state.deck = shuffleDeck(createDeck());
    state.bet = bet;
    state.chips = 900;
    state.phase = 'playing';
    return state;
  };

  it('sets phase to dealerTurn', () => {
    const state = makeState([card('K'), card('7')]);
    const result = playerStand(state);
    assert.equal(result.phase, 'dealerTurn');
  });

  it('does not modify player hand', () => {
    const state = makeState([card('K'), card('7')]);
    const result = playerStand(state);
    assert.equal(result.playerHand.length, 2);
    assert.equal(result.playerHand[0].rank, 'K');
    assert.equal(result.playerHand[1].rank, '7');
  });

  it('does not modify dealer hand', () => {
    const state = makeState([card('K'), card('7')]);
    const result = playerStand(state);
    assert.equal(result.dealerHand.length, 2);
  });

  it('does not modify chips or bet', () => {
    const state = makeState([card('K'), card('7')], 200);
    state.chips = 800;
    const result = playerStand(state);
    assert.equal(result.chips, 800);
    assert.equal(result.bet, 200);
  });

  it('does not modify deck', () => {
    const state = makeState([card('K'), card('7')]);
    const deckLen = state.deck.length;
    const result = playerStand(state);
    assert.equal(result.deck.length, deckLen);
  });

  it('does not set result', () => {
    const state = makeState([card('K'), card('7')]);
    const result = playerStand(state);
    assert.equal(result.result, null);
  });

  it('does not mutate original state', () => {
    const state = makeState([card('K'), card('7')]);
    playerStand(state);
    assert.equal(state.phase, 'playing');
  });

  it('preserves stats unchanged', () => {
    const state = makeState([card('K'), card('7')]);
    state.stats.handsPlayed = 5;
    state.stats.handsWon = 3;
    const result = playerStand(state);
    assert.equal(result.stats.handsPlayed, 5);
    assert.equal(result.stats.handsWon, 3);
  });

  it('preserves reshuffled flag', () => {
    const state = makeState([card('K'), card('7')]);
    state.reshuffled = true;
    const result = playerStand(state);
    assert.equal(result.reshuffled, true);
  });
});

// playerDouble tests (item 1.9, part of 4.4)
describe('playerDouble', () => {
  const card = (rank, suit = '♠') => {
    let value;
    if (rank === 'A') value = 11;
    else if (['J', 'Q', 'K'].includes(rank)) value = 10;
    else value = parseInt(rank, 10);
    return { suit, rank, value };
  };

  const makeState = (playerCards, deckCards, bet = 100) => {
    const state = createGameState();
    state.playerHand = playerCards;
    state.dealerHand = [card('8'), card('9')];
    state.deck = deckCards;
    state.bet = bet;
    state.chips = 900; // 1000 - 100 bet
    state.phase = 'playing';
    return state;
  };

  it('doubles the bet amount', () => {
    const state = makeState([card('5'), card('6')], [card('3')], 100);
    const result = playerDouble(state);
    assert.equal(result.bet, 200);
  });

  it('deducts additional bet from chips', () => {
    const state = makeState([card('5'), card('6')], [card('3')], 100);
    state.chips = 900;
    const result = playerDouble(state);
    assert.equal(result.chips, 800); // 900 - 100 additional
  });

  it('draws exactly one card', () => {
    const state = makeState([card('5'), card('6')], [card('3'), card('4')]);
    const result = playerDouble(state);
    assert.equal(result.playerHand.length, 3);
    assert.equal(result.deck.length, 1);
  });

  it('draws the top card (last element) from the deck', () => {
    const topCard = card('9', '♥');
    const state = makeState([card('5'), card('6')], [card('2'), topCard]);
    const result = playerDouble(state);
    assert.equal(result.playerHand[2].rank, '9');
    assert.equal(result.playerHand[2].suit, '♥');
  });

  it('auto-stands after drawing (phase becomes dealerTurn)', () => {
    // 5 + 6 + 3 = 14, no bust
    const state = makeState([card('5'), card('6')], [card('3')]);
    const result = playerDouble(state);
    assert.equal(result.phase, 'dealerTurn');
    assert.equal(result.result, null);
  });

  it('busts when total > 21 after draw', () => {
    // K(10) + 8 + 7 = 25 → bust
    const state = makeState([card('K'), card('8')], [card('7')], 100);
    const result = playerDouble(state);
    assert.equal(result.phase, 'result');
    assert.equal(result.result.outcome, 'bust');
    assert.equal(result.result.message, 'BUST!');
  });

  it('sets chipChange to negative doubled bet on bust', () => {
    const state = makeState([card('K'), card('8')], [card('7')], 100);
    const result = playerDouble(state);
    assert.equal(result.result.chipChange, -200); // doubled bet
  });

  it('updates stats on bust (handsPlayed and handsLost)', () => {
    const state = makeState([card('K'), card('8')], [card('7')]);
    const result = playerDouble(state);
    assert.equal(result.stats.handsPlayed, 1);
    assert.equal(result.stats.handsLost, 1);
  });

  it('does not set result when not busted', () => {
    const state = makeState([card('5'), card('6')], [card('3')]);
    const result = playerDouble(state);
    assert.equal(result.result, null);
  });

  it('does not update stats when not busted (settlement handles it)', () => {
    const state = makeState([card('5'), card('6')], [card('3')]);
    const result = playerDouble(state);
    assert.equal(result.stats.handsPlayed, 0);
    assert.equal(result.stats.handsLost, 0);
  });

  it('handles ace demotion correctly (A + 8 + 5 = 14, not bust)', () => {
    // A(11) + 8 = 19, draw 5 → A(1) + 8 + 5 = 14
    const state = makeState([card('A'), card('8')], [card('5')]);
    const result = playerDouble(state);
    assert.equal(result.phase, 'dealerTurn');
    assert.equal(calculateHandTotal(result.playerHand).total, 14);
  });

  it('reaches exactly 21 and goes to dealerTurn (not result)', () => {
    // 5 + 6 + K = 21
    const state = makeState([card('5'), card('6')], [card('K')]);
    const result = playerDouble(state);
    assert.equal(result.phase, 'dealerTurn');
    assert.equal(calculateHandTotal(result.playerHand).total, 21);
  });

  it('does not mutate original state', () => {
    const state = makeState([card('5'), card('6')], [card('3'), card('4')]);
    const originalHandLen = state.playerHand.length;
    const originalDeckLen = state.deck.length;
    const originalBet = state.bet;
    const originalChips = state.chips;
    playerDouble(state);
    assert.equal(state.playerHand.length, originalHandLen);
    assert.equal(state.deck.length, originalDeckLen);
    assert.equal(state.bet, originalBet);
    assert.equal(state.chips, originalChips);
    assert.equal(state.phase, 'playing');
  });

  it('preserves other state fields', () => {
    const state = makeState([card('5'), card('6')], [card('3')]);
    state.reshuffled = true;
    const result = playerDouble(state);
    assert.equal(result.reshuffled, true);
    assert.equal(result.dealerHand.length, 2);
  });

  it('works with larger bet amounts ($500 bet doubles to $1000)', () => {
    const state = makeState([card('5'), card('6')], [card('3')], 500);
    state.chips = 500; // 1000 - 500
    const result = playerDouble(state);
    assert.equal(result.bet, 1000);
    assert.equal(result.chips, 0); // 500 - 500
  });
});

// 4.5 — Dealer logic tests
describe('isDealerDone', () => {
  const card = (rank, suit = '♠') => {
    let value;
    if (rank === 'A') value = 11;
    else if (['J', 'Q', 'K'].includes(rank)) value = 10;
    else value = parseInt(rank, 10);
    return { suit, rank, value };
  };

  const makeState = (dealerCards) => {
    const state = createGameState();
    state.dealerHand = dealerCards;
    state.phase = 'dealerTurn';
    return state;
  };

  it('returns false when dealer total is below 17', () => {
    const state = makeState([card('8'), card('5')]); // 13
    assert.equal(isDealerDone(state), false);
  });

  it('returns false when dealer total is 16', () => {
    const state = makeState([card('10'), card('6')]); // 16
    assert.equal(isDealerDone(state), false);
  });

  it('returns true when dealer total is exactly 17', () => {
    const state = makeState([card('10'), card('7')]); // 17
    assert.equal(isDealerDone(state), true);
  });

  it('returns true when dealer total is 18', () => {
    const state = makeState([card('10'), card('8')]); // 18
    assert.equal(isDealerDone(state), true);
  });

  it('returns true when dealer total is 21', () => {
    const state = makeState([card('A'), card('K')]); // 21
    assert.equal(isDealerDone(state), true);
  });

  it('returns true when dealer has busted (total > 21)', () => {
    const state = makeState([card('K'), card('Q'), card('5')]); // 25
    assert.equal(isDealerDone(state), true);
  });

  it('stands on soft 17 (A + 6 = soft 17)', () => {
    const state = makeState([card('A'), card('6')]); // soft 17
    assert.equal(isDealerDone(state), true);
  });

  it('stands on soft 18 (A + 7 = soft 18)', () => {
    const state = makeState([card('A'), card('7')]); // soft 18
    assert.equal(isDealerDone(state), true);
  });

  it('returns false when dealer has only low cards (2 + 3 = 5)', () => {
    const state = makeState([card('2'), card('3')]); // 5
    assert.equal(isDealerDone(state), false);
  });

  it('returns true with multi-card 17 (5 + 6 + 6 = 17)', () => {
    const state = makeState([card('5'), card('6'), card('6')]); // 17
    assert.equal(isDealerDone(state), true);
  });

  it('returns true with ace demoted to 1 (A + 9 + 8 = 18)', () => {
    // A(11) + 9 + 8 = 28 → A(1) + 9 + 8 = 18
    const state = makeState([card('A'), card('9'), card('8')]); // 18
    assert.equal(isDealerDone(state), true);
  });
});

describe('dealerDrawOne', () => {
  const card = (rank, suit = '♠') => {
    let value;
    if (rank === 'A') value = 11;
    else if (['J', 'Q', 'K'].includes(rank)) value = 10;
    else value = parseInt(rank, 10);
    return { suit, rank, value };
  };

  const makeState = (dealerCards, deckCards) => {
    const state = createGameState();
    state.dealerHand = dealerCards;
    state.playerHand = [card('K'), card('7')]; // player has 17
    state.deck = deckCards;
    state.bet = 100;
    state.chips = 900;
    state.phase = 'dealerTurn';
    return state;
  };

  it('draws one card from the deck and adds to dealer hand', () => {
    const state = makeState([card('8'), card('5')], [card('3'), card('4'), card('2')]);
    const result = dealerDrawOne(state);
    assert.equal(result.dealerHand.length, 3);
    assert.equal(result.deck.length, 2);
  });

  it('draws the top card (last element) from the deck', () => {
    const topCard = card('K', '♥');
    const state = makeState([card('8'), card('5')], [card('3'), topCard]);
    const result = dealerDrawOne(state);
    assert.equal(result.dealerHand[2].rank, 'K');
    assert.equal(result.dealerHand[2].suit, '♥');
  });

  it('does not change the phase', () => {
    const state = makeState([card('8'), card('5')], [card('3')]);
    const result = dealerDrawOne(state);
    assert.equal(result.phase, 'dealerTurn');
  });

  it('does not mutate original state', () => {
    const state = makeState([card('8'), card('5')], [card('3'), card('4')]);
    const originalHandLen = state.dealerHand.length;
    const originalDeckLen = state.deck.length;
    dealerDrawOne(state);
    assert.equal(state.dealerHand.length, originalHandLen);
    assert.equal(state.deck.length, originalDeckLen);
  });

  it('preserves player hand unchanged', () => {
    const state = makeState([card('8'), card('5')], [card('3')]);
    const result = dealerDrawOne(state);
    assert.equal(result.playerHand.length, 2);
    assert.equal(result.playerHand[0].rank, 'K');
    assert.equal(result.playerHand[1].rank, '7');
  });

  it('preserves chips and bet unchanged', () => {
    const state = makeState([card('8'), card('5')], [card('3')]);
    const result = dealerDrawOne(state);
    assert.equal(result.chips, 900);
    assert.equal(result.bet, 100);
  });

  it('preserves stats unchanged', () => {
    const state = makeState([card('8'), card('5')], [card('3')]);
    state.stats.handsPlayed = 5;
    const result = dealerDrawOne(state);
    assert.equal(result.stats.handsPlayed, 5);
  });

  it('can be called multiple times to draw multiple cards', () => {
    const state = makeState(
      [card('2'), card('3')], // dealer: 5
      [card('4'), card('6'), card('K')] // deck
    );
    let current = dealerDrawOne(state); // draws K → 15
    assert.equal(current.dealerHand.length, 3);
    assert.equal(isDealerDone(current), false);

    current = dealerDrawOne(current); // draws 6 → 21
    assert.equal(current.dealerHand.length, 4);
    assert.equal(isDealerDone(current), true);
  });

  it('works with dealer bust scenario across multiple draws', () => {
    const state = makeState(
      [card('10'), card('6')], // dealer: 16
      [card('9')] // deck — will draw 9 → 25 bust
    );
    const result = dealerDrawOne(state);
    assert.equal(calculateHandTotal(result.dealerHand).total, 25);
    assert.equal(isDealerDone(result), true);
  });

  it('preserves reshuffled flag', () => {
    const state = makeState([card('8'), card('5')], [card('3')]);
    state.reshuffled = true;
    const result = dealerDrawOne(state);
    assert.equal(result.reshuffled, true);
  });
});
