# Blackjack Game Rules

## Overview

A complete implementation of casino-style Blackjack (21) playable in the CLI terminal. Single player vs dealer.

## Requirements

### Deck & Cards

- Standard 52-card deck (4 suits: ♠ ♥ ♦ ♣)
- Card values: 2-10 face value, J/Q/K = 10, Ace = 11 or 1 (automatically optimized)
- Shuffle using Fisher-Yates algorithm
- Re-shuffle when deck runs below 15 cards (simulate continuous shuffle)

### Dealing

- Player and dealer each receive 2 cards
- Player's cards are face up
- Dealer has 1 face-up card, 1 face-down (hole card)
- Check for naturals (blackjack) immediately after deal

### Player Actions

- **Hit**: Draw another card. Available whenever hand total < 21
- **Stand**: Keep current hand, end turn
- **Double Down**: Double the bet, receive exactly 1 more card, then stand. Only available on initial 2-card hand
- **Split**: If first 2 cards have same value, split into 2 separate hands. Each hand gets 1 additional card and plays independently. Only 1 split allowed (no re-splitting). Aces split receive only 1 card each

### Dealer Rules

- Dealer reveals hole card after player stands
- Dealer must hit on 16 or below
- Dealer must stand on 17 or above (including soft 17 — dealer stands on soft 17)

### Hand Evaluation

- Aces count as 11 unless that would bust the hand, then count as 1
- Blackjack (natural 21 with 2 cards) beats regular 21
- Bust: hand total exceeds 21 — automatic loss
- Push: tie — bet is returned

### Betting

- Player starts with $1000 chips
- Minimum bet: $10, Maximum bet: $500
- Blackjack pays 3:2 (bet of $100 wins $150)
- Regular win pays 1:1
- Player can continue playing as long as they have chips above minimum bet
- Game over when chips drop below minimum bet

### Game Flow

1. Display chip count
2. Player places bet
3. Cards are dealt
4. Check for dealer/player blackjack
5. Player takes actions (hit/stand/double/split)
6. If player hasn't busted, dealer plays
7. Compare hands, settle bets
8. Ask to play again or quit

## Acceptance Criteria

- [ ] Full 52-card deck with proper shuffling
- [ ] Ace value auto-optimization (soft/hard hands)
- [ ] All player actions work correctly (hit, stand, double down, split)
- [ ] Dealer follows house rules exactly
- [ ] Betting system with proper payouts
- [ ] Blackjack detection and 3:2 payout
- [ ] Game over when out of chips
- [ ] Continuous play loop with quit option

## Technical Notes

- Zero external dependencies — pure Node.js
- Game state as a plain object, not class-based
- All randomness via `Math.random()` (Fisher-Yates shuffle)
- Input via Node.js `readline` module
- Game logic must be fully testable (separate from I/O)
