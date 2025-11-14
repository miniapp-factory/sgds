"use client";

import { useEffect, useState } from "react";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const SIZE = 4;
const EMPTY = 0;

type Board = number[][];

function createEmptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
}

function addRandomTile(board: Board): Board {
  const emptyCells: [number, number][] = [];
  board.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell === EMPTY) emptyCells.push([r, c]);
    })
  );
  if (emptyCells.length === 0) return board;
  const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const newBoard = board.map(row => [...row]);
  newBoard[r][c] = value;
  return newBoard;
}

function transpose(board: Board): Board {
  return board[0].map((_, i) => board.map(row => row[i]));
}

function reverseRows(board: Board): Board {
  return board.map(row => [...row].reverse());
}

function compress(row: number[]): number[] {
  const newRow = row.filter(v => v !== EMPTY);
  const missing = Array(SIZE - newRow.length).fill(EMPTY);
  return [...newRow, ...missing];
}

function merge(row: number[]): number[] {
  for (let i = 0; i < SIZE - 1; i++) {
    if (row[i] !== EMPTY && row[i] === row[i + 1]) {
      row[i] *= 2;
      row[i + 1] = EMPTY;
    }
  }
  return row;
}

function moveLeft(board: Board): Board {
  return board.map(row => merge(compress(row)));
}

function moveRight(board: Board): Board {
  return reverseRows(moveLeft(reverseRows(board)));
}

function moveUp(board: Board): Board {
  return transpose(moveLeft(transpose(board)));
}

function moveDown(board: Board): Board {
  return transpose(moveRight(transpose(board)));
}

function hasMoves(board: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === EMPTY) return true;
      if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return true;
      if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

export default function Game2048() {
  const [board, setBoard] = useState<Board>(() => addRandomTile(addRandomTile(createEmptyBoard())));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const handleMove = (direction: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    let newBoard: Board;
    switch (direction) {
      case "up":
        newBoard = moveUp(board);
        break;
      case "down":
        newBoard = moveDown(board);
        break;
      case "left":
        newBoard = moveLeft(board);
        break;
      case "right":
        newBoard = moveRight(board);
        break;
    }
    if (JSON.stringify(newBoard) === JSON.stringify(board)) return; // no change
    const added = addRandomTile(newBoard);
    const newScore = added.flat().reduce((s, v) => s + v, 0);
    setBoard(added);
    setScore(newScore);
    if (!hasMoves(added)) setGameOver(true);
  };

  const resetGame = () => {
    setBoard(addRandomTile(addRandomTile(createEmptyBoard())));
    setScore(0);
    setGameOver(false);
  };

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          handleMove("up");
          break;
        case "ArrowDown":
          handleMove("down");
          break;
        case "ArrowLeft":
          handleMove("left");
          break;
        case "ArrowRight":
          handleMove("right");
          break;
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [board, gameOver]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((value, idx) => (
          <div
            key={idx}
            className={`flex h-12 w-12 items-center justify-center rounded-md text-xl font-bold
              ${value === 0
                ? "bg-gray-200"
                : value <= 4
                ? "bg-yellow-200"
                : value <= 8
                ? "bg-yellow-300"
                : value <= 16
                ? "bg-yellow-400"
                : value <= 32
                ? "bg-yellow-500"
                : value <= 64
                ? "bg-yellow-600"
                : "bg-yellow-700"}`}
          >
            {value !== 0 ? value : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          className="rounded-md bg-blue-500 px-3 py-1 text-white"
          onClick={() => handleMove("up")}
        >
          ↑
        </button>
        <button
          className="rounded-md bg-blue-500 px-3 py-1 text-white"
          onClick={() => handleMove("down")}
        >
          ↓
        </button>
        <button
          className="rounded-md bg-blue-500 px-3 py-1 text-white"
          onClick={() => handleMove("left")}
        >
          ←
        </button>
        <button
          className="rounded-md bg-blue-500 px-3 py-1 text-white"
          onClick={() => handleMove("right")}
        >
          →
        </button>
      </div>
      <div className="text-lg">Score: {score}</div>
      {gameOver && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-xl font-bold">Game Over!</div>
          <Share text={`I scored ${score} in 2048! ${url}`} />
          <button
            className="rounded-md bg-green-500 px-3 py-1 text-white"
            onClick={resetGame}
          >
            Restart
          </button>
        </div>
      )}
    </div>
  );
}
