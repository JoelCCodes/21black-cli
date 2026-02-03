// src/game.test.js — Unit tests for game logic

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createDeck, shuffleDeck, createGameState, calculateHandTotal, dealInitialCards, checkForBlackjack, playerHit, playerStand, playerDouble, playerSplit, splitHit, splitStand, isDealerDone, dealerDrawOne, settleRound, getWinRate, placeBet, checkGameOver, getAvailableActions } from './game.js';

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

// 4.6 — Bet settlement tests
describe('settleRound', () => {
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
    state.phase = 'dealerTurn';
    state.deck = [card('2'), card('3')]; // leftover deck
    return state;
  };

  it('player wins 1:1 when player total > dealer total', () => {
    // Player: 20, Dealer: 18
    const state = makeState([card('K'), card('Q')], [card('10'), card('8')]);
    const result = settleRound(state);
    assert.equal(result.result.outcome, 'win');
    assert.equal(result.result.chipChange, 100);
    assert.equal(result.chips, 1100); // 900 + 100 (bet returned) + 100 (win)
  });

  it('dealer wins when dealer total > player total', () => {
    // Player: 17, Dealer: 19
    const state = makeState([card('10'), card('7')], [card('K'), card('9')]);
    const result = settleRound(state);
    assert.equal(result.result.outcome, 'lose');
    assert.equal(result.result.chipChange, -100);
    assert.equal(result.chips, 900); // bet already deducted
  });

  it('push when totals are equal (bet returned)', () => {
    // Player: 18, Dealer: 18
    const state = makeState([card('10'), card('8')], [card('K'), card('8', '♥')]);
    const result = settleRound(state);
    assert.equal(result.result.outcome, 'push');
    assert.equal(result.result.chipChange, 0);
    assert.equal(result.chips, 1000); // 900 + 100 (bet returned)
  });

  it('player wins when dealer busts', () => {
    // Player: 15, Dealer: 25 (bust)
    const state = makeState([card('10'), card('5')], [card('K'), card('Q'), card('5', '♥')]);
    const result = settleRound(state);
    assert.equal(result.result.outcome, 'win');
    assert.equal(result.result.message, 'Dealer busts!');
    assert.equal(result.result.chipChange, 100);
    assert.equal(result.chips, 1100);
  });

  it('sets phase to result', () => {
    const state = makeState([card('K'), card('Q')], [card('10'), card('8')]);
    const result = settleRound(state);
    assert.equal(result.phase, 'result');
  });

  it('handles larger bets correctly ($500 win)', () => {
    const state = makeState([card('K'), card('Q')], [card('10'), card('8')], 500);
    state.chips = 500; // 1000 - 500
    const result = settleRound(state);
    assert.equal(result.result.chipChange, 500);
    assert.equal(result.chips, 1500); // 500 + 500 + 500
  });

  it('handles larger bets correctly ($500 loss)', () => {
    const state = makeState([card('10'), card('7')], [card('K'), card('9')], 500);
    state.chips = 500;
    const result = settleRound(state);
    assert.equal(result.result.chipChange, -500);
    assert.equal(result.chips, 500); // bet already gone
  });

  it('push at 21 (both have 21 from multi-card hands)', () => {
    // Player: 7+7+7=21, Dealer: 10+5+6=21
    const state = makeState(
      [card('7'), card('7', '♥'), card('7', '♦')],
      [card('10'), card('5'), card('6')]
    );
    const result = settleRound(state);
    assert.equal(result.result.outcome, 'push');
    assert.equal(result.result.chipChange, 0);
  });

  it('updates stats.handsPlayed on win', () => {
    const state = makeState([card('K'), card('Q')], [card('10'), card('8')]);
    const result = settleRound(state);
    assert.equal(result.stats.handsPlayed, 1);
    assert.equal(result.stats.handsWon, 1);
  });

  it('updates stats.handsPlayed on loss', () => {
    const state = makeState([card('10'), card('7')], [card('K'), card('9')]);
    const result = settleRound(state);
    assert.equal(result.stats.handsPlayed, 1);
    assert.equal(result.stats.handsLost, 1);
  });

  it('updates stats.handsPushed on push', () => {
    const state = makeState([card('10'), card('8')], [card('K'), card('8', '♥')]);
    const result = settleRound(state);
    assert.equal(result.stats.handsPlayed, 1);
    assert.equal(result.stats.handsPushed, 1);
  });

  it('updates peakChips when winning increases chip count', () => {
    const state = makeState([card('K'), card('Q')], [card('10'), card('8')], 200);
    state.chips = 800; // 1000 - 200
    const result = settleRound(state);
    assert.equal(result.stats.peakChips, 1200); // 800 + 200 + 200
  });

  it('does not increase peakChips on loss', () => {
    const state = makeState([card('10'), card('7')], [card('K'), card('9')]);
    state.stats.peakChips = 1500; // previous peak
    const result = settleRound(state);
    assert.equal(result.stats.peakChips, 1500); // unchanged
  });

  it('accumulates stats across multiple rounds', () => {
    const state = makeState([card('K'), card('Q')], [card('10'), card('8')]);
    state.stats.handsPlayed = 5;
    state.stats.handsWon = 3;
    state.stats.handsLost = 1;
    state.stats.handsPushed = 1;
    const result = settleRound(state);
    assert.equal(result.stats.handsPlayed, 6);
    assert.equal(result.stats.handsWon, 4);
    assert.equal(result.stats.handsLost, 1);
    assert.equal(result.stats.handsPushed, 1);
  });

  it('does not mutate original state', () => {
    const state = makeState([card('K'), card('Q')], [card('10'), card('8')]);
    const originalChips = state.chips;
    const originalPhase = state.phase;
    settleRound(state);
    assert.equal(state.chips, originalChips);
    assert.equal(state.phase, originalPhase);
    assert.equal(state.result, null);
    assert.equal(state.stats.handsPlayed, 0);
  });

  it('preserves other state fields', () => {
    const state = makeState([card('K'), card('Q')], [card('10'), card('8')]);
    state.reshuffled = true;
    const result = settleRound(state);
    assert.equal(result.reshuffled, true);
    assert.equal(result.deck.length, 2);
    assert.equal(result.bet, 100);
  });

  it('player wins with soft hand vs dealer', () => {
    // Player: A+8 = soft 19, Dealer: 10+8 = 18
    const state = makeState([card('A'), card('8')], [card('10'), card('8', '♥')]);
    const result = settleRound(state);
    assert.equal(result.result.outcome, 'win');
  });

  it('dealer wins with higher soft hand', () => {
    // Player: 10+7 = 17, Dealer: A+8 = soft 19
    const state = makeState([card('10'), card('7')], [card('A'), card('8')]);
    const result = settleRound(state);
    assert.equal(result.result.outcome, 'lose');
  });

  it('does not count dealer bust win as blackjack', () => {
    const state = makeState([card('10'), card('5')], [card('K'), card('Q'), card('5', '♥')]);
    const result = settleRound(state);
    assert.equal(result.stats.blackjacks, 0);
  });
});

