# UI & Visual Design

## Overview

The terminal UI must feel premium and polished. Clean layouts, beautiful ASCII card art, smooth transitions, and tasteful use of color. This is not a text-dump — it's a visual experience in the terminal.

## Requirements

### Card Rendering

Cards displayed as ASCII art boxes:

```
┌─────┐
│ A   │
│  ♠  │
│   A │
└─────┘
```

Face-down card:

```
┌─────┐
│░░░░░│
│░░░░░│
│░░░░░│
└─────┘
```

Cards displayed side-by-side horizontally (not stacked vertically):

```
┌─────┐ ┌─────┐ ┌─────┐
│ K   │ │ 7   │ │ A   │
│  ♥  │ │  ♣  │ │  ♠  │
│   K │ │   7 │ │   A │
└─────┘ └─────┘ └─────┘
```

For 10, use both characters:

```
┌─────┐
│10   │
│  ♦  │
│  10 │
└─────┘
```

### Color Scheme

- Red suits (♥ ♦): bright red ANSI color
- Black suits (♠ ♣): white/default color (bright on dark terminal)
- Card borders: dim/gray
- Chip amounts: bright yellow
- Win messages: bright green
- Loss messages: red
- Push messages: yellow/amber
- Blackjack: bold bright cyan or magenta for emphasis
- Headers/dividers: dim white or gray

### Layout Structure

```
╔══════════════════════════════════════════╗
║          ♠ BLACKJACK 21 ♠               ║
╠══════════════════════════════════════════╣
║  Chips: $1,000          Bet: $50        ║
╠══════════════════════════════════════════╣
║                                          ║
║  DEALER (showing 14)                     ║
║  ┌─────┐ ┌─────┐                        ║
║  │ 4   │ │░░░░░│                        ║
║  │  ♣  │ │░░░░░│                        ║
║  │   4 │ │░░░░░│                        ║
║  └─────┘ └─────┘                        ║
║                                          ║
║  YOUR HAND (21 - BLACKJACK!)            ║
║  ┌─────┐ ┌─────┐                        ║
║  │ A   │ │ K   │                        ║
║  │  ♠  │ │  ♥  │                        ║
║  │   A │ │   K │                        ║
║  └─────┘ └─────┘                        ║
║                                          ║
╠══════════════════════════════════════════╣
║  [H]it  [S]tand  [D]ouble  [Q]uit      ║
╚══════════════════════════════════════════╝
```

### Screen Management

- Clear screen between rounds for a clean feel
- Use ANSI escape codes for cursor positioning
- Full-screen redraw on each state change (no scrolling text)
- Minimum terminal width: 80 columns
- Center content horizontally

### Typography & Spacing

- Box-drawing characters for frames (╔ ╗ ╚ ╝ ═ ║)
- Generous vertical spacing between dealer and player areas
- Hand totals displayed next to hand labels
- Soft hand indicator (e.g., "Soft 17") when applicable

### Animations / Transitions

- Brief pause between card deals (200-400ms) for dramatic effect
- Dealer card reveal moment (flip the hole card)
- Result message displayed prominently before clearing

### Action Prompts

- Single keypress input where possible (H for hit, S for stand, D for double, Q for quit)
- Highlight available actions — dim unavailable ones
- Bet input: type number + Enter
- Clear prompt text: `Place your bet ($10-$500):`

### Result Display

- Large, prominent win/loss/push message
- Show chip change: `+$100` in green or `-$50` in red
- Brief pause to read result before next hand prompt

### Welcome & Game Over Screens

Welcome screen:

```
╔══════════════════════════════════════════╗
║                                          ║
║        ♠ ♥ BLACKJACK 21 ♣ ♦            ║
║                                          ║
║          Press ENTER to play             ║
║                                          ║
╚══════════════════════════════════════════╝
```

Game over screen:

```
╔══════════════════════════════════════════╗
║                                          ║
║            GAME OVER                     ║
║                                          ║
║     You finished with $X,XXX            ║
║     Hands played: XX                     ║
║     Win rate: XX%                        ║
║                                          ║
║     Press ENTER to play again            ║
║     Press Q to quit                      ║
║                                          ║
╚══════════════════════════════════════════╝
```

## Acceptance Criteria

- [ ] ASCII card art renders correctly with suits and ranks
- [ ] Cards display side-by-side horizontally
- [ ] Red/black suit colors via ANSI codes
- [ ] Full-screen redraw (no scrolling)
- [ ] Clean box-drawing frame around game area
- [ ] Hand totals displayed clearly
- [ ] Win/loss/push results are prominent and color-coded
- [ ] Brief dramatic pauses during dealing
- [ ] Welcome screen and game over screen
- [ ] Works correctly in standard 80-column terminals

## Technical Notes

- Use `\x1b[` ANSI escape codes — no chalk/colors dependencies
- Clear screen: `\x1b[2J\x1b[H`
- Colors: `\x1b[31m` red, `\x1b[32m` green, `\x1b[33m` yellow, `\x1b[36m` cyan, `\x1b[1m` bold, `\x1b[0m` reset
- Use `setTimeout` / `async/await` for dramatic pauses
- Render function takes full game state and redraws everything
- `process.stdout.write()` for raw output (avoid console.log newlines where not needed)
