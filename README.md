# 21black-cli

A polished blackjack game that runs entirely in your terminal. Built autonomously by AI agents using the [Ralph Loop](https://github.com/JoelCCodes/21black-cli) methodology — so you can play blackjack while your agents code.

```
╔══════════════════════════════════════════╗
║          ♠ BLACKJACK 21 ♠               ║
╠══════════════════════════════════════════╣
║  Chips: $1,000          Bet: $50        ║
╠══════════════════════════════════════════╣
║                                          ║
║  DEALER (showing 7)                      ║
║  ┌─────┐ ┌─────┐                        ║
║  │ 7   │ │░░░░░│                        ║
║  │  ♣  │ │░░░░░│                        ║
║  │   7 │ │░░░░░│                        ║
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

## Install

```bash
npm install -g .
```

## Play

```bash
21black
```

Or run directly without installing:

```bash
node src/index.js
```

## Features

- Full casino blackjack rules — hit, stand, double down, split
- ASCII card art with red/black suit colors
- Dramatic dealer card reveals with animated pauses
- $1,000 starting chips with 3:2 blackjack payouts
- Session stats — hands played, win rate, peak chips
- Welcome screen, game over screen, and clean quit handling
- Works in any terminal (80 columns recommended)
- Zero dependencies — pure Node.js

## Controls

| Key | Action |
|-----|--------|
| `H` | Hit — draw a card |
| `S` | Stand — keep your hand |
| `D` | Double down — double bet, draw one card |
| `P` | Split — split matching cards into two hands |
| `Q` | Quit |

Betting: type a number ($10–$500) and press Enter.

## Rules

- Dealer stands on soft 17
- Blackjack pays 3:2
- Split aces receive one card each
- 21 on a split hand pays 1:1 (not blackjack)
- Deck reshuffles automatically when low

## How it was built

This entire game was built autonomously by AI agents running in the **Ralph Loop** — an iterative, context-clearing development methodology. A single bash script loops an AI agent that:

1. Reads specs and an implementation plan
2. Picks ONE task, implements it fully, writes tests
3. Commits and exits — fresh context next iteration

The planning phase produced a 48-item implementation plan across 5 phases. The build phase executed 42+ atomic iterations, each producing a single focused commit. The agent self-terminates by creating a `.ralph-complete` file when all items are done.

**The entire codebase — 4,300+ lines across 4 files — was written without a human touching the source code.**

### Project structure

```
src/
├── game.js          # Pure game logic (505 lines)
├── renderer.js      # Terminal UI with ANSI colors (737 lines)
├── index.js         # CLI entry point and game loop (372 lines)
└── game.test.js     # 2,700+ lines of tests
```

## License

MIT
