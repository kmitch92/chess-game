import { useState, useMemo, useEffect } from 'react';
import { Chess, Square, PieceSymbol } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import Engine from './engine';
import './App.css';

// let compiledStockfish: any;
// WebAssembly.instantiateStreaming(fetch('stockfish.wasm.js')).then((results) => {
//   compiledStockfish = results.instance.exports;
// });

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
  const [playerTurn, setPlayerTurn] = useState('w');

  function findBestMove() {
    engine.evaluatePosition(game.fen(), stockfishLevel);
    engine.onMessage((message) => {
      console.log('in findBestMove', message);
      if (message.bestMove) {
        // In latest chess.js versions you can just write ```game.move(message.bestMove)```
        game.move({
          from: message.bestMove.substring(0, 2),
          to: message.bestMove.substring(2, 4),
          promotion: message.bestMove.substring(4, 5),
        });
        setGamePosition(game.fen());
        setPlayerTurn('w');
      }
    });
  }

  useEffect(() => {
    const stockfish = new Worker('stockfish.js');
    const DEPTH = 8; // number of halfmoves the engine looks ahead
    const FEN_POSITION =
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    stockfish.postMessage('uci');
    stockfish.postMessage(`position fen ${FEN_POSITION}`);
    stockfish.postMessage(`go depth ${DEPTH}`);

    stockfish.onmessage = (e) => {
      // console.log(e.data); // in the console output you will see `bestmove e2e4` message
    };
  }, []);

  useEffect(() => {
    console.log(gamePosition);
    if ((!game.isGameOver() || game.isDraw()) && playerTurn === 'b') {
      setTimeout(findBestMove, 1000);
      // findBestMove();
    }
  }, [gamePosition, playerTurn]);

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
    setPlayerTurn('b');
    return true;
    // // exit if the game is over
    // if (game.isGameOver() || game.isDraw()) return false;
    // findBestMove();
    // return true;
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
