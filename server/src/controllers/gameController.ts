import type { Server, Socket } from "socket.io";
import userService from "../services/userService.js";
import { Events } from "../socketEvents.js";
import type {
  TypeTanksMap,
  Board,
  Coord,
  ITank,
  ITankType,
  IWall,
  Cell,
  Selected,
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
const DIRS_ROTATE = {
  0: [-1, 0],
  45: [-1, 1],
  90: [0, 1],
  135: [1, 1],
  180: [1, 0],
  225: [1, -1],
  270: [0, -1],
  315: [-1, -1],
};
const objects: Record<string, Cell> = {
  wall: { type: "wall" },
  wLTK: { type: "wLTK", player: 1, rotate: 0 },
  wMTK: { type: "wMTK", player: 1, rotate: 0 },
  wHTK: { type: "wHTK", player: 1, rotate: 0 },
  wLT: { type: "wLT", player: 1, rotate: 0 },
  wMT: { type: "wMT", player: 1, rotate: 0 },
  wHT: { type: "wHT", player: 1, rotate: 0 },
  wTD: { type: "wTD", player: 1, rotate: 0 },
  wHM: { type: "wHM", player: 1, rotate: 0 },
  bLTK: { type: "bLTK", player: 2, rotate: 180 },
  bMTK: { type: "bMTK", player: 2, rotate: 180 },
  bHTK: { type: "bHTK", player: 2, rotate: 180 },
  bLT: { type: "bLT", player: 2, rotate: 180 },
  bMT: { type: "bMT", player: 2, rotate: 180 },
  bHT: { type: "bHT", player: 2, rotate: 180 },
  bTD: { type: "bTD", player: 2, rotate: 180 },
  bHM: { type: "bHM", player: 2, rotate: 180 },
};

let _board: Board;
let _typeTanks: TypeTanksMap;
let SIZE: number;
const ANGLE = 45;
let _isWhiteTurn = true;
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
    wMTK: {
      img: "/sprites/wMTK.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 2,
      moves: 4,
    },
    wHTK: {
      img: "/sprites/wHTK.png",
      armor: { front: 3, side: 2, back: 1 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 3,
      moves: 3,
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
    bMTK: {
      img: "/sprites/bMTK.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 2,
      moves: 4,
    },
    bHTK: {
      img: "/sprites/bHTK.png",
      armor: { front: 3, side: 2, back: 1 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 3,
      moves: 3,
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
    pathMap = path.join(__dirname, "maps", "_map.txt");
  } else {
    pathMap = path.join(__dirname, "..", "..", "maps", "_map.txt");
  }

  const board = JSON.parse(fs.readFileSync(pathMap, "utf-8"));
  let boardLength = board.length;
  _board = Array.from({ length: boardLength }, () => Array(boardLength).fill(null));

  for (let i = 0; i < boardLength; i++) {
    for (let j = 0; j < boardLength; j++) {
      const cell: string = board[i][j].trim();

      if (cell) {
        _board[i][j] = { ...objects[cell] } as Cell;
      }
    }
  }

  _prevBoard = structuredClone(_board);
  _typeTanks = initTypeTanksMap(board.length);
  SIZE = board.length;
  _isWhiteTurn = true;
}

let _selected: Selected = null;
let _prevSelected: Selected = null;
let _move: number = -1;

let _prevBoard: Board;
let _highlighted = new Set<string>();

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
        size: SIZE,
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
      playerSocketId: socket.id,
      board: _board,
      typeTanks: _typeTanks,
      size: SIZE,
    };
    io.to(playerSocketId).emit(Events.GAME_STARTED, payload);
  });

  socket.on(
    Events.NEXT_TURN,
    async (enemySocketId: string, callback: (res: { success: boolean }) => void) => {
      console.log("Server Events.NEXT_TURN");
      if (checkEndMove()) {
        _isWhiteTurn = !_isWhiteTurn;
        _prevBoard = structuredClone(_board);
        const payload = { board: _board };
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
      shoted: Coord,
      callback: (res: { success: boolean; board: Board; win: boolean }) => void,
    ) => {
      console.log("Server Events.SHOT");

      if (!checkEndMove()) {
        console.log("no end move");
        callback({ success: false, board: _board, win: false });
        return;
      }

      let win = false;
      if (checkShoot(_board, _typeTanks, _selected, shoted)) {
        console.log("shoted tank");
        if (checkWin(_board, shoted)) {
          console.log("Kill Kinght");
          win = true;
        }

        const wall: IWall = { type: "wall" };
        _board[shoted!.row][shoted!.col] = wall;
      }

      _isWhiteTurn = !_isWhiteTurn;
      _prevBoard = structuredClone(_board);
      const payload = { board: _board, win };
      io.to(enemySocketId).emit(Events.SHOTED, payload);
      callback({ success: true, board: _board, win });
    },
  );

  socket.on(
    Events.LEFT_CLICK,
    async (
      select: Coord,
      player: number,
      enemySocketId: string,
      callback: (res: {
        success: boolean;
        board: Board;
        highlighted: string[];
        selected: Selected;
      }) => void,
    ) => {
      console.log("Server Events.LEFT_CLICK");
      const tank = _board[select!.row][select!.col] as ITank;
      let board: Board = [];
      const turn = (player === 1 && _isWhiteTurn) || (player !== 1 && !_isWhiteTurn);

      if (!(tank && turn && tank.player === player)) {
        console.log("click empty");
        _board = structuredClone(_prevBoard);
        board = _board;

        _selected = null;
        _prevSelected = null;
        _highlighted = new Set<string>();
      } else {
        console.log("click tank");
        if (_selected) {
          console.log("click another tank");
          _board = structuredClone(_prevBoard);
          board = _board;
        }
        _selected = { row: select!.row, col: select!.col, rotate: tank.rotate };
        _prevSelected = structuredClone(_selected);
        _highlighted = setHighlighted();
        _move = (_typeTanks[tank.type] as ITankType).moves;
      }

      const payload = { board: _board };
      io.to(enemySocketId).emit(Events.ENEMY_MOVED, payload);

      callback({
        success: true,
        board: board,
        highlighted: [..._highlighted],
        selected: _selected,
      });
    },
  );

  socket.on(
    Events.MOVE_FORWARD,
    async (
      enemySocketId: string,
      callback: (res: {
        success: boolean;
        board: Board;
        win: boolean;
        selected: Selected;
        highlighted: string[];
        move: number;
      }) => void,
    ) => {
      console.log("Server Events.MOVE_FORWARD");

      if (!_selected || _move <= 0) {
        callback({
          success: false,
          board: [],
          win: false,
          selected: null,
          highlighted: [],
          move: -1,
        });
        return;
      }

      const { row, col } = _selected;
      const tank = _board[row][col] as ITank;
      if (!tank) {
        callback({
          success: false,
          board: [],
          win: false,
          selected: null,
          highlighted: [],
          move: -1,
        });
        return;
      }

      let newRow = row + DIRS_ROTATE[tank.rotate as keyof typeof DIRS_ROTATE][0];
      let newCol = col + DIRS_ROTATE[tank.rotate as keyof typeof DIRS_ROTATE][1];

      if (newCol < 0 || newCol >= SIZE) {
        callback({
          success: false,
          board: [],
          win: false,
          selected: null,
          highlighted: [],
          move: -1,
        });
        return;
      }

      let win = false;
      if (checkMoveWin(tank, newRow)) {
        console.log("Kinght escaped");
        win = true;
        _board[_selected.row][_selected.col] = null;
        _selected = null;
        _highlighted = new Set<string>();
      } else {
        if (newRow < 0 || newRow >= SIZE || _board[newRow][newCol]) {
          callback({
            success: false,
            board: [],
            win: false,
            selected: null,
            highlighted: [],
            move: -1,
          });
          return;
        }

        _board[_selected.row][_selected.col] = null;
        _selected = { row: newRow, col: newCol, rotate: tank.rotate };
        _board[_selected.row][_selected.col] = tank;
        _highlighted = setHighlighted();
        _move -= 1;
      }

      const payload = { board: _board };
      io.to(enemySocketId).emit(Events.ENEMY_MOVED, payload);

      callback({
        success: true,
        board: _board,
        win: win,
        selected: _selected,
        highlighted: [..._highlighted],
        move: _move,
      });
    },
  );

  socket.on(
    Events.MOVE_BACK,
    async (
      enemySocketId: string,
      callback: (res: {
        success: boolean;
        board: Board;
        win: boolean;
        selected: Selected;
        highlighted: string[];
        move: number;
      }) => void,
    ) => {
      console.log("Server Events.MOVE_BACK");

      if (!_selected || _move <= 0) {
        callback({
          success: false,
          board: [],
          win: false,
          selected: null,
          highlighted: [],
          move: -1,
        });
        return;
      }

      const { row, col } = _selected;
      const tank = _board[row][col] as ITank;
      if (!tank) {
        callback({
          success: false,
          board: [],
          win: false,
          selected: null,
          highlighted: [],
          move: -1,
        });
        return;
      }

      if (_move !== (_typeTanks[tank.type] as ITankType).moves) {
        callback({
          success: false,
          board: [],
          win: false,
          selected: null,
          highlighted: [],
          move: -1,
        });
        return;
      }

      const newRotate = (((tank.rotate + 180) % 360) + 360) % 360;

      let newRow = row + DIRS_ROTATE[newRotate as keyof typeof DIRS_ROTATE][0];
      let newCol = col + DIRS_ROTATE[newRotate as keyof typeof DIRS_ROTATE][1];

      if (newCol < 0 || newCol >= SIZE) {
        callback({
          success: false,
          board: [],
          win: false,
          selected: null,
          highlighted: [],
          move: -1,
        });
        return;
      }

      let win = false;
      if (checkMoveWin(tank, newRow)) {
        console.log("Kinght escaped");
        win = true;
        _board[_selected.row][_selected.col] = null;
        _selected = null;
        _highlighted = new Set<string>();
      } else {
        if (newRow < 0 || newRow >= SIZE || _board[newRow][newCol]) {
          callback({
            success: false,
            board: [],
            win: false,
            selected: null,
            highlighted: [],
            move: -1,
          });
          return;
        }

        _board[_selected.row][_selected.col] = null;
        _selected = { row: newRow, col: newCol, rotate: tank.rotate };
        _board[_selected.row][_selected.col] = tank;
        _highlighted = setHighlighted();
        _move = 0;
      }

      const payload = { board: _board };
      io.to(enemySocketId).emit(Events.ENEMY_MOVED, payload);

      callback({
        success: true,
        board: _board,
        win: win,
        selected: _selected,
        highlighted: [..._highlighted],
        move: _move,
      });
    },
  );

  socket.on(
    Events.TANK_ROTATE,
    async (
      enemySocketId: string,
      angle: number,
      callback: (res: {
        success: boolean;
        board: Board;
        selected: Selected;
        highlighted: string[];
        move: number;
      }) => void,
    ) => {
      console.log("Server Events.TANK_ROTATE");

      if (!_selected || _move <= 0) {
        callback({
          success: false,
          board: [],
          selected: null,
          highlighted: [],
          move: -1,
        });
        return;
      }

      const { row, col } = _selected;
      const tank = _board[row][col] as ITank;
      if (!tank) {
        callback({
          success: false,
          board: [],
          selected: null,
          highlighted: [],
          move: -1,
        });
        return;
      }

      tank.rotate = (((tank.rotate + angle * ANGLE) % 360) + 360) % 360;

      _selected.rotate = tank.rotate;
      _board[row][col] = tank;
      _highlighted = setHighlighted();
      _move -= 1;

      const payload = { board: _board };
      io.to(enemySocketId).emit(Events.ENEMY_MOVED, payload);

      callback({
        success: true,
        board: _board,
        selected: _selected,
        highlighted: [..._highlighted],
        move: _move,
      });
    },
  );

  //GAME
  function checkShoot(board: Board, typeTanks: TypeTanksMap, selected: Selected, shoted: Coord) {
    if (!_highlighted.has(`${shoted!.row},${shoted!.col}`)) {
      console.log("shot not highligted");
      return false;
    }
    const tank = board[selected!.row][selected!.col] as ITank;
    const shotedTank = board[shoted!.row][shoted!.col] as ITank;

    if (tank && shotedTank && tank.type !== "wall" && shotedTank.type !== "wall") {
      if (tank.player === shotedTank.player) {
        console.log("friend shot");
        return false;
      }

      console.log("check armor");
      let row = selected!.row - shoted!.row;
      let col = selected!.col - shoted!.col;

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

    console.log("shot wall, empty");
    return false;
  }

  function checkEndMove() {
    if (_selected === null || _prevSelected === null) return false;
    return (
      _selected.row !== _prevSelected.row ||
      _selected.col !== _prevSelected.col ||
      _selected.rotate !== _prevSelected.rotate
    );
  }

  function checkWin(board: Board, shoted: Coord) {
    const shotedTank = board[shoted!.row][shoted!.col] as ITank;
    if (
      shotedTank.type === "wLTK" ||
      shotedTank.type === "bLTK" ||
      shotedTank.type === "wMTK" ||
      shotedTank.type === "bMTK" ||
      shotedTank.type === "wHTK" ||
      shotedTank.type === "bHTK"
    ) {
      return true;
    }
    return false;
  }

  function checkMoveWin(tank: ITank, newRow: number) {
    let res = false;
    if ((tank.type === "wLTK" || tank.type === "wMTK" || tank.type === "wHTK") && newRow < 0) {
      console.log("white win");
      res = true;
    } else if (
      (tank.type === "bLTK" || tank.type === "bMTK" || tank.type === "bHTK") &&
      newRow === SIZE
    ) {
      console.log("black win");
      res = true;
    }
    return res;
  }

  function castRay(
    set: Set<string>,
    board: Board,
    startRow: number,
    startCol: number,
    typeShot: string,
    [dr, dc]: number[],
    startDist: number,
    endDist: number,
  ) {
    if (typeShot === "tank") {
      const rs = startRow + dr;
      const cs = startCol + dc;
      if (rs < 0 || rs >= SIZE || cs < 0 || cs >= SIZE) return;
      if (board?.[rs]?.[cs]) return;

      for (let d = startDist; d <= endDist; d++) {
        const r = startRow + dr * d;
        const c = startCol + dc * d;
        if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) break;
        set.add(`${r},${c}`);
        if (board?.[r]?.[c]) break;
      }
    }
  }

  function setHighlighted() {
    const set = new Set<string>();
    if (!_selected) return set;

    const { row, col } = _selected;
    const tank = _board?.[row]?.[col] as ITank;
    if (!tank) return set;

    const typeTank = _typeTanks[tank.type] as ITankType;

    const front = DIRS_ROTATE[tank.rotate as keyof typeof DIRS_ROTATE];
    let left = null;
    let right = null;
    if (typeTank.shot.sides > 1) {
      left = DIRS_ROTATE[((tank.rotate - 45 + 360) % 360) as keyof typeof DIRS_ROTATE];
      right = DIRS_ROTATE[((tank.rotate + 45) % 360) as keyof typeof DIRS_ROTATE];
    }

    for (const dir of [front, left, right]) {
      if (dir) {
        castRay(
          set,
          _board,
          row,
          col,
          typeTank.shot.type,
          dir,
          typeTank.shot.min,
          typeTank.shot.max,
        );
      }
    }
    return set;
  }
};
