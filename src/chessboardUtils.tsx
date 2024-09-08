import { Chess, Square } from 'chess.js';
import Engine from './engine';
import { TcbPiece, TcbSquare } from './types';
import { ISquaresOptions, ISquaresRightClicked } from './App';
import { PromotionPieceOption } from 'react-chessboard/dist/chessboard/types';

export const findBestMove = (
  engine: Engine,
  stockfishLevel: number,
  game: Chess,
  setGamePosition: (value: React.SetStateAction<string>) => void,
  setPlayerTurn: (value: React.SetStateAction<'w' | 'b'>) => void
): void => {
  engine.evaluatePosition(game.fen(), stockfishLevel);
  engine.onMessage((message) => {
    if (message.bestMove) {
      game.move({
        from: message.bestMove.substring(0, 2),
        to: message.bestMove.substring(2, 4),
        promotion: message.bestMove.substring(4, 5),
      });
      setGamePosition(game.fen());
      setPlayerTurn('w');
    }
  });
};

export const makeRandomMove = (
  game: Chess,
  setGamePosition: (value: React.SetStateAction<string>) => void,
  setPlayerTurn: (value: React.SetStateAction<'w' | 'b'>) => void
): void => {
  const possibleMoves = game.moves();
  // exit if the game is over
  if (game.isGameOver() || game.isDraw() || possibleMoves.length === 0) return;
  const randomIndex = Math.floor(Math.random() * possibleMoves.length);
  game.move(possibleMoves[randomIndex]);
  setGamePosition(game.fen());
  setPlayerTurn('w');
};

export const getMoveOptions = (
  game: Chess,
  square: Square,
  setOptionSquares: (value: React.SetStateAction<ISquaresOptions>) => void
) => {
  const moves = game.moves({
    square,
    verbose: true,
  });
  if (moves.length === 0) {
    setOptionSquares({});
    return false;
  }
  const newSquares: ISquaresOptions = {};
  moves.map((move) => {
    newSquares[move.to] = {
      background:
        game.get(move.to) && game.get(move.to).color !== game.get(square).color
          ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
          : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
      borderRadius: '50%',
    };
    return move;
  });
  newSquares[square] = {
    background: 'rgba(255, 255, 0, 0.4)',
  };
  setOptionSquares(newSquares);
  return true;
};

export const onSquareClick = (
  game: Chess,
  square: Square,
  moveFrom: Square | null,
  moveTo: Square | null,
  setMoveFrom: (value: React.SetStateAction<Square | null>) => void,
  setMoveTo: (value: React.SetStateAction<Square | null>) => void,
  setOptionSquares: (value: React.SetStateAction<ISquaresOptions>) => void,
  setShowPromotionDialog: (value: React.SetStateAction<boolean>) => void,
  setGamePosition: (value: React.SetStateAction<string>) => void,
  setGame: (value: React.SetStateAction<Chess>) => void,
  setPlayerTurn: (value: React.SetStateAction<'w' | 'b'>) => void
): void => {
  // from square
  if (!moveFrom) {
    const hasMoveOptions = getMoveOptions(game, square, setOptionSquares);
    if (hasMoveOptions) setMoveFrom(square);
    return;
  }
  if (moveFrom === square) {
    setMoveFrom(null);
    setOptionSquares({});
    return;
  }
  // to square
  if (!moveTo) {
    // check if valid move before showing dialog
    const moves = game.moves({
      square: moveFrom,
      verbose: true,
    });
    const foundMove = moves.find((m) => m.from === moveFrom && m.to === square);
    // not a valid move
    if (!foundMove) {
      // check if clicked on new piece
      const hasMoveOptions = getMoveOptions(game, square, setOptionSquares);
      // if new piece, setMoveFrom, otherwise clear moveFrom
      setMoveFrom(hasMoveOptions ? square : null);
      return;
    }
    // valid move
    setMoveTo(square);
    // if promotion move
    if (
      (foundMove.color === 'w' &&
        foundMove.piece === 'p' &&
        square[1] === '8') ||
      (foundMove.color === 'b' && foundMove.piece === 'p' && square[1] === '1')
    ) {
      setShowPromotionDialog(true);
      return;
    }
    // is normal move
    const gameCopy = Object.assign(
      Object.create(Object.getPrototypeOf(game)),
      game
    );
    const move = gameCopy.move({
      from: moveFrom,
      to: square,
      promotion: '',
    });
    // if invalid, setMoveFrom and getMoveOptions
    if (move === null) {
      const hasMoveOptions = getMoveOptions(game, square, setOptionSquares);
      if (hasMoveOptions) setMoveFrom(square);
      return;
    }
    setGamePosition(gameCopy.fen());
    setGame(gameCopy);
    setPlayerTurn('b');
    setMoveFrom(null);
    setMoveTo(null);
    setOptionSquares({});
    return;
  }
};