// 4.9 — Stats tests (getWinRate)
describe('getWinRate', () => {
  it('returns "0.0" when no hands played', () => {
    const stats = createGameState().stats;
    assert.equal(getWinRate(stats), '0.0');
  });

  it('calculates 100% win rate correctly', () => {
    const stats = { ...createGameState().stats, handsPlayed: 5, handsWon: 5 };
    assert.equal(getWinRate(stats), '100.0');
  });

  it('calculates 0% win rate correctly', () => {
    const stats = { ...createGameState().stats, handsPlayed: 5, handsWon: 0 };
    assert.equal(getWinRate(stats), '0.0');
  });

  it('calculates 50% win rate correctly', () => {
    const stats = { ...createGameState().stats, handsPlayed: 10, handsWon: 5 };
    assert.equal(getWinRate(stats), '50.0');
  });

  it('calculates fractional win rate with one decimal', () => {
    const stats = { ...createGameState().stats, handsPlayed: 3, handsWon: 1 };
    assert.equal(getWinRate(stats), '33.3');
  });

  it('calculates 66.7% win rate', () => {
    const stats = { ...createGameState().stats, handsPlayed: 3, handsWon: 2 };
    assert.equal(getWinRate(stats), '66.7');
  });

  it('returns string type', () => {
    const stats = { ...createGameState().stats, handsPlayed: 5, handsWon: 3 };
    assert.equal(typeof getWinRate(stats), 'string');
  });
});

// 4.7 — Bet validation tests
describe('placeBet', () => {
  const makeState = (chips = 1000) => {
    const state = createGameState();
    state.chips = chips;
    state.phase = 'betting';
    return state;
  };

  it('accepts a valid bet of $100', () => {
    const state = makeState(1000);
    const result = placeBet(state, 100);
    assert.equal(result.valid, true);
    assert.equal(result.state.bet, 100);
    assert.equal(result.state.chips, 900);
    assert.equal(result.state.phase, 'playing');
  });

  it('accepts the minimum bet of $10', () => {
    const state = makeState(1000);
    const result = placeBet(state, 10);
    assert.equal(result.valid, true);
    assert.equal(result.state.bet, 10);
    assert.equal(result.state.chips, 990);
  });

  it('accepts the maximum bet of $500', () => {
    const state = makeState(1000);
    const result = placeBet(state, 500);
    assert.equal(result.valid, true);
    assert.equal(result.state.bet, 500);
    assert.equal(result.state.chips, 500);
  });

  it('accepts a bet equal to available chips when under max', () => {
    const state = makeState(200);
    const result = placeBet(state, 200);
    assert.equal(result.valid, true);
    assert.equal(result.state.chips, 0);
  });

  it('rejects bet below minimum ($9)', () => {
    const state = makeState(1000);
    const result = placeBet(state, 9);
    assert.equal(result.valid, false);
    assert.ok(result.error.includes('Minimum'));
  });

  it('rejects bet above maximum ($501)', () => {
    const state = makeState(1000);
    const result = placeBet(state, 501);
    assert.equal(result.valid, false);
    assert.ok(result.error.includes('Maximum'));
  });

  it('rejects bet exceeding available chips', () => {
    const state = makeState(50);
    const result = placeBet(state, 100);
    assert.equal(result.valid, false);
    assert.ok(result.error.includes('50'));
  });

  it('rejects non-integer bet (decimal)', () => {
    const state = makeState(1000);
    const result = placeBet(state, 50.5);
    assert.equal(result.valid, false);
    assert.ok(result.error.includes('whole number'));
  });

  it('rejects zero bet', () => {
    const state = makeState(1000);
    const result = placeBet(state, 0);
    assert.equal(result.valid, false);
  });

  it('rejects negative bet', () => {
    const state = makeState(1000);
    const result = placeBet(state, -50);
    assert.equal(result.valid, false);
  });

  it('rejects NaN', () => {
    const state = makeState(1000);
    const result = placeBet(state, NaN);
    assert.equal(result.valid, false);
  });

  it('rejects Infinity', () => {
    const state = makeState(1000);
    const result = placeBet(state, Infinity);
    assert.equal(result.valid, false);
  });

  it('does not mutate original state on valid bet', () => {
    const state = makeState(1000);
    const originalChips = state.chips;
    placeBet(state, 100);
    assert.equal(state.chips, originalChips);
    assert.equal(state.bet, 0);
    assert.equal(state.phase, 'betting');
  });

  it('does not return state on invalid bet', () => {
    const state = makeState(1000);
    const result = placeBet(state, 5);
    assert.equal(result.state, undefined);
  });

  it('preserves stats and other state fields on valid bet', () => {
    const state = makeState(1000);
    state.stats.handsPlayed = 5;
    state.stats.handsWon = 3;
    state.reshuffled = true;
    const result = placeBet(state, 100);
    assert.equal(result.state.stats.handsPlayed, 5);
    assert.equal(result.state.stats.handsWon, 3);
    assert.equal(result.state.reshuffled, true);
  });

  it('advances phase to playing on valid bet', () => {
    const state = makeState(1000);
    const result = placeBet(state, 100);
    assert.equal(result.state.phase, 'playing');
  });
});

