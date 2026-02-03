# Operational Guide

## Build & Run

```bash
# Run the game directly
node src/index.js

# Or install as CLI command and run
npm link
21black

# Run tests
node --test src/**/*.test.js
```

## Validation

```bash
# Syntax check
node --check src/index.js

# Run tests
node --test src/**/*.test.js
```

## Codebase Patterns

- Pure Node.js — no external dependencies (use built-in readline, process.stdout)
- ES modules (`"type": "module"` in package.json)
- Clean separation: game logic in `src/game.js`, rendering in `src/renderer.js`, entry point in `src/index.js`
- Card data as plain objects: `{ suit: '♠', rank: 'A', value: 11 }`
- All terminal output via the renderer module — game logic never writes to stdout directly
- Use ANSI escape codes for colors and cursor control
- Support standard 80-column terminals minimum

## Operational Notes

- Node.js 18+ required (uses built-in test runner)
- No package install step needed — zero dependencies
