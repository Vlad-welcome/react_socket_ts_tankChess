import type { Server, Socket } from "socket.io";
import userService from "../services/userService.js";
import { Events } from "../socketEvents.js";
import type {
  TypeTanksMap,
  Board,
  ICoord,
  ITank,
  ITankType,
  IWall,
  Cell,
} from "../interfaces/interfaces.js";

import fs from "fs";
import path from "node:path";
import { isSea } from "node:sea";
import { fileURLToPath } from "node:url";

const DIRS = {
  "-1,0": 0,
  "-1,1": 45,
  "0,1": 90,
  "1,1": 135,
  "1,0": 180,
  "1,-1": 225,
  "0,-1": 270,
  "-1,-1": 315,
};
const objects: Record<string, Cell> = {
  wall: { type: "wall" },
  wLTK: { type: "wLTK", player: 1, rotate: 0 },
  wLT: { type: "wLT", player: 1, rotate: 0 },
  wMT: { type: "wMT", player: 1, rotate: 0 },
  wHT: { type: "wHT", player: 1, rotate: 0 },
  wTD: { type: "wTD", player: 1, rotate: 0 },
  wHM: { type: "wHM", player: 1, rotate: 0 },
  bLTK: { type: "bLTK", player: 2, rotate: 180 },
  bLT: { type: "bLT", player: 2, rotate: 180 },
  bMT: { type: "bMT", player: 2, rotate: 180 },
  bHT: { type: "bHT", player: 2, rotate: 180 },
  bTD: { type: "bTD", player: 2, rotate: 180 },
  bHM: { type: "bHM", player: 2, rotate: 180 },
};

