
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ArrowLeft, Brain, CheckCircle2, Crown, Loader2, RefreshCw, Target, Settings, MessageSquare, Play, Trophy, Frown, Sparkles, Rewind, FastForward, TrendingUp, Shield, Repeat, Flag, AlertTriangle, Check, X, Wifi, WifiOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getChessCoachFeedback, getXiangqiMoveCommentary, ChessFeedback } from '../services/gemini';
import { AI_PROVIDER } from '../config';

// --- XIANGQI LOGIC & ENGINE ---

type Color = 'r' | 'b'; // Red (User, Bottom), Black (AI, Top)
type PieceType = 'k' | 'a' | 'b' | 'n' | 'r' | 'c' | 'p'; 

interface Piece {
  type: PieceType;
  color: Color;
  id: string;
}

interface Position {
  x: number;
  y: number;
}

interface MoveRecord {
    from: Position;
    to: Position;
    desc: string;
    color: Color;
}

// Engine Constants
const PIECE_VALUES: Record<string, number> = {
    'k': 10000,
    'r': 90,
    'c': 45,
    'n': 40,
    'b': 20,
    'a': 20,
    'p': 10
};

// --- ELO & RANKING LOGIC ---

const getRankTitle = (elo: number) => {
    if (elo < 1000) return "初学乍练";
    if (elo < 1100) return "业余九级";
    if (elo < 1200) return "业余八级";
    if (elo < 1300) return "业余七级";
    if (elo < 1400) return "业余五级";
    if (elo < 1500) return "业余三级";
    if (elo < 1600) return "业余一级";
    if (elo < 1800) return "地方大师";
    return "特级大师";
};

const calculateEloChange = (playerElo: number, aiElo: number, result: 'win' | 'loss' | 'draw') => {
    const K = 40; // Volatility factor (higher for faster adjustment)
    const expectedScore = 1 / (1 + Math.pow(10, (aiElo - playerElo) / 400));
    const actualScore = result === 'win' ? 1 : result === 'loss' ? 0 : 0.5;
    const change = Math.round(K * (actualScore - expectedScore));
    return change;
};

// --- BOARD SETUP ---

const setupBoard = () => {
  const newBoard = Array(10).fill(null).map(() => Array(9).fill(null));
  const place = (type: PieceType, color: Color, x: number, y: number) => {
    newBoard[y][x] = { type, color, id: `${color}-${type}-${x}-${y}` };
  };

  // Rooks
  place('r', 'b', 0, 0); place('r', 'b', 8, 0);
  place('r', 'r', 0, 9); place('r', 'r', 8, 9);
  // Knights
  place('n', 'b', 1, 0); place('n', 'b', 7, 0);
  place('n', 'r', 1, 9); place('n', 'r', 7, 9);
  // Bishops (Elephants)
  place('b', 'b', 2, 0); place('b', 'b', 6, 0);
  place('b', 'r', 2, 9); place('b', 'r', 6, 9);
  // Advisors
  place('a', 'b', 3, 0); place('a', 'b', 5, 0);
  place('a', 'r', 3, 9); place('a', 'r', 5, 9);
  // Kings
  place('k', 'b', 4, 0);
  place('k', 'r', 4, 9);
  // Cannons
  place('c', 'b', 1, 2); place('c', 'b', 7, 2);
  place('c', 'r', 1, 7); place('c', 'r', 7, 7);
  // Pawns
  [0, 2, 4, 6, 8].forEach(x => {
    place('p', 'b', x, 3);
    place('p', 'r', x, 6);
  });

  return newBoard;
};

// Helper to replay move pure
const applyMoveToBoard = (board: (Piece|null)[][], move: MoveRecord) => {
    const newBoard = board.map(row => row.map(p => p ? {...p} : null));
    newBoard[move.to.y][move.to.x] = newBoard[move.from.y][move.from.x];
    newBoard[move.from.y][move.from.x] = null;
    return newBoard;
};

// --- MOVE VALIDATION ---

const countObstacles = (board: (Piece|null)[][], from: Position, to: Position) => {
  let count = 0;
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  let x = from.x + dx;
  let y = from.y + dy;
  while (x !== to.x || y !== to.y) {
    if (board[y][x]) count++;
    x += dx;
    y += dy;
  }
  return count;
};

const isPathClear = (board: (Piece|null)[][], from: Position, to: Position) => {
  return countObstacles(board, from, to) === 0;
};