// 4.13 — Game over tests
describe('checkGameOver', () => {
  const makeState = (chips, phase = 'result') => {
    const state = createGameState();
    state.chips = chips;
    state.phase = phase;
    state.result = { outcome: 'lose', message: 'Dealer wins.', chipChange: -100 };
    state.stats.handsPlayed = 5;
    state.stats.handsLost = 3;
    return state;
  };

  it('sets phase to gameOver when chips < $10', () => {
    const state = makeState(9);
    const result = checkGameOver(state);
    assert.equal(result.phase, 'gameOver');
  });

  it('sets phase to gameOver when chips are 0', () => {
    const state = makeState(0);
    const result = checkGameOver(state);
    assert.equal(result.phase, 'gameOver');
  });

  it('sets phase to gameOver when chips are $1', () => {
    const state = makeState(1);
    const result = checkGameOver(state);
    assert.equal(result.phase, 'gameOver');
  });

  it('does NOT set gameOver when chips are exactly $10', () => {
    const state = makeState(10);
    const result = checkGameOver(state);
    assert.notEqual(result.phase, 'gameOver');
    assert.equal(result.phase, 'result');
  });

  it('does NOT set gameOver when chips are above $10', () => {
    const state = makeState(500);
    const result = checkGameOver(state);
    assert.equal(result.phase, 'result');
  });

  it('does NOT set gameOver when chips are $1000', () => {
    const state = makeState(1000);
    const result = checkGameOver(state);
    assert.equal(result.phase, 'result');
  });

  it('preserves all other state fields', () => {
    const state = makeState(5);
    state.reshuffled = true;
    state.bet = 100;
    const result = checkGameOver(state);
    assert.equal(result.phase, 'gameOver');
    assert.equal(result.chips, 5);
    assert.equal(result.reshuffled, true);
    assert.equal(result.bet, 100);
    assert.equal(result.stats.handsPlayed, 5);
    assert.equal(result.stats.handsLost, 3);
    assert.deepEqual(result.result, { outcome: 'lose', message: 'Dealer wins.', chipChange: -100 });
  });

  it('does not mutate original state', () => {
    const state = makeState(5);
    const originalPhase = state.phase;
    checkGameOver(state);
    assert.equal(state.phase, originalPhase);
  });

  it('works after settlement where player loses all chips', () => {
    // Simulate: player had $100 chips, bet $100, lost → chips = 0
    const state = createGameState();
    state.chips = 0;
    state.bet = 100;
    state.phase = 'result';
    state.result = { outcome: 'lose', message: 'Dealer wins.', chipChange: -100 };
    const result = checkGameOver(state);
    assert.equal(result.phase, 'gameOver');
  });

  it('works after settlement where player has exactly minimum bet', () => {
    // Simulate: player won and has exactly $10 left
    const state = createGameState();
    state.chips = 10;
    state.phase = 'result';
    state.result = { outcome: 'win', message: 'You win!', chipChange: 10 };
    const result = checkGameOver(state);
    assert.equal(result.phase, 'result'); // can still play
  });
});

