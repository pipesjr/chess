// The built-in tactics library.
//
// To add a tactic permanently, append an object to this list:
//   title       short name shown in the list
//   goal        what you are looking for, e.g. "Mate in 1" or "Win the queen"
//   fen         the position in FEN (only the first two fields matter:
//               piece placement and side to move)
//   solution    the main line in SAN, both sides' moves, e.g. ["Qxe8+", "Qxe8", "Rxe8#"]
//   explanation (optional) a sentence or two on why it works
//
// You can also build one with the "Add tactic" tab in the app, then press
// "Copy as code" and paste the result here.

const TACTICS = [
  {
    title: "Back rank",
    goal: "Mate in 1",
    fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
    solution: ["Ra8#"],
    explanation: "Black's own pawns box the king in, so a rook check on the 8th rank is mate.",
  },
  {
    title: "Smothered mate",
    goal: "Mate in 1",
    fen: "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1",
    solution: ["Nf7#"],
    explanation: "The king is surrounded by its own pieces, and nothing can capture the knight on f7.",
  },
  {
    title: "Knight fork",
    goal: "Win material",
    fen: "r3k3/5ppp/8/3N4/8/8/5PPP/6K1 w - - 0 1",
    solution: ["Nc7+", "Kd8", "Nxa8"],
    explanation: "From c7 the knight checks the king on e8 and attacks the rook on a8 at the same time.",
  },
  {
    title: "Pawn fork",
    goal: "Win material",
    fen: "6k1/8/2r1n3/8/3P4/8/8/6K1 w - - 0 1",
    solution: ["d5"],
    explanation: "The pawn on d5 attacks both the rook on c6 and the knight on e6; one of them falls.",
  },
  {
    title: "Rook skewer",
    goal: "Win the queen",
    fen: "8/8/8/8/q3k3/8/8/2K4R w - - 0 1",
    solution: ["Rh4+", "Kd5", "Rxa4"],
    explanation: "The check along the 4th rank forces the king off the line, exposing the queen behind it.",
  },
  {
    title: "Discovered check",
    goal: "Win the queen",
    fen: "4k3/5ppp/8/8/q3B3/8/5PPP/4R1K1 w - - 0 1",
    solution: ["Bc2+", "Kf8", "Bxa4"],
    explanation: "Moving the bishop uncovers a check from the rook on e1, and the bishop lands attacking the queen.",
  },
  {
    title: "Pin to the king",
    goal: "Win the queen",
    fen: "6k1/6pp/8/3q4/8/1P6/5PPP/5BK1 w - - 0 1",
    solution: ["Bc4", "Qxc4", "bxc4"],
    explanation: "The bishop pins the queen to the king on g8. The queen can only take the bishop, and the b3 pawn recaptures.",
  },
  {
    title: "Back rank overload",
    goal: "Mate in 2",
    fen: "4r1k1/3q1ppp/8/8/4Q3/8/5PPP/4R1K1 w - - 0 1",
    solution: ["Qxe8+", "Qxe8", "Rxe8#"],
    explanation: "The queen sacrifice drags Black's queen away, and the rook behind it delivers mate on the back rank.",
  },
];