const isValidMoveBasic = (board: (Piece|null)[][], from: Position, to: Position, turn: Color): boolean => {
  const piece = board[from.y][from.x];
  const target = board[to.y][to.x];

  if (!piece) return false;
  if (piece.color !== turn) return false;
  if (target && target.color === turn) return false; 
  if (from.x === to.x && from.y === to.y) return false;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (to.x < 0 || to.x > 8 || to.y < 0 || to.y > 9) return false;

  switch (piece.type) {
    case 'r': // Rook
      if (dx !== 0 && dy !== 0) return false;
      return isPathClear(board, from, to);
    case 'n': // Knight
      if (!((absDx === 1 && absDy === 2) || (absDx === 2 && absDy === 1))) return false;
      if (absDx === 2) { if (board[from.y][from.x + dx/2]) return false; }
      else { if (board[from.y + dy/2][from.x]) return false; }
      return true;
    case 'c': // Cannon
      if (dx !== 0 && dy !== 0) return false;
      const count = countObstacles(board, from, to);
      if (target) return count === 1; 
      return count === 0; 
    case 'p': // Pawn
      if (piece.color === 'r') {
        if (dy > 0) return false; 
        if (from.y > 4) return dy === -1 && dx === 0;
        else return (dy === -1 && dx === 0) || (dy === 0 && absDx === 1);
      } else {
        if (dy < 0) return false;
        if (from.y < 5) return dy === 1 && dx === 0;
        else return (dy === 1 && dx === 0) || (dy === 0 && absDx === 1);
      }
    case 'k': // King
      if (to.x < 3 || to.x > 5) return false;
      if (piece.color === 'r' && to.y < 7) return false;
      if (piece.color === 'b' && to.y > 2) return false;
      return (absDx + absDy === 1);
    case 'a': // Advisor
      if (to.x < 3 || to.x > 5) return false;
      if (piece.color === 'r' && to.y < 7) return false;
      if (piece.color === 'b' && to.y > 2) return false;
      return (absDx === 1 && absDy === 1);
    case 'b': // Bishop
      if (piece.color === 'r' && to.y < 5) return false;
      if (piece.color === 'b' && to.y > 4) return false;
      if (absDx !== 2 || absDy !== 2) return false;
      if (board[from.y + dy/2][from.x + dx/2]) return false;
      return true;
  }
  return false;
};

// Check if King is in Check
const isKingInDanger = (board: (Piece|null)[][], kingColor: Color): boolean => {
  let kingPos: Position | null = null;
  const enemyColor = kingColor === 'r' ? 'b' : 'r';

  // Find King
  for (let y=0; y<10; y++) {
    for (let x=0; x<9; x++) {
       const p = board[y][x];
       if (p && p.type === 'k' && p.color === kingColor) {
         kingPos = {x,y}; break;
       }
    }
    if (kingPos) break;
  }
  if (!kingPos) return true; // Captured

  // Flying General
  let enemyKingPos: Position | null = null;
  for (let y=0; y<10; y++) {
    for (let x=0; x<9; x++) {
       const p = board[y][x];
       if (p && p.type === 'k' && p.color === enemyColor) {
         enemyKingPos = {x,y}; break;
       }
    }
    if (enemyKingPos) break;
  }
  if (enemyKingPos && enemyKingPos.x === kingPos.x) {
      if (isPathClear(board, kingPos, enemyKingPos)) return true;
  }

  // Attacks
  for (let y=0; y<10; y++) {
    for (let x=0; x<9; x++) {
      const p = board[y][x];
      if (p && p.color === enemyColor) {
        if (isValidMoveBasic(board, {x,y}, kingPos, enemyColor)) return true;
      }
    }
  }
  return false;
};

const isLegalMove = (board: (Piece|null)[][], from: Position, to: Position, turn: Color): boolean => {
    if (!isValidMoveBasic(board, from, to, turn)) return false;
    const tempBoard = board.map(row => row.map(p => p)); // Shallow copy rows
    tempBoard[to.y][to.x] = tempBoard[from.y][from.x];
    tempBoard[from.y][from.x] = null;
    if (isKingInDanger(tempBoard, turn)) return false;
    return true;
};

// --- MINIMAX AI ENGINE ---

