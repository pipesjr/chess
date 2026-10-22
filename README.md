# Chess Vision Trainer

A small website for practicing board visualization on simple tactics. Each
puzzle is described in words ("White: King g1; Rook a1; Pawns f2, g2, h2 …"),
you solve it in your head, then reveal the board and the answer.

## Using it

Open `index.html` in a browser. It's plain HTML/CSS/JS with no build step or
dependencies, so it also works as-is on GitHub Pages or any static host.

- **Show answer** (or the space bar) reveals the board and the solution.
- **Peek at board** shows the board without the solution, if you get stuck.
- **Prev / Next / Random** (or the arrow keys) move between tactics.

## Adding tactics

**In the app:** open the **Add tactic** tab. Enter the position as a FEN, or as
a piece list like `White: Kg1 Ra1 f2 g2 h2; Black: Kg8 f7 g7 h7` (a bare square
is a pawn). Press **Preview** to check it, then **Save tactic**. Saved tactics
live in your browser's local storage and are marked ★ in the list.

**Permanently:** press **Copy as code** on the Add tactic tab and paste the
result into the `TACTICS` list in `tactics.js`, or write an entry by hand:

```js
{
  title: "Back rank",
  goal: "Mate in 1",
  fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
  solution: ["Ra8#"],
  explanation: "Black's own pawns box the king in.",
},
```

The app doesn't check that a solution is legal, so double-check new entries.
