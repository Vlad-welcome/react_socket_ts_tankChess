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
  GameSession,
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
  wLTK: { type: "wLTK", player: 1, rotate: 0, isAlive: true },
  wMTK: { type: "wMTK", player: 1, rotate: 0, isAlive: true },
  wHTK: { type: "wHTK", player: 1, rotate: 0, isAlive: true },
  wRTK: { type: "wRTK", player: 1, rotate: 0, isAlive: true },
  wLT: { type: "wLT", player: 1, rotate: 0, isAlive: true },
  wMT: { type: "wMT", player: 1, rotate: 0, isAlive: true },
  wHT: { type: "wHT", player: 1, rotate: 0, isAlive: true },
  wTD: { type: "wTD", player: 1, rotate: 0, isAlive: true },
  wHM: { type: "wHM", player: 1, rotate: 0, isAlive: true },
  wRT: { type: "wRT", player: 1, rotate: 0, isAlive: true },
  wHB: { type: "wHB", player: 1, rotate: 0, isAlive: true },
  wST: { type: "wST", player: 1, rotate: 0, isAlive: true },
  wLH: { type: "wLH", player: 1, rotate: 0, isAlive: true },
  bLTK: { type: "bLTK", player: 2, rotate: 180, isAlive: true },
  bMTK: { type: "bMTK", player: 2, rotate: 180, isAlive: true },
  bHTK: { type: "bHTK", player: 2, rotate: 180, isAlive: true },
  bRTK: { type: "bRTK", player: 2, rotate: 180, isAlive: true },
  bLT: { type: "bLT", player: 2, rotate: 180, isAlive: true },
  bMT: { type: "bMT", player: 2, rotate: 180, isAlive: true },
  bHT: { type: "bHT", player: 2, rotate: 180, isAlive: true },
  bTD: { type: "bTD", player: 2, rotate: 180, isAlive: true },
  bHM: { type: "bHM", player: 2, rotate: 180, isAlive: true },
  bRT: { type: "bRT", player: 2, rotate: 180, isAlive: true },
  bHB: { type: "bHB", player: 2, rotate: 180, isAlive: true },
  bST: { type: "bST", player: 2, rotate: 180, isAlive: true },
  bLH: { type: "bLH", player: 2, rotate: 180, isAlive: true },
};

let _typeTanks: TypeTanksMap;
const ANGLE = 45;

const gamesSession = new Map<string, GameSession>();
const playersGame = new Map<string, string>();