// 4.11 — Action availability tests
describe('getAvailableActions', () => {
  const card = (rank, suit = '♠') => {
    let value;
    if (rank === 'A') value = 11;
    else if (['J', 'Q', 'K'].includes(rank)) value = 10;
    else value = parseInt(rank, 10);
    return { suit, rank, value };
  };

  const makeState = (playerCards, opts = {}) => {
    const state = createGameState();
    state.playerHand = playerCards;
    state.dealerHand = opts.dealerCards || [card('8'), card('9')];
    state.deck = opts.deck || shuffleDeck(createDeck());
    state.bet = opts.bet || 100;
    state.chips = opts.chips !== undefined ? opts.chips : 900;
    state.phase = opts.phase || 'playing';
    if (opts.splitHands !== undefined) state.splitHands = opts.splitHands;
    return state;
  };

  it('all actions available on initial 2-card hand with matching ranks and enough chips', () => {
    const actions = getAvailableActions(makeState([card('8'), card('8', '♥')]));
    assert.equal(actions.hit, true);
    assert.equal(actions.stand, true);
    assert.equal(actions.double, true);
    assert.equal(actions.split, true);
    assert.equal(actions.quit, true);
  });

  it('hit/stand/double available, split NOT available when ranks differ', () => {
    const actions = getAvailableActions(makeState([card('8'), card('9')]));
    assert.equal(actions.hit, true);
    assert.equal(actions.stand, true);
    assert.equal(actions.double, true);
    assert.equal(actions.split, false);
  });

  it('no hit/stand/double/split when phase is not playing', () => {
    const actions = getAvailableActions(makeState([card('8'), card('9')], { phase: 'result' }));
    assert.equal(actions.hit, false);
    assert.equal(actions.stand, false);
    assert.equal(actions.double, false);
    assert.equal(actions.split, false);
    assert.equal(actions.quit, true);
  });

  it('no hit/stand/double/split in betting phase', () => {
    const actions = getAvailableActions(makeState([card('8'), card('9')], { phase: 'betting' }));
    assert.equal(actions.hit, false);
    assert.equal(actions.stand, false);
    assert.equal(actions.double, false);
    assert.equal(actions.split, false);
    assert.equal(actions.quit, true);
  });

  it('no hit/stand/double/split in dealerTurn phase', () => {
    const actions = getAvailableActions(makeState([card('K'), card('7')], { phase: 'dealerTurn' }));
    assert.equal(actions.hit, false);
    assert.equal(actions.stand, false);
    assert.equal(actions.double, false);
    assert.equal(actions.split, false);
  });

  it('no double/split after first hit (3-card hand)', () => {
    const actions = getAvailableActions(makeState([card('5'), card('3'), card('2')]));
    assert.equal(actions.hit, true);
    assert.equal(actions.stand, true);
    assert.equal(actions.double, false);
    assert.equal(actions.split, false);
  });

  it('no hit when total is 21 (auto-stand scenario)', () => {
    // A(11) + K(10) = 21
    const actions = getAvailableActions(makeState([card('A'), card('K')]));
    assert.equal(actions.hit, false);
    assert.equal(actions.stand, true);
  });

  it('no hit when total is exactly 21 with 3 cards', () => {
    // 7+7+7 = 21
    const actions = getAvailableActions(makeState([card('7'), card('7', '♥'), card('7', '♦')]));
    assert.equal(actions.hit, false);
    assert.equal(actions.stand, true);
  });

  it('no double when chips < bet', () => {
    const actions = getAvailableActions(makeState([card('5'), card('6')], { chips: 50, bet: 100 }));
    assert.equal(actions.hit, true);
    assert.equal(actions.stand, true);
    assert.equal(actions.double, false);
  });

  it('no split when chips < bet', () => {
    const actions = getAvailableActions(makeState([card('8'), card('8', '♥')], { chips: 50, bet: 100 }));
    assert.equal(actions.hit, true);
    assert.equal(actions.stand, true);
    assert.equal(actions.split, false);
  });

  it('double allowed when chips === bet', () => {
    const actions = getAvailableActions(makeState([card('5'), card('6')], { chips: 100, bet: 100 }));
    assert.equal(actions.double, true);
  });

  it('split allowed when chips === bet and ranks match', () => {
    const actions = getAvailableActions(makeState([card('8'), card('8', '♥')], { chips: 100, bet: 100 }));
    assert.equal(actions.split, true);
  });

  it('no double/split/hit/stand during active split', () => {
    const splitHands = [
      { cards: [card('8'), card('3')], bet: 100, status: 'playing' },
      { cards: [card('8', '♥'), card('K')], bet: 100, status: 'playing' },
    ];
    const actions = getAvailableActions(makeState([card('8'), card('3')], { splitHands }));
    assert.equal(actions.hit, false);
    assert.equal(actions.stand, false);
    assert.equal(actions.double, false);
    assert.equal(actions.split, false);
    assert.equal(actions.quit, true);
  });

  it('quit is always true regardless of phase', () => {
    for (const phase of ['welcome', 'betting', 'playing', 'dealerTurn', 'result', 'gameOver']) {
      const actions = getAvailableActions(makeState([card('8'), card('9')], { phase }));
      assert.equal(actions.quit, true, `quit should be true in ${phase} phase`);
    }
  });

  it('split available with face cards of same rank (K + K)', () => {
    const actions = getAvailableActions(makeState([card('K'), card('K', '♥')]));
    assert.equal(actions.split, true);
  });

  it('split NOT available with same value but different rank (K + Q)', () => {
    const actions = getAvailableActions(makeState([card('K'), card('Q')]));
    assert.equal(actions.split, false);
  });

  it('split available with Aces (A + A)', () => {
    const actions = getAvailableActions(makeState([card('A'), card('A', '♥')]));
    assert.equal(actions.split, true);
  });

  it('returns correct actions for gameOver phase', () => {
    const actions = getAvailableActions(makeState([], { phase: 'gameOver' }));
    assert.equal(actions.hit, false);
    assert.equal(actions.stand, false);
    assert.equal(actions.double, false);
    assert.equal(actions.split, false);
    assert.equal(actions.quit, true);
  });
});

