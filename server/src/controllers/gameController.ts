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
} from "../interfaces/interfaces.js";

const SIZE = 12;
const _typeTanks: TypeTanksMap = {
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
let _board: Board;
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

function initBoard() {
  _board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  //white
  _board[11][3] = { type: "wHM", rotate: 0, player: 1 };
  _board[11][5] = { type: "wLTK", rotate: 0, player: 1 };
  _board[11][7] = { type: "wHT", rotate: 0, player: 1 };
  //
  _board[9][3] = { type: "wLT", rotate: 0, player: 1 };
  _board[9][5] = { type: "wMT", rotate: 0, player: 1 };
  _board[9][7] = { type: "wLT", rotate: 0, player: 1 };
  //Black
  _board[0][4] = { type: "bHT", rotate: 180, player: 2 };
  _board[0][6] = { type: "bLTK", rotate: 180, player: 2 };
  _board[0][8] = { type: "bHM", rotate: 180, player: 2 };
  //
  _board[2][4] = { type: "bLT", rotate: 180, player: 2 };
  _board[2][6] = { type: "bMT", rotate: 180, player: 2 };
  _board[2][8] = { type: "bLT", rotate: 180, player: 2 };
  //Block
  _board[0][2] = { type: "wall" };
  _board[1][2] = { type: "wall" };

  _board[0][10] = { type: "wall" };

  _board[3][5] = { type: "wall" };
  _board[3][6] = { type: "wall" };
  _board[4][6] = { type: "wall" };
  _board[4][7] = { type: "wall" };
  _board[4][8] = { type: "wall" };

  _board[4][10] = { type: "wall" };

  _board[4][2] = { type: "wall" };
  _board[4][3] = { type: "wall" };
  _board[5][2] = { type: "wall" };
  //
  _board[11][1] = { type: "wall" };

  _board[11][9] = { type: "wall" };
  _board[10][9] = { type: "wall" };

  _board[7][9] = { type: "wall" };
  _board[6][9] = { type: "wall" };
  _board[7][8] = { type: "wall" };

  _board[7][1] = { type: "wall" };

  _board[7][3] = { type: "wall" };
  _board[7][4] = { type: "wall" };
  _board[7][5] = { type: "wall" };
  _board[8][5] = { type: "wall" };
  _board[8][6] = { type: "wall" };
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
      initBoard();
      // Пуш приглашённому игроку
      const payload = {
        playerSocketId: socket.id,
        board: _board,
        typeTanks: _typeTanks,
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