let _board: Board;
let _typeTanks: TypeTanksMap;
let SIZE: number;
function initTypeTanksMap(SIZE: number) {
  let typeTanks: TypeTanksMap = {
    //block
    wall: {
      img: "/sprites/wall.png",
    },
    //white
    wLTK: {
      img: "/sprites/wLTK.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 5,
    },
    wLT: {
      img: "/sprites/wLT.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 5,
    },
    wMT: {
      img: "/sprites/wMT.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 2,
      moves: 4,
    },
    wHT: {
      img: "/sprites/wHT.png",
      armor: { front: 3, side: 2, back: 1 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 3,
      moves: 3,
    },
    wTD: {
      img: "/sprites/wTD.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 1, min: 2, max: SIZE, type: "tank" },
      damage: 4,
      moves: 4,
    },
    wHM: {
      img: "/sprites/wHM.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 1, min: 3, max: 5, type: "arta" },
      damage: 5,
      moves: 3,
    },
    //Black
    bLTK: {
      img: "/sprites/bLTK.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 5,
    },
    bLT: {
      img: "/sprites/bLT.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 5,
    },
    bMT: {
      img: "/sprites/bMT.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 2,
      moves: 4,
    },
    bHT: {
      img: "/sprites/bHT.png",
      armor: { front: 3, side: 2, back: 1 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 3,
      moves: 3,
    },
    bTD: {
      img: "/sprites/bTD.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 1, min: 2, max: SIZE, type: "tank" },
      damage: 4,
      moves: 4,
    },
    bHM: {
      img: "/sprites/bHM.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 1, min: 3, max: 5, type: "arta" },
      damage: 5,
      moves: 3,
    },
  };
  return typeTanks;
}
function initBoard() {
  let pathMap: string;
  //const __dirname = path.dirname(fileURLToPath(import.meta.url));

  if (isSea()) {
    pathMap = path.join(__dirname, "maps", "map.txt");
  } else {
    pathMap = path.join(__dirname, "..", "..", "maps", "map.txt");
  }

  const board = JSON.parse(fs.readFileSync(pathMap, "utf-8"));
  let boardLength = board.length;
  _board = Array.from({ length: boardLength }, () => Array(boardLength).fill(null));

  for (let i = 0; i < boardLength; i++) {
    for (let j = 0; j < boardLength; j++) {
      const cell: string = board[i][j].trim();

      if (cell) {
        _board[i][j] = objects[cell];
      }
    }
  }

  return { typeTanks: initTypeTanksMap(board.length), size: board.length };
}

export const gameController = (io: Server, socket: Socket): void => {
  socket.on(Events.ROOM, async (callback: (res: { success: boolean }) => void) => {
    console.log("Server Events.ROOM");
    const user = await userService.getBySocket(socket.id);

    if (user !== undefined) {
      callback({ success: true });
      return;
    }
    callback({ success: false });
  });

  socket.on(Events.INVITE, async (name: string, callback: (res: { success: boolean }) => void) => {
    console.log("Server Events.INVITE");
    const user = await userService.getByName(name);

    if (user) {
      let init = initBoard();
      _typeTanks = init.typeTanks;
      SIZE = init.size;

      // Пуш приглашённому игроку
      const payload = {
        playerSocketId: socket.id,
        board: _board,
        typeTanks: _typeTanks,
        SIZE: SIZE,
      };
      io.to(user.socketId).emit(Events.INVITED, payload);

      callback({ success: true });
      return;
    }

    callback({ success: false });
  });

  socket.on(Events.GAME_START, async (playerSocketId: string) => {
    console.log("Server Events.GAME_START");
    const payload = {
      start: true,
      playerSocketId: socket.id,
      board: _board,
      typeTanks: _typeTanks,
      SIZE: SIZE,
    };
    io.to(playerSocketId).emit(Events.GAME_STARTED, payload);
  });

  socket.on(
    Events.NEXT_TURN,
    async (enemySocketId: string, board: Board, callback: (res: { success: boolean }) => void) => {
      console.log("Server Events.NEXT_TURN");
      //здесь проверка на ход. Сравнивать текущий board и board который пришел
      if (true) {
        const payload = { board };
        io.to(enemySocketId).emit(Events.NEXT_TURNED, payload);
        callback({ success: true });
      } else {
        callback({ success: false });
      }
    },
  );

  socket.on(Events.EXIT, async (enemySocketId: string, text: string) => {
    console.log("Server Events.EXIT");
    io.to(enemySocketId).emit(Events.EXITED, { text: text });
  });

  socket.on(
    Events.SHOT,
    async (
      enemySocketId: string,
      board: Board,
      selected: ICoord,
      shoted: ICoord,
      callback: (res: { success: boolean; board: Board; win: boolean }) => void,
    ) => {
      console.log("Server Events.SHOT");

      let win = false;
      if (checkShoot(board, _typeTanks, selected, shoted)) {
        if (checkWin(board, shoted)) {
          console.log("Kill Kinght");
          win = true;
        }

        const wall: IWall = { type: "wall" };
        board[shoted.row][shoted.col] = wall;
      }

      _board = board;
      const payload = { board: _board, win };
      io.to(enemySocketId).emit(Events.SHOTED, payload);
      callback({ success: true, board: _board, win });
    },
  );

  //GAME
  function checkShoot(board: Board, typeTanks: TypeTanksMap, selected: ICoord, shoted: ICoord) {
    const tank = board[selected.row][selected.col] as ITank;
    const shotedTank = board[shoted.row][shoted.col] as ITank;

    if (tank && shotedTank && tank.type !== "wall" && shotedTank.type !== "wall") {
      if (tank.player === shotedTank.player) {
        return false;
      }

      let row = selected.row - shoted.row;
      let col = selected.col - shoted.col;

      if (row !== 0) {
        if (row > 0) {
          row = 1;
        } else if (row < 0) {
          row = -1;
        }
      }

      if (col !== 0) {
        if (col > 0) {
          col = 1;
        } else if (col < 0) {
          col = -1;
        }
      }
      const angle = DIRS[`${row},${col}` as keyof typeof DIRS];
      const side = Math.abs(shotedTank!.rotate - angle);

      const damage = (typeTanks[tank.type] as ITankType).damage;
      if (side === 180) {
        console.log("back");
        if (damage > (typeTanks[shotedTank.type] as ITankType).armor.back) {
          return true;
        }
        return false;
      } else if (side === 0) {
        console.log("front");
        if (damage > (typeTanks[shotedTank.type] as ITankType).armor.front) {
          return true;
        }
        return false;
      } else {
        if (damage > (typeTanks[shotedTank.type] as ITankType).armor.side) {
          console.log("side");
          return true;
        }
        return false;
      }
    }

    return false;
  }

  function checkWin(board: Board, shoted: ICoord) {
    const shotedTank = board[shoted.row][shoted.col] as ITank;
    if (shotedTank.type === "wLTK" || shotedTank.type === "bLTK") {
      return true;
    }
    return false;
  }
};