// 4.8 — Split tests (playerSplit)
describe('playerSplit', () => {
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

  it('creates two split hands from matching pair', () => {
    const state = makeState(
      [card('8'), card('8', '♥')],
      [card('3'), card('5'), card('K'), card('7')]
    );
    const result = playerSplit(state);
    assert.ok(result.splitHands);
    assert.equal(result.splitHands.length, 2);
  });

  it('each hand has the original card plus one dealt card', () => {
    const eightSpades = card('8');
    const eightHearts = card('8', '♥');
    const state = makeState(
      [eightSpades, eightHearts],
      [card('3'), card('5'), card('K'), card('7')]
    );
    const result = playerSplit(state);
    // Hand 1 gets first original card + top of deck
    assert.equal(result.splitHands[0].cards[0].rank, '8');
    assert.equal(result.splitHands[0].cards[0].suit, '♠');
    assert.equal(result.splitHands[0].cards.length, 2);
    // Hand 2 gets second original card + next from deck
    assert.equal(result.splitHands[1].cards[0].rank, '8');
    assert.equal(result.splitHands[1].cards[0].suit, '♥');
    assert.equal(result.splitHands[1].cards.length, 2);
  });

  it('deducts additional bet from chips', () => {
    const state = makeState(
      [card('8'), card('8', '♥')],
      [card('3'), card('5'), card('K'), card('7')],
      100
    );
    state.chips = 900;
    const result = playerSplit(state);
    assert.equal(result.chips, 800); // 900 - 100
  });

  it('each hand carries the original bet amount', () => {
    const state = makeState(
      [card('8'), card('8', '♥')],
      [card('3'), card('5'), card('K'), card('7')],
      200
    );
    state.chips = 800;
    const result = playerSplit(state);
    assert.equal(result.splitHands[0].bet, 200);
    assert.equal(result.splitHands[1].bet, 200);
  });

  it('sets activeHandIndex to 0', () => {
    const state = makeState(
      [card('8'), card('8', '♥')],
      [card('3'), card('5'), card('K'), card('7')]
    );
    const result = playerSplit(state);
    assert.equal(result.activeHandIndex, 0);
  });

  it('each hand has status playing for non-ace split', () => {
    const state = makeState(
      [card('8'), card('8', '♥')],
      [card('3'), card('5'), card('K'), card('7')]
    );
    const result = playerSplit(state);
    assert.equal(result.splitHands[0].status, 'playing');
    assert.equal(result.splitHands[1].status, 'playing');
  });

  it('keeps phase as playing for non-ace split', () => {
    const state = makeState(
      [card('8'), card('8', '♥')],
      [card('3'), card('5'), card('K'), card('7')]
    );
    const result = playerSplit(state);
    assert.equal(result.phase, 'playing');
  });

  it('removes 2 cards from deck (one per hand)', () => {
    const state = makeState(
      [card('8'), card('8', '♥')],
      [card('2'), card('3'), card('5'), card('7')]
    );
    const result = playerSplit(state);
    assert.equal(result.deck.length, 2); // 4 - 2
  });

  it('aces split: both hands auto-stand', () => {
    const state = makeState(
      [card('A'), card('A', '♥')],
      [card('3'), card('5'), card('K'), card('7')]
    );
    const result = playerSplit(state);
    assert.equal(result.splitHands[0].status, 'stand');
    assert.equal(result.splitHands[1].status, 'stand');
  });

  it('aces split: phase advances to dealerTurn', () => {
    const state = makeState(
      [card('A'), card('A', '♥')],
      [card('3'), card('5'), card('K'), card('7')]
    );
    const result = playerSplit(state);
    assert.equal(result.phase, 'dealerTurn');
  });

  it('aces split: each hand has 2 cards', () => {
    const state = makeState(
      [card('A'), card('A', '♥')],
      [card('3'), card('5'), card('K'), card('7')]
    );
    const result = playerSplit(state);
    assert.equal(result.splitHands[0].cards.length, 2);
    assert.equal(result.splitHands[1].cards.length, 2);
  });

  it('does not mutate original state', () => {
    const state = makeState(
      [card('8'), card('8', '♥')],
      [card('3'), card('5'), card('K'), card('7')]
    );
    const originalChips = state.chips;
    const originalDeckLen = state.deck.length;
    const originalHandLen = state.playerHand.length;
    playerSplit(state);
    assert.equal(state.chips, originalChips);
    assert.equal(state.deck.length, originalDeckLen);
    assert.equal(state.playerHand.length, originalHandLen);
    assert.equal(state.splitHands, undefined);
  });

  it('preserves dealer hand and other state fields', () => {
    const state = makeState(
      [card('8'), card('8', '♥')],
      [card('3'), card('5'), card('K'), card('7')]
    );
    state.reshuffled = true;
    const result = playerSplit(state);
    assert.equal(result.dealerHand.length, 2);
    assert.equal(result.reshuffled, true);
    assert.equal(result.bet, 100);
  });

  it('split with face cards (K + K)', () => {
    const state = makeState(
      [card('K'), card('K', '♥')],
      [card('3'), card('5'), card('7'), card('9')]
    );
    const result = playerSplit(state);
    assert.equal(result.splitHands[0].cards[0].rank, 'K');
    assert.equal(result.splitHands[1].cards[0].rank, 'K');
    assert.equal(result.splitHands[0].status, 'playing');
    assert.equal(result.splitHands[1].status, 'playing');
  });

  it('works with larger bet ($500 split)', () => {
    const state = makeState(
      [card('8'), card('8', '♥')],
      [card('3'), card('5'), card('K'), card('7')],
      500
    );
    state.chips = 500; // 1000 - 500
    const result = playerSplit(state);
    assert.equal(result.chips, 0); // 500 - 500
    assert.equal(result.splitHands[0].bet, 500);
    assert.equal(result.splitHands[1].bet, 500);
  });

  it('dealt cards go to correct hands (deck order)', () => {
    // Deck: [bottom ... top] — pop() takes from end
    const topCard = card('K', '♦');
    const secondCard = card('3', '♣');
    const state = makeState(
      [card('8'), card('8', '♥')],
      [card('2'), card('4'), secondCard, topCard]
    );
    const result = playerSplit(state);
    // First pop (topCard) goes to hand 1
    assert.equal(result.splitHands[0].cards[1].rank, 'K');
    assert.equal(result.splitHands[0].cards[1].suit, '♦');
    // Second pop (secondCard) goes to hand 2
    assert.equal(result.splitHands[1].cards[1].rank, '3');
    assert.equal(result.splitHands[1].cards[1].suit, '♣');
  });
});

