import { useState, useMemo } from 'react';
import { Chess, Square, PieceSymbol } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import Engine from './engine';
import './App.css';

const buttonStyle = {
  cursor: 'pointer',
  padding: '10px 20px',
  margin: '10px 10px 0px 0px',
  borderRadius: '6px',
  backgroundColor: '#f0d9b5',
  border: 'none',
  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.5)',
};

// const inputStyle = {
//   padding: "10px 20px",
//   margin: "10px 0 10px 0",
//   borderRadius: "6px",
//   border: "none",
//   boxShadow: "0 2px 5px rgba(0, 0, 0, 0.5)",
//   width: "100%",
// };

const boardWrapper = {
  width: `70vw`,
  maxWidth: '70vh',
  margin: '3rem auto',
};

function App() {
  const levels = {
    'Easy 🤓': 2,
    'Medium 🧐': 8,
    'Hard 😵': 18,
  };
  const engine = useMemo(() => new Engine(), []);
  const game = useMemo(() => new Chess(), []);
  const [gamePosition, setGamePosition] = useState(game.fen());
  const [stockfishLevel, setStockfishLevel] = useState(2);
  function findBestMove() {
    engine.evaluatePosition(game.fen(), stockfishLevel);
    engine.onMessage(({ bestMove }) => {
      if (bestMove) {
        // In latest chess.js versions you can just write ```game.move(bestMove)```
        game.move({
          from: bestMove.substring(0, 2),
          to: bestMove.substring(2, 4),
          promotion: bestMove.substring(4, 5),
        });
        setGamePosition(game.fen());
      }
    });
  }

  function onDrop(
    sourceSquare: Square,
    targetSquare: Square,
    piece: PieceSymbol
  ): boolean {
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: piece[1].toLowerCase() ?? 'q',
    });
    setGamePosition(game.fen());

    // illegal move
    if (move === null) return false;

    // exit if the game is over
    if (game.isGameOver() || game.isDraw()) return false;
    findBestMove();
    return true;
  }
  return (
    <div style={boardWrapper}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        {Object.entries(levels).map(([level, depth]) => (
          <button
            style={{
              ...buttonStyle,
              backgroundColor: depth === stockfishLevel ? '#B58863' : '#f0d9b5',
            }}
            onClick={() => setStockfishLevel(depth)}
          >
            {level}
          </button>
        ))}
      </div>

      <Chessboard
        id="PlayVsStockfish"
        position={gamePosition}
        // @ts-ignore
        onPieceDrop={onDrop}
      />

      <button
        style={buttonStyle}
        onClick={() => {
          game.reset();
          setGamePosition(game.fen());
        }}
      >
        New game
      </button>
      <button
        style={buttonStyle}
        onClick={() => {
          game.undo();
          game.undo();
          setGamePosition(game.fen());
        }}
      >
        Undo
      </button>
    </div>
  );
}

export default App;
