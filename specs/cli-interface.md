# CLI Interface

## Overview

The game is distributed as a CLI tool installable via `npm install -g` or `npm link`. The command name is `21black`.

## Requirements

### Entry Point

- `src/index.js` must have a shebang line as the first line: `#!/usr/bin/env node`
- The file must be executable (`chmod +x src/index.js`)

### Command Usage

```bash
21black              # Start the game (default behavior)
21black --help       # Show help text
21black --version    # Show version from package.json
```

### --help Output

```
21black - Terminal Blackjack

Usage: 21black [options]

Options:
  --help      Show this help message
  --version   Show version number

Start a game of blackjack right in your terminal.
```

### --version Output

Print the version from package.json, e.g. `21black v0.1.0`

### Default Behavior

When run with no arguments (or any unrecognized arguments), launch the game normally — show the welcome screen and begin play.

### Installation

The package.json `bin` field maps `21black` → `./src/index.js`. Users install globally with:

```bash
npm install -g .    # from the project directory
# or
npm link            # for development
```

## Acceptance Criteria

- [ ] `src/index.js` has shebang `#!/usr/bin/env node`
- [ ] `21black` command works after `npm link`
- [ ] `21black --help` prints usage info and exits
- [ ] `21black --version` prints version and exits
- [ ] Running with no args launches the game

## Technical Notes

- Parse args with `process.argv.slice(2)` — no external arg parser needed
- Read version from package.json via `import` or `fs.readFileSync` + JSON.parse
- Keep arg parsing minimal — 3 flags max, everything else starts the game