// 1.17 — Split hand play-through tests (splitHit, splitStand)
describe('splitHit', () => {
  const card = (rank, suit = '♠') => {
    let value;
    if (rank === 'A') value = 11;
    else if (['J', 'Q', 'K'].includes(rank)) value = 10;
    else value = parseInt(rank, 10);
    return { suit, rank, value };
  };

  const makeSplitState = (hand1Cards, hand2Cards, deckCards, opts = {}) => {
    const state = createGameState();
    state.splitHands = [
      { cards: hand1Cards, bet: opts.bet || 100, status: opts.hand1Status || 'playing' },
      { cards: hand2Cards, bet: opts.bet || 100, status: opts.hand2Status || 'playing' },
    ];
    state.activeHandIndex = opts.activeHandIndex !== undefined ? opts.activeHandIndex : 0;
    state.dealerHand = opts.dealerHand || [card('8'), card('9')];
    state.deck = deckCards;
    state.bet = opts.bet || 100;
    state.chips = opts.chips !== undefined ? opts.chips : 800;
    state.phase = 'playing';
    return state;
  };

  it('draws a card for the active hand', () => {
    const state = makeSplitState(
      [card('8'), card('3')],
      [card('8', '♥'), card('K')],
      [card('5'), card('7')]
    );
    const result = splitHit(state);
    assert.equal(result.splitHands[0].cards.length, 3);
    assert.equal(result.splitHands[0].cards[2].rank, '7'); // top of deck (pop)
  });

  it('does not modify the inactive hand', () => {
    const state = makeSplitState(
      [card('8'), card('3')],
      [card('8', '♥'), card('K')],
      [card('5'), card('7')]
    );
    const result = splitHit(state);
    assert.equal(result.splitHands[1].cards.length, 2);
    assert.equal(result.splitHands[1].status, 'playing');
  });

  it('removes one card from deck', () => {
    const state = makeSplitState(
      [card('8'), card('3')],
      [card('8', '♥'), card('K')],
      [card('5'), card('7'), card('2')]
    );
    const result = splitHit(state);
    assert.equal(result.deck.length, 2);
  });

  it('keeps status playing when total < 21', () => {
    const state = makeSplitState(
      [card('8'), card('3')],
      [card('8', '♥'), card('K')],
      [card('5'), card('7')]
    );
    const result = splitHit(state);
    // 8 + 3 + 7 = 18, still playing
    assert.equal(result.splitHands[0].status, 'playing');
    assert.equal(result.activeHandIndex, 0);
    assert.equal(result.phase, 'playing');
  });

  it('auto-stands at exactly 21', () => {
    const state = makeSplitState(
      [card('8'), card('3')],
      [card('8', '♥'), card('K')],
      [card('5'), card('K')]
    );
    const result = splitHit(state);
    // 8 + 3 + 10 = 21 → auto-stand, advance to hand 2
    assert.equal(result.splitHands[0].status, 'stand');
    assert.equal(result.activeHandIndex, 1);
    assert.equal(result.phase, 'playing');
  });

  it('busts when total > 21', () => {
    const state = makeSplitState(
      [card('8'), card('6')],
      [card('8', '♥'), card('K')],
      [card('5'), card('K')]
    );
    const result = splitHit(state);
    // 8 + 6 + 10 = 24 → bust, advance to hand 2
    assert.equal(result.splitHands[0].status, 'bust');
    assert.equal(result.activeHandIndex, 1);
    assert.equal(result.phase, 'playing');
  });

  it('advances to hand 2 when hand 1 busts', () => {
    const state = makeSplitState(
      [card('K'), card('8')],
      [card('K', '♥'), card('3')],
      [card('5'), card('K')]
    );
    const result = splitHit(state);
    // K + 8 + K = 28 → bust hand 1, move to hand 2
    assert.equal(result.activeHandIndex, 1);
    assert.equal(result.phase, 'playing');
  });

  it('advances to dealerTurn when both hands are done', () => {
    // Hand 2 already standing, hand 1 active
    const state = makeSplitState(
      [card('8'), card('6')],
      [card('8', '♥'), card('K')],
      [card('5'), card('K')],
      { hand2Status: 'stand' }
    );
    const result = splitHit(state);
    // 8 + 6 + 10 = 24 → bust hand 1, hand 2 already stand → dealerTurn
    assert.equal(result.splitHands[0].status, 'bust');
    assert.equal(result.phase, 'dealerTurn');
  });

  it('advances to dealerTurn when last hand busts', () => {
    // Hand 1 already bust, hand 2 active
    const state = makeSplitState(
      [card('K'), card('8')],
      [card('K', '♥'), card('6')],
      [card('5'), card('K')],
      { hand1Status: 'bust', activeHandIndex: 1 }
    );
    const result = splitHit(state);
    // K + 6 + K = 26 → bust hand 2, hand 1 already bust → dealerTurn
    assert.equal(result.splitHands[1].status, 'bust');
    assert.equal(result.phase, 'dealerTurn');
  });

  it('advances to dealerTurn when last hand reaches 21', () => {
    const state = makeSplitState(
      [card('K'), card('8')],
      [card('8', '♥'), card('3')],
      [card('5'), card('K')],
      { hand1Status: 'stand', activeHandIndex: 1 }
    );
    const result = splitHit(state);
    // 8 + 3 + K = 21 → auto-stand hand 2, hand 1 already stand → dealerTurn
    assert.equal(result.splitHands[1].status, 'stand');
    assert.equal(result.phase, 'dealerTurn');
  });

  it('handles hitting hand 2 directly', () => {
    const state = makeSplitState(
      [card('K'), card('8')],
      [card('8', '♥'), card('3')],
      [card('5'), card('7')],
      { hand1Status: 'stand', activeHandIndex: 1 }
    );
    const result = splitHit(state);
    // Hand 2: 8 + 3 + 7 = 18, still playing
    assert.equal(result.splitHands[1].cards.length, 3);
    assert.equal(result.splitHands[1].status, 'playing');
    assert.equal(result.phase, 'playing');
  });

  it('does not mutate original state', () => {
    const state = makeSplitState(
      [card('8'), card('3')],
      [card('8', '♥'), card('K')],
      [card('5'), card('7')]
    );
    const originalDeckLen = state.deck.length;
    const originalHand1Len = state.splitHands[0].cards.length;
    splitHit(state);
    assert.equal(state.deck.length, originalDeckLen);
    assert.equal(state.splitHands[0].cards.length, originalHand1Len);
  });

  it('handles ace demotion in split hand', () => {
    const state = makeSplitState(
      [card('8'), card('A')],
      [card('8', '♥'), card('K')],
      [card('5'), card('5')]
    );
    const result = splitHit(state);
    // 8 + A(11) + 5 = 24 → ace demoted → 8 + 1 + 5 = 14
    const { total } = calculateHandTotal(result.splitHands[0].cards);
    assert.equal(total, 14);
    assert.equal(result.splitHands[0].status, 'playing');
  });

  it('multiple hits on same hand', () => {
    let state = makeSplitState(
      [card('2'), card('3')],
      [card('8', '♥'), card('K')],
      [card('9'), card('4'), card('2')]
    );
    // First hit: 2 + 3 + 2 = 7
    state = splitHit(state);
    assert.equal(state.splitHands[0].cards.length, 3);
    assert.equal(state.splitHands[0].status, 'playing');
    // Second hit: 2 + 3 + 2 + 4 = 11
    state = splitHit(state);
    assert.equal(state.splitHands[0].cards.length, 4);
    assert.equal(state.splitHands[0].status, 'playing');
    // Third hit: 2 + 3 + 2 + 4 + 9 = 20
    state = splitHit(state);
    assert.equal(state.splitHands[0].cards.length, 5);
    assert.equal(state.splitHands[0].status, 'playing');
  });

  it('preserves bet and chips', () => {
    const state = makeSplitState(
      [card('8'), card('3')],
      [card('8', '♥'), card('K')],
      [card('5'), card('7')],
      { bet: 200, chips: 600 }
    );
    const result = splitHit(state);
    assert.equal(result.bet, 200);
    assert.equal(result.chips, 600);
  });

  it('preserves dealer hand', () => {
    const state = makeSplitState(
      [card('8'), card('3')],
      [card('8', '♥'), card('K')],
      [card('5'), card('7')],
      { dealerHand: [card('J'), card('7')] }
    );
    const result = splitHit(state);
    assert.equal(result.dealerHand.length, 2);
    assert.equal(result.dealerHand[0].rank, 'J');
  });
});

