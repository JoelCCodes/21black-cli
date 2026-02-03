# Split Hand UI Rendering

## Overview

When a player splits their hand, the UI must clearly display both hands with visual distinction, indicating which hand is currently active.

## Requirements

### Layout

Split hands displayed side-by-side with a clear separator and labels:

```
  HAND 1 (15) *active*          HAND 2 (18) - Stand
  ┌─────┐ ┌─────┐              ┌─────┐ ┌─────┐
  │ 8   │ │ 7   │              │ 8   │ │ K   │
  │  ♠  │ │  ♣  │              │  ♥  │ │  ♦  │
  │   8 │ │   7 │              │   8 │ │   K │
  └─────┘ └─────┘              └─────┘ └─────┘
```

If terminal width is insufficient for side-by-side, stack vertically:

```
  HAND 1 (15) *active*
  ┌─────┐ ┌─────┐
  │ 8   │ │ 7   │
  │  ♠  │ │  ♣  │
  │   8 │ │   7 │
  └─────┘ └─────┘

  HAND 2 (18) - Stand
  ┌─────┐ ┌─────┐
  │ 8   │ │ K   │
  │  ♥  │ │  ♦  │
  │   8 │ │   K │
  └─────┘ └─────┘
```

### Visual Indicators

- **Active hand**: Label includes `*active*` or arrow indicator, displayed in bright/bold
- **Completed hand**: Label shows final state (e.g., "Stand", "Bust", "21")
- **Dimmed inactive hand**: The non-active hand's cards rendered in dim ANSI colors
- **Bet per hand**: Show individual bet amounts when split (original bet divided across hands)

### Action Prompt During Split

```
  Hand 1: [H]it  [S]tand        (no Double after split)
```

Double down is not available after a split. Only Hit and Stand are offered.

## Acceptance Criteria

- [ ] Both split hands render clearly with labels
- [ ] Active hand is visually distinguished from inactive hand
- [ ] Hand totals shown for each split hand
- [ ] Actions only apply to the active hand
- [ ] Results shown per-hand after dealer plays

## Technical Notes

- Renderer checks if game state has `splitHands` array and renders accordingly
- Game state during split: `{ hands: [hand1, hand2], activeHandIndex: 0|1 }`
- Each hand in the split has its own `cards`, `total`, `status`, and `bet`