function initTypeTanksMap(SIZE: number) {
  let typeTanks: TypeTanksMap = {
    //block
    wall: {
      img: "/sprites/wall.png",
      isPush: false,
    },
    //white
    wLTK: {
      img: "/sprites/wLTK.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 5,
      isPush: true,
    },
    wMTK: {
      img: "/sprites/wMTK.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 2,
      moves: 4,
      isPush: true,
    },
    wHTK: {
      img: "/sprites/wHTK.png",
      armor: { front: 3, side: 2, back: 1 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 3,
      moves: 3,
      isPush: true,
    },
    wRTK: {
      img: "/sprites/wRTK.png",
      armor: { front: 0, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 6,
      isPush: true,
    },
    wLT: {
      img: "/sprites/wLT.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 5,
      isPush: true,
    },
    wMT: {
      img: "/sprites/wMT.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 2,
      moves: 4,
      isPush: true,
    },
    wHT: {
      img: "/sprites/wHT.png",
      armor: { front: 3, side: 2, back: 1 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 3,
      moves: 3,
      isPush: true,
    },
    wTD: {
      img: "/sprites/wTD.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 1, min: 2, max: SIZE, type: "tank" },
      damage: 4,
      moves: 4,
      isPush: true,
    },
    wHM: {
      img: "/sprites/wHM.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 1, min: 3, max: 5, type: "arta" },
      damage: 5,
      moves: 3,
      isPush: true,
    },
    wRT: {
      img: "/sprites/wRT.png",
      armor: { front: 0, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 6,
      isPush: true,
    },
    wHB: {
      img: "/sprites/wHB.png",
      armor: { front: 3, side: 2, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 3,
      moves: 3,
      isPush: true,
    },
    wST: {
      img: "/sprites/wST.png",
      armor: { front: 4, side: 3, back: 2 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 4,
      moves: 2,
      isPush: false,
    },
    wLH: {
      img: "/sprites/wLH.png",
      armor: { front: 0, side: 0, back: 0 },
      shot: { sides: 1, min: 4, max: 7, type: "arta" },
      damage: 3,
      moves: 4,
      isPush: true,
    },
    //Black
    bLTK: {
      img: "/sprites/bLTK.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 5,
      isPush: true,
    },
    bMTK: {
      img: "/sprites/bMTK.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 2,
      moves: 4,
      isPush: true,
    },
    bHTK: {
      img: "/sprites/bHTK.png",
      armor: { front: 3, side: 2, back: 1 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 3,
      moves: 3,
      isPush: true,
    },
    bRTK: {
      img: "/sprites/bRTK.png",
      armor: { front: 0, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 6,
      isPush: true,
    },
    bLT: {
      img: "/sprites/bLT.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 5,
      isPush: true,
    },
    bMT: {
      img: "/sprites/bMT.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 2,
      moves: 4,
      isPush: true,
    },
    bHT: {
      img: "/sprites/bHT.png",
      armor: { front: 3, side: 2, back: 1 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 3,
      moves: 3,
      isPush: true,
    },
    bTD: {
      img: "/sprites/bTD.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 1, min: 2, max: SIZE, type: "tank" },
      damage: 4,
      moves: 4,
      isPush: true,
    },
    bHM: {
      img: "/sprites/bHM.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 1, min: 3, max: 5, type: "arta" },
      damage: 5,
      moves: 3,
      isPush: true,
    },
    bRT: {
      img: "/sprites/bRT.png",
      armor: { front: 0, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 6,
      isPush: true,
    },
    bHB: {
      img: "/sprites/bHB.png",
      armor: { front: 3, side: 2, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 3,
      moves: 3,
      isPush: true,
    },
    bST: {
      img: "/sprites/bST.png",
      armor: { front: 4, side: 3, back: 2 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 4,
      moves: 2,
      isPush: false,
    },
    bLH: {
      img: "/sprites/bLH.png",
      armor: { front: 0, side: 0, back: 0 },
      shot: { sides: 1, min: 4, max: 7, type: "arta" },
      damage: 3,
      moves: 4,
      isPush: true,
    },
  };
  return typeTanks;
}
function initBoard(map: string, gameSession: GameSession) {
  gameSession.history = new Set();

  let pathMap: string;
  if (isSea()) {
    pathMap = path.join(__dirname, "maps", `${map}.txt`);
  } else {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    pathMap = path.join(__dirname, "..", "..", "maps", `${map}.txt`);
  }

  const board = JSON.parse(fs.readFileSync(pathMap, "utf-8"));
  let boardLength = board.length;
  gameSession.board = Array.from({ length: boardLength }, () => Array(boardLength).fill(null));

  for (let i = 0; i < boardLength; i++) {
    for (let j = 0; j < boardLength; j++) {
      const cell: string = board[i][j].trim();

      if (cell) {
        gameSession.board[i][j] = { ...objects[cell] } as Cell;
      }
    }
  }

  gameSession.prevBoard = structuredClone(gameSession.board);
  _typeTanks = initTypeTanksMap(board.length);
  gameSession.size = board.length;
  gameSession.isWhiteTurn = true;
  gameSession.letters = Array.from(
    { length: gameSession.size },
    (_, i) => String.fromCharCode(97 + i), // 97 = 'a'
  );
}

export const gameController = (io: Server, socket: Socket): void => {
  socket.on(Events.ROOM, (callback: (res: { success: boolean }) => void) => {
    console.log("Server Events.ROOM");
    const user = userService.getBySocket(socket.id);

    if (user !== undefined) {
      callback({ success: true });
      return;
    }
    callback({ success: false });
  });

  socket.on(
    Events.INVITE,
    (name: string, map: string, callback: (res: { success: boolean }) => void) => {
      console.log("Server Events.INVITE");
      const user = userService.getByName(name);
      const curUser = userService.getBySocket(socket.id);

      if (user && curUser && map) {
        console.log(map);
        const gameSession: GameSession = {
          board: [],
          prevBoard: [],
          selected: null,
          prevSelected: null,
          size: -1,
          move: -1,
          letters: [],
          history: new Set(),
          highlighted: new Set(),
          isWhiteTurn: true,
        };
        initBoard(map, gameSession);

        const idGameSession = `${curUser.username},${user.username}`;

        let player1;
        let player2;
        if (curUser) {
          player1 = playersGame.get(curUser!.username);
        }
        if (user) {
          player2 = playersGame.get(user!.username);
        }
        if (player1) {
          playersGame.delete(curUser.username);
        }
        if (player2) {
          playersGame.delete(user.username);
        }
        if (player1 || player2) {
          const game = player1 || player2 || "";
          gamesSession.delete(game);
        }

        gamesSession.set(idGameSession, gameSession);
        playersGame.set(curUser.username, idGameSession);
        playersGame.set(user.username, idGameSession);

        console.log(`playersGame ${playersGame.size}`);
        console.log(`gamesSession ${gamesSession.size}`);

        // Пуш приглашённому игроку
        const payload = {
          enemyPlayer: curUser.username,
          board: gameSession.board,
          typeTanks: _typeTanks,
          size: gameSession.size,
          map: map,
        };
        io.to(user.socketId).emit(Events.INVITED, payload);

        callback({ success: true });
        return;
      }

      callback({ success: false });
    },
  );

  socket.on(Events.GAME_START, (enemyPlayer: string, map: string) => {
    console.log("Server Events.GAME_START");

    const user = userService.getByName(enemyPlayer);
    const curUser = userService.getBySocket(socket.id);

    if (user && curUser) {
      const idSession = playersGame.get(user.username);
      const gameSession = gamesSession.get(idSession!);

      const payload = {
        enemyPlayer: curUser.username,
        board: gameSession!.board,
        typeTanks: _typeTanks,
        size: gameSession!.size,
        map: map,
      };
      io.to(user.socketId).emit(Events.GAME_STARTED, payload);
    }
  });

  socket.on(
    Events.NEXT_TURN,
    (enemyPlayer: string, callback: (res: { success: boolean; history: string[] }) => void) => {
      console.log("Server Events.NEXT_TURN");

      const user = userService.getByName(enemyPlayer);

      const idSession = playersGame.get(user!.username);
      const gameSession = gamesSession.get(idSession!);

      if (checkEndMove(gameSession!)) {
        addHistory(gameSession!);
        gameSession!.isWhiteTurn = !gameSession!.isWhiteTurn;
        gameSession!.prevBoard = structuredClone(gameSession!.board);
        gameSession!.selected = null;
        gameSession!.highlighted = new Set();
        const payload = { board: gameSession!.board, history: [...gameSession!.history] };
        io.to(user!.socketId).emit(Events.NEXT_TURNED, payload);
        callback({ success: true, history: [...gameSession!.history] });
      } else {
        callback({ success: false, history: [] });
      }
    },
  );

  socket.on(Events.EXIT, (enemyPlayer: string, text: string) => {
    console.log("Server Events.EXIT");
    const user = userService.getByName(enemyPlayer);
    const curUser = userService.getBySocket(socket.id);

    let player1;
    let player2;
    if (curUser) {
      player1 = playersGame.get(curUser!.username);
    }
    if (enemyPlayer) {
      player2 = playersGame.get(enemyPlayer);
    }
    if (player1) {
      playersGame.delete(curUser!.username);
    }
    if (player2) {
      playersGame.delete(enemyPlayer);
    }
    if (player1 || player2) {
      const game = player1 || player2 || "";
      gamesSession.delete(game);
    }

    console.log(`playersGame ${playersGame.size}`);
    console.log(`gamesSession ${gamesSession.size}`);

    if (user) {
      io.to(user!.socketId).emit(Events.EXITED, { text: text });
    }
  });

  socket.on(
    Events.SHOT,
    (
      enemyPlayer: string,
      shoted: Coord,
      callback: (res: { success: boolean; board: Board; win: boolean; history: string[] }) => void,
    ) => {
      console.log("Server Events.SHOT");

      const idSession = playersGame.get(enemyPlayer);
      const gameSession = gamesSession.get(idSession!);

      if (!checkEndMove(gameSession!)) {
        console.log("no end move");
        callback({ success: false, board: gameSession!.board, win: false, history: [] });
        return;
      }

      let win = false;
      let isShoot = checkShoot(
        gameSession!,
        gameSession!.board,
        _typeTanks,
        gameSession!.selected,
        shoted,
      );
      if (isShoot) {
        console.log("shoted tank");
        if (checkWin(gameSession!.board, shoted)) {
          console.log("Kill Kinght");
          win = true;
        }

        (gameSession!.board[shoted!.row][shoted!.col] as ITank).isAlive = false;
      }

      if (isShoot) {
        addHistory(gameSession!, shoted);
      } else {
        addHistory(gameSession!);
      }

      gameSession!.isWhiteTurn = !gameSession!.isWhiteTurn;
      gameSession!.prevBoard = structuredClone(gameSession!.board);
      gameSession!.selected = null;
      gameSession!.highlighted = new Set();

      const user = userService.getByName(enemyPlayer);

      const payload = { board: gameSession!.board, win, history: [...gameSession!.history] };
      io.to(user!.socketId).emit(Events.SHOTED, payload);
      callback({
        success: true,
        board: gameSession!.board,
        win,
        history: [...gameSession!.history],
      });
    },
  );

  socket.on(
    Events.LEFT_CLICK,
    (
      select: Coord,
      player: number,
      enemyPlayer: string,
      callback: (res: {
        success: boolean;
        board: Board;
        highlighted: string[];
        selected: Selected;
      }) => void,
    ) => {
      console.log("Server Events.LEFT_CLICK");

      const idSession = playersGame.get(enemyPlayer);
      const gameSession = gamesSession.get(idSession!);

      const tank = gameSession!.board[select!.row][select!.col] as ITank;
      let board: Board = [];
      const turn =
        (player === 1 && gameSession!.isWhiteTurn) || (player !== 1 && !gameSession!.isWhiteTurn);

      if (!(tank && turn && tank.player === player && tank.isAlive)) {
        console.log("click empty");
        gameSession!.board = structuredClone(gameSession!.prevBoard);
        board = gameSession!.board;

        gameSession!.selected = null;
        gameSession!.prevSelected = null;
        gameSession!.highlighted = new Set<string>();
      } else {
        console.log("click tank");
        if (gameSession!.selected) {
          console.log("click another tank");
          gameSession!.board = structuredClone(gameSession!.prevBoard);
          board = gameSession!.board;
        }
        gameSession!.selected = { row: select!.row, col: select!.col, rotate: tank.rotate };
        gameSession!.prevSelected = structuredClone(gameSession!.selected);
        gameSession!.highlighted = setHighlighted(gameSession!);
        gameSession!.move = (_typeTanks[tank.type] as ITankType).moves;
      }

      const user = userService.getByName(enemyPlayer);

      const payload = { board: gameSession!.board };
      io.to(user!.socketId).emit(Events.ENEMY_MOVED, payload);

      callback({
        success: true,
        board: board,
        highlighted: [...gameSession!.highlighted],
        selected: gameSession!.selected,
      });
    },
  );

  socket.on(
    Events.MOVE_FORWARD,
    (
      enemyPlayer: string,
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

      const idSession = playersGame.get(enemyPlayer);
      const gameSession = gamesSession.get(idSession!);

      if (!gameSession!.selected || gameSession!.move <= 0) {
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

      const { row, col } = gameSession!.selected;
      const tank = gameSession!.board[row][col] as ITank;
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

      const vectorRow = DIRS_ROTATE[tank.rotate as keyof typeof DIRS_ROTATE][0];
      const vectorCol = DIRS_ROTATE[tank.rotate as keyof typeof DIRS_ROTATE][1];

      let newRow = row + vectorRow;
      let newCol = col + vectorCol;

      if (newCol < 0 || newCol >= gameSession!.size) {
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
      if (checkMoveWin(tank, newRow, gameSession!.size)) {
        console.log("Kinght escaped");
        win = true;
        gameSession!.board[gameSession!.selected.row][gameSession!.selected.col] = null;
        gameSession!.selected = null;
        gameSession!.highlighted = new Set<string>();
      } else {
        if (
          checkPush(
            tank,
            gameSession!.board,
            { row: newRow, col: newCol },
            { row: vectorRow, col: vectorCol },
            gameSession!.size,
          )
        ) {
          console.log("tank push");
          const pushed = gameSession!.board[newRow][newCol];
          const newPushRow = newRow + vectorRow;
          const newPushCel = newCol + vectorCol;

          gameSession!.board[newRow][newCol] = null;
          gameSession!.board[newPushRow][newPushCel] = pushed;
        }

        if (newRow < 0 || newRow >= gameSession!.size || gameSession!.board[newRow][newCol]) {
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

        gameSession!.board[gameSession!.selected.row][gameSession!.selected.col] = null;
        gameSession!.selected = { row: newRow, col: newCol, rotate: tank.rotate };
        gameSession!.board[gameSession!.selected.row][gameSession!.selected.col] = tank;
        gameSession!.highlighted = setHighlighted(gameSession!);
        gameSession!.move -= 1;
      }

      const user = userService.getByName(enemyPlayer);

      const payload = { board: gameSession!.board };
      io.to(user!.socketId).emit(Events.ENEMY_MOVED, payload);

      callback({
        success: true,
        board: gameSession!.board,
        win: win,
        selected: gameSession!.selected,
        highlighted: [...gameSession!.highlighted],
        move: gameSession!.move,
      });
    },
  );

  socket.on(
    Events.MOVE_BACK,
    (
      enemyPlayer: string,
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

      const idSession = playersGame.get(enemyPlayer);
      const gameSession = gamesSession.get(idSession!);

      if (!gameSession!.selected || gameSession!.move <= 0) {
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

      const { row, col } = gameSession!.selected;
      const tank = gameSession!.board[row][col] as ITank;
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

      if (gameSession!.move !== (_typeTanks[tank.type] as ITankType).moves) {
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

      if (newCol < 0 || newCol >= gameSession!.size) {
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
      if (checkMoveWin(tank, newRow, gameSession!.size)) {
        console.log("Kinght escaped");
        win = true;
        gameSession!.board[gameSession!.selected.row][gameSession!.selected.col] = null;
        gameSession!.selected = null;
        gameSession!.highlighted = new Set<string>();
      } else {
        if (newRow < 0 || newRow >= gameSession!.size || gameSession!.board[newRow][newCol]) {
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

        gameSession!.board[gameSession!.selected.row][gameSession!.selected.col] = null;
        gameSession!.selected = { row: newRow, col: newCol, rotate: tank.rotate };
        gameSession!.board[gameSession!.selected.row][gameSession!.selected.col] = tank;
        gameSession!.highlighted = setHighlighted(gameSession!);
        gameSession!.move = 0;
      }

      const user = userService.getByName(enemyPlayer);

      const payload = { board: gameSession!.board };
      io.to(user!.socketId).emit(Events.ENEMY_MOVED, payload);

      callback({
        success: true,
        board: gameSession!.board,
        win: win,
        selected: gameSession!.selected,
        highlighted: [...gameSession!.highlighted],
        move: gameSession!.move,
      });
    },
  );

  socket.on(
    Events.TANK_ROTATE,
    (
      enemyPlayer: string,
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

      const idSession = playersGame.get(enemyPlayer);
      const gameSession = gamesSession.get(idSession!);

      if (!gameSession!.selected || gameSession!.move <= 0) {
        callback({
          success: false,
          board: [],
          selected: null,
          highlighted: [],
          move: -1,
        });
        return;
      }

      const { row, col } = gameSession!.selected;
      const tank = gameSession!.board[row][col] as ITank;
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

      gameSession!.selected.rotate = tank.rotate;
      gameSession!.board[row][col] = tank;
      gameSession!.highlighted = setHighlighted(gameSession!);
      gameSession!.move -= 1;

      const user = userService.getByName(enemyPlayer);

      const payload = { board: gameSession!.board };
      io.to(user!.socketId).emit(Events.ENEMY_MOVED, payload);

      callback({
        success: true,
        board: gameSession!.board,
        selected: gameSession!.selected,
        highlighted: [...gameSession!.highlighted],
        move: gameSession!.move,
      });
    },
  );

  //GAME
  function checkShoot(
    gameSession: GameSession,
    board: Board,
    typeTanks: TypeTanksMap,
    selected: Selected,
    shoted: Coord,
  ) {
    if (!gameSession.highlighted.has(`${shoted!.row},${shoted!.col}`)) {
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

  function checkEndMove(gameSession: GameSession) {
    if (gameSession!.selected === null || gameSession!.prevSelected === null) return false;
    return (
      gameSession!.selected.row !== gameSession!.prevSelected.row ||
      gameSession!.selected.col !== gameSession!.prevSelected.col ||
      gameSession!.selected.rotate !== gameSession!.prevSelected.rotate
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

  function checkMoveWin(tank: ITank, newRow: number, size: number) {
    let res = false;
    if ((tank.type === "wLTK" || tank.type === "wMTK" || tank.type === "wHTK") && newRow < 0) {
      console.log("white win");
      res = true;
    } else if (
      (tank.type === "bLTK" || tank.type === "bMTK" || tank.type === "bHTK") &&
      newRow === size
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
    size: number,
  ) {
    if (typeShot === "tank") {
      const rs = startRow + dr;
      const cs = startCol + dc;
      if (rs < 0 || rs >= size || cs < 0 || cs >= size) return;
      if (board?.[rs]?.[cs]) return;

      for (let d = startDist; d <= endDist; d++) {
        const r = startRow + dr * d;
        const c = startCol + dc * d;
        if (r < 0 || r >= size || c < 0 || c >= size) break;
        set.add(`${r},${c}`);
        if (board?.[r]?.[c]) break;
      }
    } else if (typeShot === "arta") {
      const rs = startRow + dr;
      const cs = startCol + dc;
      if (rs < 0 || rs >= size || cs < 0 || cs >= size) return;

      for (let d = startDist; d <= endDist; d++) {
        const r = startRow + dr * d;
        const c = startCol + dc * d;
        if (r < 0 || r >= size || c < 0 || c >= size) break;
        set.add(`${r},${c}`);
      }
    }
  }

  function setHighlighted(gameSession: GameSession) {
    const set = new Set<string>();
    if (!gameSession.selected) return set;

    const { row, col } = gameSession.selected;
    const tank = gameSession.board?.[row]?.[col] as ITank;
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
          gameSession.board,
          row,
          col,
          typeTank.shot.type,
          dir,
          typeTank.shot.min,
          typeTank.shot.max,
          gameSession.size,
        );
      }
    }
    return set;
  }

  function addHistory(gameSession: GameSession, shoted: Coord = null) {
    const number = gameSession.history.size + 1;
    const turn = gameSession.isWhiteTurn ? "w" : "b";
    const startCoord = `${gameSession.letters[gameSession.prevSelected!.col]}${gameSession.prevSelected!.row + 1}`;
    const endCoord = `${gameSession.letters[gameSession.selected!.col]}${gameSession.selected!.row + 1}`;
    const rotate = gameSession.selected!.rotate;

    if (shoted) {
      const enemy = `${gameSession.letters[shoted!.col]}${shoted!.row + 1}`;
      gameSession.history.add(
        `${number}-${turn}) ${startCoord} > ${endCoord}/${rotate} (${enemy})`,
      );
    } else {
      gameSession.history.add(`${number}-${turn}) ${startCoord} > ${endCoord}/${rotate}`);
    }
  }

  function checkPush(tank: ITank, board: Board, newCoord: Coord, vector: Coord, size: number) {
    if (tank.type !== "wHB" && tank.type !== "bHB") return false;
    console.log("row ", newCoord!.row);
    console.log("col ", newCoord!.col);
    console.log(board[newCoord!.row][newCoord!.col]);
    if (
      newCoord!.row < 0 ||
      newCoord!.row >= size ||
      (board[newCoord!.row][newCoord!.col] &&
        !_typeTanks[board[newCoord!.row][newCoord!.col]!.type].isPush) ||
      (board[newCoord!.row][newCoord!.col] &&
        (board[newCoord!.row][newCoord!.col] as ITank).isAlive)
    )
      return false;

    newCoord!.row = newCoord!.row + vector!.row;
    newCoord!.col = newCoord!.col + vector!.col;

    if (newCoord!.col < 0 || newCoord!.col >= size || newCoord!.row < 0 || newCoord!.row >= size)
      return false;
    if (board[newCoord!.row][newCoord!.col]) return false;

    return true;
  }
};
