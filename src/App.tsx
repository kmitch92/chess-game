import { useState, useMemo, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import Engine from './engine';
import './App.css';
import {
  findBestMove,
  makeRandomMove,
  getMoveOptions,
  onDrop,
  onPromotionPieceSelect,
  onSquareClick,
  onSquareRightClick,
} from './chessboardUtils';

/*
TO-DO:
- support playing as black
- fix click on piece to show options - works sporadically
- fix promotion - works sporadically
- add analysis board
- add move history
- show won pieces for each side
- add win dialog
- fix game over alerts so that they show after the move
- fix game over alerts so that they are in the style of promotion dialog
 - separate functions into utils files
*/

const buttonStyle = {
  cursor: 'pointer',
  padding: '10px 20px',
  margin: '10px 10px 0px 0px',
  borderRadius: '6px',
  backgroundColor: '#f0d9b5',
  border: 'none',
  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.5)',
};

const boardWrapper = {
  width: `70vw`,
  maxWidth: '70vh',
  margin: '3rem auto',
};

export interface ISquaresOptions {
  [key: string]:
    | {
        background?: string;
        borderRadius?: string;
      }
    | undefined;
}

export interface ISquaresRightClicked {
  [key: string]:
    | {
        backgroundColor?: string;
      }
    | undefined;
}

function App() {
  const [stockfishLevel, setStockfishLevel] = useState(2);
  const levels = {
    'Random 🎲': 0,
    'Easy 🤓': 2,
    'Medium 🧐': 8,
    'Hard 😵': 18,
  };

  const engine = useMemo(() => new Engine(), []);
  const [game, setGame] = useState(new Chess());
  const [gamePosition, setGamePosition] = useState<string>(game.fen());

  const [playerTurn, setPlayerTurn] = useState<'w' | 'b'>('w');
  const [moveFrom, setMoveFrom] = useState<Square | null>(null);
  const [moveTo, setMoveTo] = useState<Square | null>(null);
  const [showPromotionDialog, setShowPromotionDialog] =
    useState<boolean>(false);
  const [rightClickedSquares, setRightClickedSquares] =
    useState<ISquaresRightClicked>({});
  const [moveSquares, setMoveSquares] = useState({});
  const [optionSquares, setOptionSquares] = useState<ISquaresOptions>({});

  useEffect(() => {
    if (game.isCheckmate()) {
      alert('Checkmate!');
    } else if (game.isDraw()) {
      alert('Draw!');
    } else if (game.isStalemate()) {
      alert('Stalemate!');
    } else if (game.isThreefoldRepetition()) {
      alert('Threefold Repetition!');
    } else if (game.isInsufficientMaterial()) {
      alert('Insufficient Material!');
    }
    if ((!game.isGameOver() || game.isDraw()) && playerTurn === 'b') {
      setTimeout(
        stockfishLevel === 0
          ? () => makeRandomMove(game, setGamePosition, setPlayerTurn)
          : () =>
              findBestMove(
                engine,
                stockfishLevel,
                game,
                setGamePosition,
                setPlayerTurn
              ),
        500
      );
    }
  }, [gamePosition, playerTurn]);

  useEffect(() => {
    console.log('LOGGER', { moveFrom, moveTo, moveSquares, optionSquares });
  }, [moveFrom, moveTo, moveSquares, optionSquares]);

  return (
    <div style={boardWrapper}>
      <h3>Stockfish Level: {stockfishLevel}</h3>
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
            key={level}
          >
            {level}
          </button>
        ))}
      </div>

      <Chessboard
        id="PlayVsStockfish"
        animationDuration={200}
        position={gamePosition}
        onSquareClick={(square) =>
          onSquareClick(
            game,
            square,
            moveFrom,
            moveTo,
            setMoveFrom,
            setMoveTo,
            setOptionSquares,
            setShowPromotionDialog,
            setGamePosition,
            setGame,
            setPlayerTurn
          )
        }
        onSquareRightClick={(square) =>
          onSquareRightClick(
            square,
            setRightClickedSquares,
            rightClickedSquares
          )
        }
        onPromotionPieceSelect={(piece) =>
          onPromotionPieceSelect(
            piece,
            game,
            moveTo,
            moveFrom,
            setMoveFrom,
            setMoveTo,
            setOptionSquares,
            setShowPromotionDialog,
            setGamePosition,
            setGame,
            setPlayerTurn
          )
        }
        onPieceDrop={(sourceSquare, targetSquare, piece) =>
          onDrop(
            sourceSquare,
            targetSquare,
            piece,
            game,
            setMoveFrom,
            setMoveTo,
            setShowPromotionDialog,
            setGamePosition,
            setPlayerTurn,
            setRightClickedSquares
          )
        }
        promotionToSquare={moveTo}
        showPromotionDialog={showPromotionDialog}
        promotionDialogVariant="modal"
        customBoardStyle={{
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
        }}
        customSquareStyles={{
          ...moveSquares,
          ...optionSquares,
          ...rightClickedSquares,
        }}
      />

      <button
        style={buttonStyle}
        onClick={() => {
          game.reset();
          setGamePosition(game.fen());
          setRightClickedSquares({});
          setMoveSquares({});
          setOptionSquares({});
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
          setMoveSquares({});
          setOptionSquares({});
          setRightClickedSquares({});
        }}
      >
        Undo
      </button>
    </div>
  );
}

export default App;