// Simple board evaluation
const evaluateBoard = (board: (Piece|null)[][]): number => {
    let score = 0;
    for (let y=0; y<10; y++) {
        for (let x=0; x<9; x++) {
            const p = board[y][x];
            if (p) {
                let val = PIECE_VALUES[p.type];
                
                // Position Heuristics
                if (p.type === 'p') {
                    // Pawn crossing river increases value
                    if (p.color === 'b' && y > 4) val += 10;
                    if (p.color === 'r' && y < 5) val += 10;
                    // Closer to general
                    if (p.color === 'b' && y > 6) val += 10;
                }
                
                if (p.type === 'c' || p.type === 'r') {
                   // Central control
                   if (x === 4) val += 10;
                }

                score += p.color === 'b' ? val : -val;
            }
        }
    }
    return score;
};

// Generate all pseudo-legal moves for a side
const generateMoves = (board: (Piece|null)[][], turn: Color) => {
    const moves: {from: Position, to: Position}[] = [];
    for (let y=0; y<10; y++) {
        for (let x=0; x<9; x++) {
            const p = board[y][x];
            if (p && p.color === turn) {
                // Optimization: Instead of checking 90 squares, we check probable moves
                // (Simplified for react performance: iterating 90 squares is actually fast enough for JS)
                for (let ty=0; ty<10; ty++) {
                    for (let tx=0; tx<9; tx++) {
                        if (isValidMoveBasic(board, {x,y}, {x:tx, y:ty}, turn)) {
                            // Check King Safety here? Or defer?
                            // Defering makes tree search faster but validation slower. 
                            // Let's filter invalid moves here to prune tree early.
                             const tempBoard = board.map(r => [...r]);
                             tempBoard[ty][tx] = tempBoard[y][x];
                             tempBoard[y][x] = null;
                             if (!isKingInDanger(tempBoard, turn)) {
                                 moves.push({from: {x,y}, to: {x:tx, y:ty}});
                             }
                        }
                    }
                }
            }
        }
    }
    // Optimization: Sort moves (Captures first) for Alpha-Beta
    moves.sort((a, b) => {
        const targetA = board[a.to.y][a.to.x];
        const targetB = board[b.to.y][b.to.x];
        const valA = targetA ? PIECE_VALUES[targetA.type] : 0;
        const valB = targetB ? PIECE_VALUES[targetB.type] : 0;
        return valB - valA;
    });
    return moves;
};

