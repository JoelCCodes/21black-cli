# Session Statistics

## Overview

Track player statistics during a game session for display on the Game Over screen and optionally during gameplay.

## Requirements

### Tracked Stats

- **Hands played**: Total number of hands completed
- **Hands won**: Number of hands the player won (including blackjack)
- **Hands lost**: Number of hands the player lost
- **Hands pushed**: Number of ties
- **Blackjacks**: Number of natural blackjacks dealt to the player
- **Win rate**: Percentage of hands won (wins / hands played)
- **Peak chips**: Highest chip count reached during session
- **Starting chips**: Always $1,000

### Where Stats Are Used

- **Game Over screen**: Display hands played, win rate, and final chip count (per UI spec)
- **Game state**: Stats live in the game state object alongside chips, hands, deck, etc.

### Data Shape

Stats stored as a plain object within game state:

```js
stats: {
  handsPlayed: 0,
  handsWon: 0,
  handsLost: 0,
  handsPushed: 0,
  blackjacks: 0,
  peakChips: 1000
}
```

## Acceptance Criteria

- [ ] Stats accumulate correctly across multiple hands
- [ ] Win rate calculation is accurate
- [ ] Blackjacks are counted separately
- [ ] Peak chips tracks the highest balance reached
- [ ] Game Over screen displays stats correctly

## Technical Notes

- Updated within the bet settlement logic in `src/game.js`
- No persistence between sessions (in-memory only)
- Win rate = `(handsWon / handsPlayed * 100).toFixed(1)` with "0.0%" when no hands played