export const onPromotionPieceSelect = (
  piece: PromotionPieceOption | undefined,
  game: Chess,
  moveTo: TcbSquare | null,
  moveFrom: TcbSquare | null,
  setMoveFrom: (value: React.SetStateAction<Square | null>) => void,
  setMoveTo: (value: React.SetStateAction<Square | null>) => void,
  setOptionSquares: (value: React.SetStateAction<ISquaresOptions>) => void,
  setShowPromotionDialog: (value: React.SetStateAction<boolean>) => void,
  setGamePosition: (value: React.SetStateAction<string>) => void,
  setGame: (value: React.SetStateAction<Chess>) => void,
  setPlayerTurn: (value: React.SetStateAction<'w' | 'b'>) => void
) => {
  // if no piece passed then user has cancelled dialog, don't make move and reset
  if (piece) {
    const gameCopy = Object.assign(
      Object.create(Object.getPrototypeOf(game)),
      game
    );

    gameCopy.move({
      from: moveFrom as string,
      to: moveTo as string,
      promotion: piece[1].toLowerCase() ?? 'q',
    });
    setGamePosition(gameCopy.fen());
    setGame(gameCopy);
    setPlayerTurn('b');
  }
  setMoveFrom(null);
  setMoveTo(null);
  setShowPromotionDialog(false);
  setOptionSquares({});
  return true;
};

export const onSquareRightClick = (
  square: Square,
  setRightClickedSquares: (
    value: React.SetStateAction<ISquaresRightClicked>
  ) => void,
  rightClickedSquares: ISquaresRightClicked
): void => {
  const colour = 'rgba(0, 0, 255, 0.4)';
  setRightClickedSquares({
    ...rightClickedSquares,
    [square]:
      rightClickedSquares[square] &&
      rightClickedSquares[square]?.backgroundColor === colour
        ? undefined
        : {
            backgroundColor: colour,
          },
  });
};

export const onDrop = (
  sourceSquare: Square,
  targetSquare: Square,
  piece: TcbPiece,
  game: Chess,
  setMoveFrom: (value: React.SetStateAction<Square | null>) => void,
  setMoveTo: (value: React.SetStateAction<Square | null>) => void,
  setShowPromotionDialog: (value: React.SetStateAction<boolean>) => void,
  setGamePosition: (value: React.SetStateAction<string>) => void,
  setPlayerTurn: (value: React.SetStateAction<'w' | 'b'>) => void,
  setRightClickedSquares: (
    value: React.SetStateAction<ISquaresRightClicked>
  ) => void,
  setOptionSquares: (value: React.SetStateAction<ISquaresOptions>) => void
) => {
  setMoveFrom(sourceSquare);
  setMoveTo(targetSquare);
  if (
    (piece.substring(0, 1) === 'w' &&
      piece.substring(1, 2) === 'p' &&
      targetSquare.substring(1, 2) === '8') ||
    (piece.substring(0, 1) === 'b' &&
      piece.substring(1, 2) === 'p' &&
      targetSquare.substring(1, 2) === '1')
  ) {
    console.log('hitting promotion');
    setShowPromotionDialog(true);
    return true;
  }

  const move = game.move({
    from: sourceSquare,
    to: targetSquare,
    promotion: piece.toLowerCase() ?? 'q',
  });
  setGamePosition(game.fen());

  // illegal move
  if (move === null) return false;
  setRightClickedSquares({});
  setPlayerTurn('b');
  setMoveFrom(null);
  setMoveTo(null);
  setOptionSquares({});
  return true;
};