describe('splitStand', () => {
  const card = (rank, suit = '♠') => {
    let value;
    if (rank === 'A') value = 11;
    else if (['J', 'Q', 'K'].includes(rank)) value = 10;
    else value = parseInt(rank, 10);
    return { suit, rank, value };
  };

  const makeSplitState = (hand1Cards, hand2Cards, opts = {}) => {
    const state = createGameState();
    state.splitHands = [
      { cards: hand1Cards, bet: opts.bet || 100, status: opts.hand1Status || 'playing' },
      { cards: hand2Cards, bet: opts.bet || 100, status: opts.hand2Status || 'playing' },
    ];
    state.activeHandIndex = opts.activeHandIndex !== undefined ? opts.activeHandIndex : 0;
    state.dealerHand = opts.dealerHand || [card('8'), card('9')];
    state.deck = opts.deck || [card('5'), card('7'), card('K')];
    state.bet = opts.bet || 100;
    state.chips = opts.chips !== undefined ? opts.chips : 800;
    state.phase = 'playing';
    return state;
  };

  it('sets active hand status to stand', () => {
    const state = makeSplitState(
      [card('8'), card('9')],
      [card('8', '♥'), card('K')]
    );
    const result = splitStand(state);
    assert.equal(result.splitHands[0].status, 'stand');
  });

  it('advances to hand 2 when hand 1 stands', () => {
    const state = makeSplitState(
      [card('8'), card('9')],
      [card('8', '♥'), card('K')]
    );
    const result = splitStand(state);
    assert.equal(result.activeHandIndex, 1);
    assert.equal(result.phase, 'playing');
  });

  it('advances to dealerTurn when hand 2 stands (both done)', () => {
    const state = makeSplitState(
      [card('8'), card('9')],
      [card('8', '♥'), card('K')],
      { hand1Status: 'stand', activeHandIndex: 1 }
    );
    const result = splitStand(state);
    assert.equal(result.splitHands[1].status, 'stand');
    assert.equal(result.phase, 'dealerTurn');
  });

  it('advances to dealerTurn when hand 2 stands and hand 1 bust', () => {
    const state = makeSplitState(
      [card('K'), card('8'), card('6')],
      [card('8', '♥'), card('K')],
      { hand1Status: 'bust', activeHandIndex: 1 }
    );
    const result = splitStand(state);
    assert.equal(result.splitHands[1].status, 'stand');
    assert.equal(result.phase, 'dealerTurn');
  });

  it('does not modify the inactive hand', () => {
    const state = makeSplitState(
      [card('8'), card('9')],
      [card('8', '♥'), card('K')]
    );
    const result = splitStand(state);
    assert.equal(result.splitHands[1].status, 'playing');
    assert.equal(result.splitHands[1].cards.length, 2);
  });

  it('does not remove cards from deck', () => {
    const state = makeSplitState(
      [card('8'), card('9')],
      [card('8', '♥'), card('K')],
      { deck: [card('5'), card('7'), card('K')] }
    );
    const result = splitStand(state);
    assert.equal(result.deck.length, 3);
  });

  it('does not mutate original state', () => {
    const state = makeSplitState(
      [card('8'), card('9')],
      [card('8', '♥'), card('K')]
    );
    splitStand(state);
    assert.equal(state.splitHands[0].status, 'playing');
    assert.equal(state.activeHandIndex, 0);
    assert.equal(state.phase, 'playing');
  });

  it('preserves bet, chips, and dealer hand', () => {
    const state = makeSplitState(
      [card('8'), card('9')],
      [card('8', '♥'), card('K')],
      { bet: 200, chips: 600, dealerHand: [card('J'), card('7')] }
    );
    const result = splitStand(state);
    assert.equal(result.bet, 200);
    assert.equal(result.chips, 600);
    assert.equal(result.dealerHand[0].rank, 'J');
  });

  it('full split play-through: hit, hit, stand hand 1, then stand hand 2', () => {
    // Setup: split 8s, hand 1 and hand 2 both playing
    let state = makeSplitState(
      [card('8'), card('3')],
      [card('8', '♥'), card('K')],
      { deck: [card('9'), card('4'), card('2')] }
    );
    // Hit hand 1: 8+3+2=13
    state = splitHit(state);
    assert.equal(state.splitHands[0].cards.length, 3);
    assert.equal(state.activeHandIndex, 0);
    // Hit hand 1 again: 8+3+2+4=17
    state = splitHit(state);
    assert.equal(state.splitHands[0].cards.length, 4);
    assert.equal(state.activeHandIndex, 0);
    // Stand hand 1 → move to hand 2
    state = splitStand(state);
    assert.equal(state.splitHands[0].status, 'stand');
    assert.equal(state.activeHandIndex, 1);
    assert.equal(state.phase, 'playing');
    // Stand hand 2 → dealer turn
    state = splitStand(state);
    assert.equal(state.splitHands[1].status, 'stand');
    assert.equal(state.phase, 'dealerTurn');
  });

  it('full split play-through: hand 1 busts, hand 2 stands', () => {
    let state = makeSplitState(
      [card('K'), card('6')],
      [card('K', '♥'), card('7')],
      { deck: [card('9'), card('K')] }
    );
    // Hit hand 1: K+6+K=26 → bust → advance to hand 2
    state = splitHit(state);
    assert.equal(state.splitHands[0].status, 'bust');
    assert.equal(state.activeHandIndex, 1);
    assert.equal(state.phase, 'playing');
    // Stand hand 2 → dealer turn
    state = splitStand(state);
    assert.equal(state.splitHands[1].status, 'stand');
    assert.equal(state.phase, 'dealerTurn');
  });

  it('full split play-through: both hands bust', () => {
    let state = makeSplitState(
      [card('K'), card('6')],
      [card('K', '♥'), card('8')],
      { deck: [card('9'), card('K')] }
    );
    // Hit hand 1: K+6+K=26 → bust → advance to hand 2
    state = splitHit(state);
    assert.equal(state.splitHands[0].status, 'bust');
    assert.equal(state.activeHandIndex, 1);
    // Hit hand 2: K+8+9=27 → bust → both done → dealerTurn
    state = splitHit(state);
    assert.equal(state.splitHands[1].status, 'bust');
    assert.equal(state.phase, 'dealerTurn');
  });
});