const minimax = (
    board: (Piece|null)[][], 
    depth: number, 
    alpha: number, 
    beta: number, 
    isMaximizing: boolean
): number => {
    if (depth === 0) return evaluateBoard(board);

    const turn = isMaximizing ? 'b' : 'r';
    const moves = generateMoves(board, turn);

    if (moves.length === 0) {
        return isMaximizing ? -100000 : 100000; // Checkmate
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const newBoard = board.map(r => [...r]);
            newBoard[move.to.y][move.to.x] = newBoard[move.from.y][move.from.x];
            newBoard[move.from.y][move.from.x] = null;

            const evalNum = minimax(newBoard, depth - 1, alpha, beta, false);
            maxEval = Math.max(maxEval, evalNum);
            alpha = Math.max(alpha, evalNum);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            const newBoard = board.map(r => [...r]);
            newBoard[move.to.y][move.to.x] = newBoard[move.from.y][move.from.x];
            newBoard[move.from.y][move.from.x] = null;

            const evalNum = minimax(newBoard, depth - 1, alpha, beta, true);
            minEval = Math.min(minEval, evalNum);
            beta = Math.min(beta, evalNum);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};

// --- HELPER ---
const getPieceName = (t?: PieceType, c?: Color) => {
    if (!t) return '';
    const mapB: any = { 'k': '将', 'a': '士', 'b': '象', 'n': '马', 'r': '车', 'c': '炮', 'p': '卒' };
    const mapR: any = { 'k': '帅', 'a': '仕', 'b': '相', 'n': '马', 'r': '车', 'c': '炮', 'p': '兵' };
    return c === 'b' ? mapB[t] : mapR[t];
};

// --- BOARD VIEW COMPONENT (Reusable) ---

interface BoardViewProps {
    board: (Piece | null)[][];
    selected?: Position | null;
    possibleMoves?: Position[];
    onSquareClick?: (x: number, y: number) => void;
    highlightFrom?: Position | null;
    highlightTo?: Position | null;
    isInteractive?: boolean;
}

const BoardView: React.FC<BoardViewProps> = ({ 
    board, selected, possibleMoves = [], onSquareClick, highlightFrom, highlightTo, isInteractive = false 
}) => {
    // Flatten pieces for animation - Stable ID allows CSS transitions to work
    const pieces = useMemo(() => {
        const list: Array<Piece & Position> = [];
        board.forEach((row, y) => row.forEach((p, x) => {
            if(p) list.push({...p, x, y});
        }));
        return list;
    }, [board]);

    return (
        <div className="relative p-3 bg-[#eecfa1] rounded-lg shadow-inner border-4 border-[#8b5a2b] select-none mx-auto"> 
            <div className="relative w-[280px] h-[312px]">
                {/* 1. Board Lines (Background) */}
                <div className="absolute inset-0 border-2 border-[#8b5a2b] pointer-events-none z-0">
                    {Array.from({length: 8}).map((_, i) => (
                        <div key={`h-${i}`} className="absolute w-full h-px bg-[#8b5a2b]" style={{ top: `${(i+1) * 11.11}%` }} />
                    ))}
                    {Array.from({length: 7}).map((_, i) => (
                        <div key={`v-${i}`} className="absolute h-[44.44%] w-px bg-[#8b5a2b]" style={{ left: `${(i+1) * 12.5}%`, top: 0 }} />
                    ))}
                    {Array.from({length: 7}).map((_, i) => (
                        <div key={`v2-${i}`} className="absolute h-[44.44%] w-px bg-[#8b5a2b]" style={{ left: `${(i+1) * 12.5}%`, bottom: 0 }} />
                    ))}
                    <div className="absolute w-[25%] h-[22.22%] left-[37.5%] top-0 border-[#8b5a2b]">
                        <div className="absolute w-full h-px bg-[#8b5a2b] top-1/2 -rotate-45" />
                        <div className="absolute w-full h-px bg-[#8b5a2b] top-1/2 rotate-45" />
                    </div>
                    <div className="absolute w-[25%] h-[22.22%] left-[37.5%] bottom-0 border-[#8b5a2b]">
                        <div className="absolute w-full h-px bg-[#8b5a2b] top-1/2 -rotate-45" />
                        <div className="absolute w-full h-px bg-[#8b5a2b] top-1/2 rotate-45" />
                    </div>
                </div>

                {/* 2. Grid Interactivity & Highlights (Z-index 10) */}
                {Array.from({length: 10}).map((_, y) => 
                    Array.from({length: 9}).map((_, x) => {
                        const isSelected = selected?.x === x && selected?.y === y;
                        const isPossible = isInteractive && possibleMoves.some(p => p.x === x && p.y === y);
                        const isHighlightFrom = highlightFrom?.x === x && highlightFrom?.y === y;
                        const isHighlightTo = highlightTo?.x === x && highlightTo?.y === y;
                        
                        return (
                            <div 
                                key={`cell-${x}-${y}`}
                                onClick={() => isInteractive && onSquareClick && onSquareClick(x, y)}
                                className={`absolute w-[14%] h-[12%] flex items-center justify-center z-10 ${isInteractive ? 'cursor-pointer' : ''}`}
                                style={{ left: `${x * 12.5 - 7}%`, top: `${y * 11.11 - 6}%` }}
                            >
                                {isHighlightFrom && <div className="absolute inset-0 bg-yellow-500/40 rounded-full scale-95 border-2 border-yellow-400 animate-pulse" />}
                                {isHighlightTo && (
                                    <>
                                        <div className="absolute inset-0 bg-blue-500/40 rounded-full scale-95 border-2 border-blue-400 animate-pulse" />
                                        <div className="absolute top-0 right-0 -mt-1 -mr-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm z-20">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                        </div>
                                    </>
                                )}
                                {isPossible && (
                                    <div className="w-3 h-3 bg-blue-500/50 rounded-full animate-pulse pointer-events-none ring-2 ring-blue-300/30" />
                                )}
                                {isSelected && (
                                    <div className="absolute inset-0 ring-2 ring-blue-500 rounded-full scale-110 z-0 pointer-events-none" />
                                )}
                            </div>
                        );
                    })
                )}

                {/* 3. Pieces Layer (Z-index 20) - Uses stable IDs for animation */}
                {pieces.map((piece) => (
                    <div 
                        key={piece.id}
                        className={`absolute w-[14%] h-[12%] flex items-center justify-center z-20 transition-all duration-300 ease-in-out ${isInteractive ? 'cursor-pointer' : ''}`}
                        style={{ left: `${piece.x * 12.5 - 7}%`, top: `${piece.y * 11.11 - 6}%` }}
                        onClick={() => isInteractive && onSquareClick && onSquareClick(piece.x, piece.y)}
                    >
                        <div className={`w-[85%] aspect-square rounded-full border-2 flex items-center justify-center shadow-md bg-[#f0d5b0] relative
                            ${piece.color === 'r' ? 'border-red-600 text-red-600' : 'border-black text-black'}
                        `}>
                            <span className="font-bold text-sm sm:text-base leading-none select-none">
                                {getPieceName(piece.type, piece.color)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- XIANGQI GAME COMPONENT ---
// (No changes to XiangqiGame component logic)
interface XiangqiGameProps {
  onGameOver: (result: 'win' | 'loss', history: MoveRecord[]) => void;
  onRestart: () => void;
  userElo: number;
  initialMoves?: MoveRecord[];
}

const XiangqiGame: React.FC<XiangqiGameProps> = ({ onGameOver, onRestart, userElo, initialMoves }) => {
  const [board, setBoard] = useState<(Piece | null)[][]>(() => {
      let b = setupBoard();
      if (initialMoves) {
          initialMoves.forEach(m => { b = applyMoveToBoard(b, m); });
      }
      return b;
  });
  const [moves, setMoves] = useState<MoveRecord[]>(initialMoves || []);
  const [turn, setTurn] = useState<Color>(() => {
      return (initialMoves?.length || 0) % 2 === 0 ? 'r' : 'b';
  });

  const [selected, setSelected] = useState<Position | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [coachComment, setCoachComment] = useState<string>("来吧，让我看看你的实力。");
  const [isCoachThinking, setIsCoachThinking] = useState(false);
  const [gameOverResult, setGameOverResult] = useState<'win' | 'loss' | null>(null);
  
  const [confirmState, setConfirmState] = useState<'none' | 'restart' | 'resign'>('none');

  useEffect(() => {
      if (confirmState !== 'none') {
          const timer = setTimeout(() => setConfirmState('none'), 3000);
          return () => clearTimeout(timer);
      }
  }, [confirmState]);

  const boardToFen = (b: (Piece | null)[][]) => {
    return b.map(row => row.map(p => p ? `${p.color}${p.type}` : '.').join('')).join('/');
  };

  const executeMove = useCallback((from: Position, to: Position, isAi: boolean) => {
    const fromPiece = board[from.y][from.x];
    const targetPiece = board[to.y][to.x];
    if (!fromPiece) return;

    const moveDesc = `${fromPiece.color === 'r' ? '红' : '黑'}${getPieceName(fromPiece.type, fromPiece.color)}${from.x}->${to.x}`;
    const moveRecord: MoveRecord = { from, to, desc: moveDesc, color: fromPiece.color };

    let isOver = false;
    let result: 'win' | 'loss' | null = null;
    
    if (targetPiece && targetPiece.type === 'k') {
        isOver = true;
        result = targetPiece.color === 'b' ? 'win' : 'loss';
    }

    const newBoard = applyMoveToBoard(board, moveRecord);
    setBoard(newBoard);

    const newMoves = [...moves, moveRecord];
    setMoves(newMoves);
    
    if (!isAi && fromPiece.color === 'r') {
        setIsCoachThinking(true);
        getXiangqiMoveCommentary(boardToFen(newBoard), moveDesc).then(comment => {
            setCoachComment(comment);
            setIsCoachThinking(false);
        }).catch(() => setIsCoachThinking(false));
    } else if (isAi) {
        setCoachComment("轮到你了。");
    }
    
    if (isOver && result) {
        setGameOverResult(result);
        onGameOver(result, newMoves);
    } else {
        setTurn(prev => prev === 'r' ? 'b' : 'r');
    }
    
    setAiThinking(false);
    setSelected(null);
  }, [board, moves, onGameOver]);

  const makeAiMove = useCallback(() => {
    let depth = 2; 
    let randomFactor = 0.3;

    if (userElo < 1000) { depth = 2; randomFactor = 0.3; } 
    else if (userElo < 1200) { depth = 2; randomFactor = 0.1; } 
    else if (userElo < 1400) { depth = 3; randomFactor = 0.05; } 
    else { depth = 3; randomFactor = 0.0; }
    
    const possibleMoves = generateMoves(board, 'b');

    if (possibleMoves.length === 0) {
        setGameOverResult('win');
        onGameOver('win', moves);
        setAiThinking(false);
        return;
    }
    
    const scoredMoves = possibleMoves.map(move => {
        const tempBoard = applyMoveToBoard(board, { ...move, desc: '', color: 'b' });
        const val = minimax(tempBoard, depth - 1, -Infinity, Infinity, false);
        return { move, val };
    });

    scoredMoves.sort((a, b) => b.val - a.val);

    let finalMove = scoredMoves[0].move; 

    if (Math.random() < randomFactor && scoredMoves.length > 1) {
        const candidatePool = scoredMoves.slice(0, Math.min(5, scoredMoves.length));
        const randomIdx = Math.floor(Math.random() * candidatePool.length);
        finalMove = candidatePool[randomIdx].move;
    }
    
    executeMove(finalMove.from, finalMove.to, true);

  }, [board, userElo, executeMove, moves, onGameOver]);

  useEffect(() => {
    if (turn === 'b' && !gameOverResult) {
      setAiThinking(true);
      const timer = setTimeout(() => {
        makeAiMove();
      }, 200); 
      return () => clearTimeout(timer);
    }
  }, [turn, gameOverResult, makeAiMove]);

  const handleSquareClick = (x: number, y: number) => {
    if (gameOverResult || turn === 'b' || aiThinking) return;

    const clickedPiece = board[y][x];

    if (clickedPiece && clickedPiece.color === turn) {
      setSelected({ x, y });
      return;
    }

    if (selected) {
      if (isLegalMove(board, selected, { x, y }, turn)) {
        executeMove(selected, { x, y }, false);
      } else {
        if (!clickedPiece) setSelected(null); 
      }
    }
  };

  const handleRestartClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirmState === 'restart') {
          onRestart();
          setConfirmState('none');
      } else {
          setConfirmState('restart');
      }
  };

  const handleResignClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirmState === 'resign') {
          onGameOver('loss', moves);
          setConfirmState('none');
      } else {
          setConfirmState('resign');
      }
  };

  const lastMove = moves.length > 0 ? moves[moves.length - 1] : null;

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <div className="flex flex-col md:flex-row gap-4">
        <BoardView 
            board={board} 
            selected={selected} 
            isInteractive={true}
            onSquareClick={handleSquareClick}
            highlightFrom={lastMove?.from}
            highlightTo={lastMove?.to}
        />
      </div>

      <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700">
         <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
             <Brain size={12} /> 实时点评 (Mirror)
         </div>
         <div className="text-sm text-gray-200 min-h-[40px] flex items-center">
            {isCoachThinking ? <span className="flex items-center gap-2 text-gray-500"><Loader2 size={12} className="animate-spin" /> 分析中...</span> : coachComment}
         </div>
      </div>
      
      <div className="flex justify-between items-center px-1">
          <div className="text-xs font-bold text-gray-400">
              {aiThinking ? <span className="flex items-center gap-1 text-blue-400"><Loader2 size={10} className="animate-spin" /> AI 思考中...</span> : 
               turn === 'r' ? <span className="text-red-400 animate-pulse">🔴 你的回合</span> : "⚫ 等待对手"}
          </div>
          {lastMove && !aiThinking && (
              <div className="text-xs text-gray-400 font-mono">
                  上一步: {lastMove.desc}
              </div>
          )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
           <button 
            onClick={handleRestartClick}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition active:scale-95 ${
                confirmState === 'restart' 
                ? 'bg-yellow-600 border-yellow-500 text-white animate-pulse' 
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
            }`}
           >
               {confirmState === 'restart' ? (
                   <>确认重来?</>
               ) : (
                   <><RefreshCw size={16} /> 重来</>
               )}
           </button>
           <button 
            onClick={handleResignClick}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition active:scale-95 ${
                confirmState === 'resign' 
                ? 'bg-red-700 border-red-600 text-white animate-pulse' 
                : 'bg-red-900/20 hover:bg-red-900/30 text-red-400 border-red-900/30'
            }`}
           >
               {confirmState === 'resign' ? (
                   <>确认认输?</>
               ) : (
                   <><Flag size={16} /> 认输</>
               )}
           </button>
      </div>
    </div>
  );
};

// --- MAIN WRAPPER COMPONENT ---

const ChessPractice: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'playing' | 'analyzing'>('playing');
  
  // ELO State
  const [userElo, setUserElo] = useState<number>(() => {
      try { return parseInt(localStorage.getItem('chess_user_elo') || '1200'); } catch { return 1200; }
  });
  const [eloChange, setEloChange] = useState<number>(0);

  const [analysis, setAnalysis] = useState<string>('');
  const [lastGameResult, setLastGameResult] = useState<'win' | 'loss' | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [replayHistory, setReplayHistory] = useState<MoveRecord[]>([]);
  const [practiceMoves, setPracticeMoves] = useState<MoveRecord[] | undefined>(undefined);
  const [criticalMoveIndex, setCriticalMoveIndex] = useState<number>(-1);

  const [replayState, setReplayState] = useState<'before' | 'after'>('before');
  const [gameVersion, setGameVersion] = useState(0);

  useEffect(() => {
      localStorage.setItem('chess_user_elo', userElo.toString());
  }, [userElo]);

  const handleGameOver = async (result: 'win' | 'loss', history: MoveRecord[]) => {
      setLastGameResult(result);
      setGameState('analyzing');
      setReplayHistory(history);
      
      const aiElo = userElo + 50; 
      const change = calculateEloChange(userElo, aiElo, result);
      
      setEloChange(change);
      setUserElo(prev => prev + change);

      setIsAnalyzing(true);
      
      const mode = result === 'win' ? 'analysis_win' : 'analysis_loss';
      try {
          const feedback = await getChessCoachFeedback(mode, history.map(m => m.desc));
          setAnalysis(feedback.analysis);
          setCriticalMoveIndex(feedback.criticalMoveIndex);
      } catch (e) {
          setAnalysis("分析失败: 网络连接异常或请求超时。");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleRestartGame = () => {
    setGameVersion(prev => prev + 1);
  };

  // Replay Logic
  const replayBoard = useMemo(() => {
     let tempBoard = setupBoard();
     const targetIndex = criticalMoveIndex >= 0 ? criticalMoveIndex : replayHistory.length - 1;
     
     for (let i = 0; i < targetIndex; i++) {
         tempBoard = applyMoveToBoard(tempBoard, replayHistory[i]);
     }
     
     const boardBefore = tempBoard.map(r => r.map(p => p ? {...p} : null));
     
     let boardAfter = tempBoard;
     if (replayHistory[targetIndex]) {
        boardAfter = applyMoveToBoard(boardBefore, replayHistory[targetIndex]);
     }

     return { before: boardBefore, after: boardAfter, move: replayHistory[targetIndex] };
  }, [replayHistory, criticalMoveIndex]);

  useEffect(() => {
      if (gameState === 'analyzing' && criticalMoveIndex >= 0) {
          const interval = setInterval(() => {
              setReplayState(prev => prev === 'before' ? 'after' : 'before');
          }, 1500);
          return () => clearInterval(interval);
      }
  }, [gameState, criticalMoveIndex]);

  const handlePlayAgain = () => {
      setGameState('playing');
      setAnalysis('');
      setLastGameResult(null);
      setCriticalMoveIndex(-1);
      setEloChange(0);
      setPracticeMoves(undefined); 
  };

  const handlePracticeFromMistake = () => {
      if (criticalMoveIndex < 0) return;
      const movesToReplay = replayHistory.slice(0, criticalMoveIndex); 
      setPracticeMoves(movesToReplay);
      setGameState('playing');
      setAnalysis(''); 
      setLastGameResult(null);
  };

  return (
    <div className="h-full w-full bg-black text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center px-4 py-4 bg-gray-900 border-b border-gray-800 z-10 shadow-md">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-800 rounded-full text-gray-400"><ArrowLeft size={20} /></button>
            <div className="ml-2 flex-1">
                <h1 className="text-md font-bold text-white flex items-center gap-2">AI 象棋实践助手</h1>
            </div>
            
            <div className="flex flex-col items-end">
                {/* Network Status Indicator */}
                <div className="flex items-center gap-1 mb-1">
                    {AI_PROVIDER === 'qwen' ? (
                        <span className="text-[10px] text-green-500 flex items-center gap-1 bg-green-900/30 px-1 rounded"><Wifi size={10} /> 阿里云直连</span>
                    ) : (
                        <span className="text-[10px] text-blue-500 flex items-center gap-1 bg-blue-900/30 px-1 rounded"><Wifi size={10} /> 代理模式</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-yellow-500">{getRankTitle(userElo)}</span>
                    <span className="text-[10px] bg-gray-800 px-1 rounded text-gray-300 font-mono">{userElo}</span>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
            
            {gameState === 'playing' ? (
                <>
                    {practiceMoves && (
                        <div className="w-full max-w-sm mb-4 animate-fade-in-up">
                            <div className="border border-purple-500/30 bg-purple-900/20 rounded-xl p-4 flex items-start gap-3 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <Target size={64} />
                                </div>
                                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 shrink-0">
                                    <Target size={20} />
                                </div>
                                <div className="z-10">
                                    <h3 className="text-sm font-bold text-purple-200 mb-1 flex items-center gap-2">
                                        错误修正练习
                                    </h3>
                                    <p className="text-xs text-gray-300 leading-relaxed">
                                        已为你重置到关键失误前一步。请仔细思考，<span className="text-white font-bold underline">换一种走法</span>来避免刚才的劣势。
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <XiangqiGame 
                        key={practiceMoves ? `practice-${practiceMoves.length}-${gameVersion}` : `new-game-${gameVersion}`}
                        onGameOver={handleGameOver} 
                        onRestart={handleRestartGame}
                        userElo={userElo} 
                        initialMoves={practiceMoves} 
                    />
                </>
            ) : (
                <div className="w-full max-w-sm animate-fade-in-up">
                    <div className="text-center mb-6 mt-4">
                        {lastGameResult === 'win' ? (
                            <div className="inline-flex p-4 rounded-full bg-yellow-500/20 mb-4 ring-4 ring-yellow-500/10">
                                <Trophy size={48} className="text-yellow-500" />
                            </div>
                        ) : (
                            <div className="inline-flex p-4 rounded-full bg-gray-800 mb-4 ring-4 ring-gray-700">
                                <Frown size={48} className="text-gray-400" />
                            </div>
                        )}
                        <h2 className="text-2xl font-black text-white mb-2">{lastGameResult === 'win' ? '挑战成功！' : '再接再厉'}</h2>
                        
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-sm text-gray-400">积分变动:</span>
                            <span className={`text-xl font-black ${eloChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {eloChange > 0 ? '+' : ''}{eloChange}
                            </span>
                            <div className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-300">Total: {userElo}</div>
                        </div>
                    </div>

                    {/* Analysis Section */}
                    <div className="space-y-6">
                        {criticalMoveIndex >= 0 && !isAnalyzing && (
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col items-center">
                                <div className="text-xs font-bold text-yellow-500 mb-3 flex items-center gap-2 uppercase tracking-wider">
                                    <Target size={14} /> 
                                    关键一帧: 第 {criticalMoveIndex + 1} 手 ({replayBoard.move?.desc})
                                </div>
                                <div className="transform scale-90">
                                    <BoardView 
                                        board={replayState === 'before' ? replayBoard.before : replayBoard.after}
                                        highlightFrom={replayBoard.move?.from}
                                        highlightTo={replayState === 'after' ? replayBoard.move?.to : null}
                                    />
                                </div>
                                <div className="text-[10px] text-gray-500 mt-2 flex items-center gap-2">
                                    {replayState === 'before' ? 'Before' : 'After'} 
                                    <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                                        <div className={`h-full bg-blue-500 transition-all duration-1000 ${replayState === 'after' ? 'w-full' : 'w-0'}`} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. Text Analysis */}
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center justify-center py-8 text-gray-500 gap-3">
                                    <Loader2 size={32} className="animate-spin text-blue-500" />
                                    <span className="text-sm font-medium animate-pulse">正在回顾棋谱，寻找关键手...</span>
                                    {AI_PROVIDER === 'qwen' && (
                                        <div className="text-xs text-green-500/80 bg-green-900/20 px-3 py-1 rounded flex items-center gap-2 mt-2">
                                            <WifiOff size={12} /> 提示: 建议关闭 VPN
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => setIsAnalyzing(false)}
                                        className="mt-4 text-xs bg-gray-800 px-3 py-1.5 rounded-full text-gray-400 hover:text-white border border-gray-700"
                                    >
                                        跳过分析 (Skip)
                                    </button>
                                </div>
                            ) : (
                                <div className="markdown-body text-sm text-gray-300 leading-relaxed">
                                    <ReactMarkdown>{analysis}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                        {lastGameResult === 'loss' && criticalMoveIndex >= 0 && !isAnalyzing && (
                            <button 
                                onClick={handlePracticeFromMistake}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 active:scale-95 transition-transform animate-pulse"
                            >
                                <Target size={18} /> 带着约束重下 (回溯)
                            </button>
                        )}
                        
                        <button 
                            onClick={handlePlayAgain}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3.5 rounded-xl border border-gray-700 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <RefreshCw size={18} /> 开启新对局
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default ChessPractice;
