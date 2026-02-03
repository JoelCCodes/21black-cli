// src/game.test.js — Unit tests for game logic

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createDeck } from './game.js';

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