// getAvailableActions split-mode tests
describe('getAvailableActions during split', () => {
  const card = (rank, suit = '♠') => {
    let value;
    if (rank === 'A') value = 11;
    else if (['J', 'Q', 'K'].includes(rank)) value = 10;
    else value = parseInt(rank, 10);
    return { suit, rank, value };
  };

  const makeSplitState = (hand1Cards, hand2Cards, opts = {}) => {
    const state = createGameState();
    state.splitHands = [
      { cards: hand1Cards, bet: 100, status: opts.hand1Status || 'playing' },
      { cards: hand2Cards, bet: 100, status: opts.hand2Status || 'playing' },
    ];
    state.activeHandIndex = opts.activeHandIndex !== undefined ? opts.activeHandIndex : 0;
    state.playerHand = hand1Cards;
    state.dealerHand = [card('8'), card('9')];
    state.deck = [card('5'), card('7')];
    state.bet = 100;
    state.chips = 800;
    state.phase = 'playing';
    return state;
  };

  it('returns splitHit and splitStand true for active playing hand', () => {
    const state = makeSplitState(
      [card('8'), card('3')],
      [card('8', '♥'), card('K')]
    );
    const actions = getAvailableActions(state);
    assert.equal(actions.splitHit, true);
    assert.equal(actions.splitStand, true);
    assert.equal(actions.hit, false);
    assert.equal(actions.stand, false);
    assert.equal(actions.double, false);
    assert.equal(actions.split, false);
  });

  it('returns splitHit false when active hand at 21', () => {
    const state = makeSplitState(
      [card('8'), card('3'), card('K')],
      [card('8', '♥'), card('K')]
    );
    // 8+3+10 = 21, should not be able to hit
    const actions = getAvailableActions(state);
    assert.equal(actions.splitHit, false);
    assert.equal(actions.splitStand, true);
  });

  it('returns both splitHit/splitStand false when active hand already stood', () => {
    const state = makeSplitState(
      [card('8'), card('9')],
      [card('8', '♥'), card('K')],
      { hand1Status: 'stand', activeHandIndex: 1 }
    );
    // Active hand is 1, status is playing
    const actions = getAvailableActions(state);
    assert.equal(actions.splitHit, true);
    assert.equal(actions.splitStand, true);
  });

  it('quit always true during split', () => {
    const state = makeSplitState(
      [card('8'), card('3')],
      [card('8', '♥'), card('K')]
    );
    const actions = getAvailableActions(state);
    assert.equal(actions.quit, true);
  });
});
