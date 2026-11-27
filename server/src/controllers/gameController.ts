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
  IWallType,
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
  mud: { object: null, effect: { type: "mud" } },
  hedg: { object: null, effect: { type: "hedg" } },
  wate: { object: null, effect: { type: "wate" } },
  mine: { object: null, effect: { type: "mine" } },
  tree: { object: { type: "tree" }, effect: null },
  lwal: { object: { type: "lwal" }, effect: null },
  wall: { object: { type: "wall" }, effect: null },
  wLTK: { object: { type: "wLTK", player: 1, rotate: 0, isAlive: true }, effect: null },
  wMTK: { object: { type: "wMTK", player: 1, rotate: 0, isAlive: true }, effect: null },
  wHTK: { object: { type: "wHTK", player: 1, rotate: 0, isAlive: true }, effect: null },
  wRTK: { object: { type: "wRTK", player: 1, rotate: 0, isAlive: true }, effect: null },
  wLT: { object: { type: "wLT", player: 1, rotate: 0, isAlive: true }, effect: null },
  wMT: { object: { type: "wMT", player: 1, rotate: 0, isAlive: true }, effect: null },
  wHT: { object: { type: "wHT", player: 1, rotate: 0, isAlive: true }, effect: null },
  wTD: { object: { type: "wTD", player: 1, rotate: 0, isAlive: true }, effect: null },
  wHM: { object: { type: "wHM", player: 1, rotate: 0, isAlive: true }, effect: null },
  wRT: { object: { type: "wRT", player: 1, rotate: 0, isAlive: true }, effect: null },
  wHB: { object: { type: "wHB", player: 1, rotate: 0, isAlive: true }, effect: null },
  wST: { object: { type: "wST", player: 1, rotate: 0, isAlive: true }, effect: null },
  wLH: { object: { type: "wLH", player: 1, rotate: 0, isAlive: true }, effect: null },
  wTT: { object: { type: "wTT", player: 1, rotate: 0, isAlive: true }, effect: null },
  wTH: { object: { type: "wTH", player: 1, rotate: 0, isAlive: true }, effect: null },
  wAG: { object: { type: "wAG", player: 1, rotate: 0, isAlive: true }, effect: null },
  wLM: { object: { type: "wLM", player: 1, rotate: 0, isAlive: true }, effect: null },
  wHH: { object: { type: "wHH", player: 1, rotate: 0, isAlive: true }, effect: null },
  wRL: { object: { type: "wRL", player: 1, rotate: 0, isAlive: true }, effect: null },
  wAM: { object: { type: "wAM", player: 1, rotate: 0, isAlive: true }, effect: null },
  wMS: { object: { type: "wMS", player: 1, rotate: 0, isAlive: true }, effect: null },
  wB: { object: { type: "wB", player: 1, rotate: 0, isAlive: true }, effect: null },
  wR: { object: { type: "wR", player: 1, rotate: 0, isAlive: true }, effect: null },
  bLTK: { object: { type: "bLTK", player: 2, rotate: 180, isAlive: true }, effect: null },
  bMTK: { object: { type: "bMTK", player: 2, rotate: 180, isAlive: true }, effect: null },
  bHTK: { object: { type: "bHTK", player: 2, rotate: 180, isAlive: true }, effect: null },
  bRTK: { object: { type: "bRTK", player: 2, rotate: 180, isAlive: true }, effect: null },
  bLT: { object: { type: "bLT", player: 2, rotate: 180, isAlive: true }, effect: null },
  bMT: { object: { type: "bMT", player: 2, rotate: 180, isAlive: true }, effect: null },
  bHT: { object: { type: "bHT", player: 2, rotate: 180, isAlive: true }, effect: null },
  bTD: { object: { type: "bTD", player: 2, rotate: 180, isAlive: true }, effect: null },
  bHM: { object: { type: "bHM", player: 2, rotate: 180, isAlive: true }, effect: null },
  bRT: { object: { type: "bRT", player: 2, rotate: 180, isAlive: true }, effect: null },
  bHB: { object: { type: "bHB", player: 2, rotate: 180, isAlive: true }, effect: null },
  bST: { object: { type: "bST", player: 2, rotate: 180, isAlive: true }, effect: null },
  bLH: { object: { type: "bLH", player: 2, rotate: 180, isAlive: true }, effect: null },
  bTT: { object: { type: "bTT", player: 1, rotate: 0, isAlive: true }, effect: null },
  bTH: { object: { type: "bTH", player: 1, rotate: 0, isAlive: true }, effect: null },
  bAG: { object: { type: "bAG", player: 1, rotate: 0, isAlive: true }, effect: null },
  bLM: { object: { type: "bLM", player: 1, rotate: 0, isAlive: true }, effect: null },
  bHH: { object: { type: "bHH", player: 1, rotate: 0, isAlive: true }, effect: null },
  bRL: { object: { type: "bRL", player: 1, rotate: 0, isAlive: true }, effect: null },
  bAM: { object: { type: "bAM", player: 1, rotate: 0, isAlive: true }, effect: null },
  bMS: { object: { type: "bMS", player: 1, rotate: 0, isAlive: true }, effect: null },
  bB: { object: { type: "bB", player: 1, rotate: 0, isAlive: true }, effect: null },
  bR: { object: { type: "bR", player: 1, rotate: 0, isAlive: true }, effect: null },
};

let _typeTanks: TypeTanksMap;
const ANGLE = 45;

const gamesSession = new Map<string, GameSession>();
export const playersGame = new Map<string, string>();

function initTypeTanksMap(SIZE: number) {
  let typeTanks: TypeTanksMap = {
    //block
    mud: {
      img: "/sprites/mud.png",
      isPush: false,
      isShotThrough: true,
    },
    hedg: {
      img: "/sprites/hedg.png",
      isPush: false,
      isShotThrough: false,
    },
    wate: {
      img: "/sprites/wate.png",
      isPush: false,
      isShotThrough: true,
    },
    mine: {
      img: "/sprites/mine.png",
      isPush: false,
      isShotThrough: true,
    },
    tree: {
      img: "/sprites/tree.png",
      isPush: false,
      isShotThrough: false,
    },
    lwal: {
      img: "/sprites/lwal.png",
      isPush: false,
      isShotThrough: true,
    },
    wall: {
      img: "/sprites/wall.png",
      isPush: false,
      isShotThrough: false,
    },
    //white
    wLTK: {
      img: "/sprites/wLTK.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 5,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    wMTK: {
      img: "/sprites/wMTK.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 2,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    wHTK: {
      img: "/sprites/wHTK.png",
      armor: { front: 3, side: 2, back: 1 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 3,
      moves: 3,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: true,
      isClearMine: false,
      isDoubleShot: false,
    },
    wRTK: {
      img: "/sprites/wRTK.png",
      armor: { front: 0, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 6,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    wLT: {
      img: "/sprites/wLT.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 5,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    wMT: {
      img: "/sprites/wMT.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 2,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    wHT: {
      img: "/sprites/wHT.png",
      armor: { front: 3, side: 2, back: 1 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 3,
      moves: 3,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: true,
      isClearMine: false,
      isDoubleShot: false,
    },
    wTD: {
      img: "/sprites/wTD.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 1, min: 2, max: SIZE, type: "tank" },
      damage: 4,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    wHM: {
      img: "/sprites/wHM.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 1, min: 3, max: 5, type: "arta" },
      damage: 5,
      moves: 3,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    wRT: {
      img: "/sprites/wRT.png",
      armor: { front: 0, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 6,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    wHB: {
      img: "/sprites/wHB.png",
      armor: { front: 3, side: 2, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 3,
      moves: 3,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: true,
      isClearMine: false,
      isDoubleShot: false,
    },
    wST: {
      img: "/sprites/wST.png",
      armor: { front: 4, side: 3, back: 2 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 4,
      moves: 2,
      isPush: false,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: true,
      isClearMine: false,
      isDoubleShot: false,
    },
    wLH: {
      img: "/sprites/wLH.png",
      armor: { front: 0, side: 0, back: 0 },
      shot: { sides: 1, min: 4, max: 7, type: "arta" },
      damage: 3,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    wTT: {
      img: "/sprites/wTT.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 21,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: true,
    },
    wTH: {
      img: "/sprites/wTH.png",
      armor: { front: 0, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 2,
      moves: 5,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    wAG: {
      img: "/sprites/wAG.png",
      armor: { front: 3, side: 0, back: 0 },
      shot: { sides: 1, min: 2, max: SIZE, type: "tank" },
      damage: 3,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    wLM: {
      img: "/sprites/wLM.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 1, min: 2, max: 3, type: "arta" },
      damage: 2,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    wHH: {
      img: "/sprites/wHH.png",
      armor: { front: 1, side: 1, back: 0 },
      shot: { sides: 1, min: 5, max: 9, type: "arta" },
      damage: 4,
      moves: 3,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    wRL: {
      img: "/sprites/wRL.png",
      armor: { front: 0, side: 0, back: 0 },
      shot: { sides: 1, min: 3, max: 6, type: "arta" },
      damage: 5,
      moves: 3,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: true,
    },
    wAM: {
      img: "/sprites/wAM.png",
      armor: { front: 0, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 5,
      isPush: true,
      isShotThrough: false,
      isMoveWater: true,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    wMS: {
      img: "/sprites/wMS.png",
      armor: { front: 2, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 2,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: true,
      isDoubleShot: false,
    },
    wB: {
      img: "/sprites/wB.png",
      armor: { front: 1, side: 1, back: 1 },
      shot: { sides: 0, min: 0, max: 0, type: "tank" },
      damage: 0,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: true,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    wR: {
      img: "/sprites/wR.png",
      armor: { front: 1, side: 1, back: 0 },
      shot: { sides: 1, min: 1, max: 1, type: "repair" },
      damage: 0,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    //Black
    bLTK: {
      img: "/sprites/bLTK.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 5,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    bMTK: {
      img: "/sprites/bMTK.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 2,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    bHTK: {
      img: "/sprites/bHTK.png",
      armor: { front: 3, side: 2, back: 1 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 3,
      moves: 3,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: true,
      isClearMine: false,
      isDoubleShot: false,
    },
    bRTK: {
      img: "/sprites/bRTK.png",
      armor: { front: 0, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 6,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    bLT: {
      img: "/sprites/bLT.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 5,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    bMT: {
      img: "/sprites/bMT.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 2,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    bHT: {
      img: "/sprites/bHT.png",
      armor: { front: 3, side: 2, back: 1 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 3,
      moves: 3,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: true,
      isClearMine: false,
      isDoubleShot: false,
    },
    bTD: {
      img: "/sprites/bTD.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 1, min: 2, max: SIZE, type: "tank" },
      damage: 4,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    bHM: {
      img: "/sprites/bHM.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 1, min: 3, max: 5, type: "arta" },
      damage: 5,
      moves: 3,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    bRT: {
      img: "/sprites/bRT.png",
      armor: { front: 0, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 6,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    bHB: {
      img: "/sprites/bHB.png",
      armor: { front: 3, side: 2, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 3,
      moves: 3,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: true,
      isClearMine: false,
      isDoubleShot: false,
    },
    bST: {
      img: "/sprites/bST.png",
      armor: { front: 4, side: 3, back: 2 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 4,
      moves: 2,
      isPush: false,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: true,
      isClearMine: false,
      isDoubleShot: false,
    },
    bLH: {
      img: "/sprites/bLH.png",
      armor: { front: 0, side: 0, back: 0 },
      shot: { sides: 1, min: 4, max: 7, type: "arta" },
      damage: 3,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    bTT: {
      img: "/sprites/bTT.png",
      armor: { front: 2, side: 1, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 21,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: true,
    },
    bTH: {
      img: "/sprites/bTH.png",
      armor: { front: 0, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 2,
      moves: 5,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    bAG: {
      img: "/sprites/bAG.png",
      armor: { front: 3, side: 0, back: 0 },
      shot: { sides: 1, min: 2, max: SIZE, type: "tank" },
      damage: 3,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    bLM: {
      img: "/sprites/bLM.png",
      armor: { front: 1, side: 0, back: 0 },
      shot: { sides: 1, min: 2, max: 3, type: "arta" },
      damage: 2,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    bHH: {
      img: "/sprites/bHH.png",
      armor: { front: 1, side: 1, back: 0 },
      shot: { sides: 1, min: 5, max: 9, type: "arta" },
      damage: 4,
      moves: 3,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    bRL: {
      img: "/sprites/bRL.png",
      armor: { front: 0, side: 0, back: 0 },
      shot: { sides: 1, min: 3, max: 6, type: "arta" },
      damage: 5,
      moves: 3,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: true,
    },
    bAM: {
      img: "/sprites/bAM.png",
      armor: { front: 0, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 1,
      moves: 5,
      isPush: true,
      isShotThrough: false,
      isMoveWater: true,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    bMS: {
      img: "/sprites/bMS.png",
      armor: { front: 2, side: 0, back: 0 },
      shot: { sides: 3, min: 2, max: SIZE, type: "tank" },
      damage: 2,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: true,
      isDoubleShot: false,
    },
    bB: {
      img: "/sprites/bB.png",
      armor: { front: 1, side: 1, back: 1 },
      shot: { sides: 0, min: 0, max: 0, type: "tank" },
      damage: 0,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: true,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
    bR: {
      img: "/sprites/bR.png",
      armor: { front: 1, side: 1, back: 0 },
      shot: { sides: 1, min: 1, max: 1, type: "repair" },
      damage: 0,
      moves: 4,
      isPush: true,
      isShotThrough: false,
      isMoveWater: false,
      isCutTree: false,
      isClearMine: false,
      isDoubleShot: false,
    },
  };
  return typeTanks;
}
function initBoard(map: string, gameSession: GameSession) {
  gameSession.map = map;
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
  gameSession.board = Array.from({ length: boardLength }, () =>
    Array.from({ length: boardLength }, () => ({ object: null, effect: null }) as Cell),
  );

  for (let i = 0; i < boardLength; i++) {
    for (let j = 0; j < boardLength; j++) {
      const cell: string = board[i][j].trim();

      if (cell) {
        gameSession.board[i][j] = structuredClone(objects[cell]);
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
          map: "",
          whitePlayer: curUser.username,
          blackPlayer: user.username,
          wasShot: false,
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

        let player;
        if (gameSession.whitePlayer === user.username) {
          player = 1;
        }
        if (gameSession.blackPlayer === user.username) {
          player = 2;
        }
        // Пуш приглашённому игроку
        const payload = {
          enemyPlayer: curUser.username,
          board: gameSession.board,
          typeTanks: _typeTanks,
          size: gameSession.size,
          map: map,
          player: player,
          turn:
            (gameSession.isWhiteTurn && player === 1) || (!gameSession.isWhiteTurn && player !== 1),
          history: gameSession?.history ? [...gameSession.history] : null,
        };
        io.to(user.socketId).emit(Events.INVITED, payload);

        callback({ success: true });
        return;
      }

      callback({ success: false });
    },
  );

  socket.on(Events.CONTINUE_GAME, (callback: (res: { success: boolean }) => void) => {
    console.log("Server Events.CONTINUE_GAME");

    const curUser = userService.getBySocket(socket.id);
    const game = playersGame.get(curUser!.username);
    const enemyName = game?.split(",").filter((p) => p != curUser?.username)[0];
    const user = userService.getByName(enemyName!);

    if (user && curUser) {
      const gameSession = gamesSession.get(game!);

      console.log(`playersGame ${playersGame.size}`);
      console.log(`gamesSession ${gamesSession.size}`);

      let player;
      if (gameSession!.whitePlayer === user.username) {
        player = 1;
      }
      if (gameSession!.blackPlayer === user.username) {
        player = 2;
      }

      // Пуш приглашённому игроку
      const payload = {
        text: `Вас приглашает продолжить игру: ${curUser.username}. Принять?`,
        enemyPlayer: curUser.username,
        board: gameSession!.board,
        typeTanks: _typeTanks,
        size: gameSession!.size,
        map: gameSession!.map,
        player: player,
        turn:
          (gameSession!.isWhiteTurn && player === 1) || (!gameSession!.isWhiteTurn && player !== 1),
        history: gameSession?.history ? [...gameSession.history] : null,
      };
      io.to(user.socketId).emit(Events.INVITED, payload);

      callback({ success: true });
      return;
    }

    callback({ success: false });
  });

  socket.on(Events.GAME_START, (enemyPlayer: string, map: string) => {
    console.log("Server Events.GAME_START");

    const user = userService.getByName(enemyPlayer);
    const curUser = userService.getBySocket(socket.id);

    if (user && curUser) {
      const idSession = playersGame.get(user.username);
      const gameSession = gamesSession.get(idSession!);

      let player;
      if (gameSession!.whitePlayer === user.username) {
        player = 1;
      }
      if (gameSession!.blackPlayer === user.username) {
        player = 2;
      }

      const payload = {
        enemyPlayer: curUser.username,
        board: gameSession!.board,
        typeTanks: _typeTanks,
        size: gameSession!.size,
        map: map,
        player: player,
        turn:
          (gameSession!.isWhiteTurn && player === 1) || (!gameSession!.isWhiteTurn && player !== 1),
        history: gameSession?.history ? [...gameSession.history] : null,
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
        gameSession!.wasShot = false;

        let player;
        if (gameSession!.whitePlayer === enemyPlayer) {
          player = 1;
        }
        if (gameSession!.blackPlayer === enemyPlayer) {
          player = 2;
        }

        const payload = {
          board: gameSession!.board,
          history: [...gameSession!.history],
          turn:
            (player === 1 && gameSession!.isWhiteTurn) ||
            (player !== 1 && !gameSession!.isWhiteTurn),
        };
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
      callback: (res: {
        success: boolean;
        board: Board;
        win: boolean;
        history: string[];
        turn: boolean;
        highlighted: string[];
        move: number;
      }) => void,
    ) => {
      console.log("Server Events.SHOT");

      const idSession = playersGame.get(enemyPlayer);
      const gameSession = gamesSession.get(idSession!);

      if (!checkEndMove(gameSession!)) {
        console.log("no end move");
        callback({
          success: false,
          board: gameSession!.board,
          win: false,
          history: [],
          turn: false,
          highlighted: [],
          move: -1,
        });
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

        (gameSession!.board[shoted!.row][shoted!.col]?.object as ITank).isAlive = false;

        if (gameSession!.board[shoted!.row][shoted!.col]?.effect?.type === "wate") {
          if (gameSession!.board[shoted!.row][shoted!.col]?.object) {
            gameSession!.board[shoted!.row][shoted!.col]!.object = null;
          }
        }
      }

      if (isShoot) {
        addHistory(gameSession!, shoted);
      } else {
        addHistory(gameSession!);
      }

      if (
        (
          _typeTanks[
            gameSession!.board[gameSession!.selected!.row][gameSession!.selected!.col]!.object!.type
          ] as ITankType
        ).isDoubleShot &&
        !gameSession!.wasShot
      ) {
        gameSession!.highlighted = setHighlighted(gameSession!);
        gameSession!.wasShot = true;
      } else {
        gameSession!.isWhiteTurn = !gameSession!.isWhiteTurn;
        gameSession!.prevBoard = structuredClone(gameSession!.board);
        gameSession!.selected = null;
        gameSession!.highlighted = new Set();
        gameSession!.wasShot = false;
      }
      gameSession!.move = 0;

      const curUser = userService.getBySocket(socket.id);
      let player;
      if (gameSession!.whitePlayer === curUser!.username) {
        player = 1;
      }
      if (gameSession!.blackPlayer === curUser!.username) {
        player = 2;
      }

      const user = userService.getByName(enemyPlayer);
      const payload = {
        board: gameSession!.board,
        win,
        history: [...gameSession!.history],
        turn: !(
          (player === 1 && gameSession!.isWhiteTurn) ||
          (player !== 1 && !gameSession!.isWhiteTurn)
        ),
      };
      io.to(user!.socketId).emit(Events.SHOTED, payload);
      callback({
        success: true,
        board: gameSession!.board,
        highlighted: [...gameSession!.highlighted],
        win,
        history: [...gameSession!.history],
        move: gameSession!.move,
        turn:
          (player === 1 && gameSession!.isWhiteTurn) || (player !== 1 && !gameSession!.isWhiteTurn),
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
        move: number;
        history: string[];
      }) => void,
    ) => {
      console.log("Server Events.LEFT_CLICK");

      const idSession = playersGame.get(enemyPlayer);
      const gameSession = gamesSession.get(idSession!);

      const tank = gameSession!.board[select!.row][select!.col]?.object as ITank;
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
        if (gameSession!.wasShot) {
          let arr = Array.from(gameSession!.history);
          arr.pop();
          gameSession!.history = new Set(arr);
        }
        gameSession!.wasShot = false;
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

        if (
          gameSession!.board[gameSession!.selected.row][gameSession!.selected.col]?.effect?.type ===
          "mud"
        ) {
          gameSession!.move = 1;
        } else {
          gameSession!.move = (_typeTanks[tank.type] as ITankType).moves;
        }
      }

      const user = userService.getByName(enemyPlayer);

      const payload = { board: gameSession!.board, history: [...gameSession!.history] };
      io.to(user!.socketId).emit(Events.ENEMY_MOVED, payload);

      callback({
        success: true,
        board: board,
        highlighted: [...gameSession!.highlighted],
        selected: gameSession!.selected,
        move: gameSession!.move,
        history: [...gameSession!.history],
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
      const tank = gameSession!.board[row][col]?.object as ITank;
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
        gameSession!.board[gameSession!.selected.row][gameSession!.selected.col]!.object = null;
        gameSession!.selected = null;
        gameSession!.highlighted = new Set<string>();
        gameSession!.wasShot = false;
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
          const pushed = gameSession!.board[newRow][newCol]!.object;
          const newPushRow = newRow + vectorRow;
          const newPushCel = newCol + vectorCol;

          gameSession!.board[newRow][newCol]!.object = null;
          if (gameSession!.board[newPushRow][newPushCel]?.effect?.type === "mine") {
            gameSession!.board[newPushRow][newPushCel]!.effect = null;
          }
          if (gameSession!.board[newPushRow][newPushCel]?.effect?.type !== "wate") {
            gameSession!.board[newPushRow][newPushCel]!.object = pushed;
          }
        }

        let isWater = false;
        const effect = gameSession!.board[newRow][newCol]?.effect;
        if (effect) {
          isWater = effect.type === "wate";
        }

        if (
          newRow < 0 ||
          newRow >= gameSession!.size ||
          (gameSession!.board[newRow][newCol]?.object &&
            gameSession!.board[newRow][newCol]?.object!.type != "tree") ||
          (gameSession!.board[newRow][newCol]?.object?.type === "tree" &&
            !(_typeTanks[tank.type] as ITankType).isCutTree) ||
          (!(_typeTanks[tank.type] as ITankType).isMoveWater && isWater)
        ) {
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

        gameSession!.board[gameSession!.selected.row][gameSession!.selected.col]!.object = null;
        gameSession!.selected = { row: newRow, col: newCol, rotate: tank.rotate };
        const object =
          gameSession!.board[gameSession!.selected.row][gameSession!.selected.col]!.object;
        gameSession!.board[gameSession!.selected.row][gameSession!.selected.col]!.object = tank;

        if (
          gameSession!.board[gameSession!.selected.row][gameSession!.selected.col]?.effect?.type ===
          "mine"
        ) {
          gameSession!.board[gameSession!.selected.row][gameSession!.selected.col]!.effect = null;
          if ((_typeTanks[tank.type] as ITankType).isClearMine) {
            tank.isAlive = true;
            gameSession!.highlighted = setHighlighted(gameSession!);
            gameSession!.move -= 1;
          } else {
            tank.isAlive = false;
            gameSession!.highlighted = new Set();
            gameSession!.move = 0;
          }
        } else if (
          gameSession!.board[gameSession!.selected.row][gameSession!.selected.col]?.effect?.type ===
            "mud" ||
          object?.type === "tree"
        ) {
          gameSession!.highlighted = setHighlighted(gameSession!);
          gameSession!.move = 0;
        } else {
          gameSession!.highlighted = setHighlighted(gameSession!);
          gameSession!.move -= 1;
        }
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
      const tank = gameSession!.board[row][col]!.object as ITank;
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

      if (
        !(
          gameSession!.move === (_typeTanks[tank.type] as ITankType).moves ||
          gameSession!.board[row][col]?.effect?.type === "mud"
        )
      ) {
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
        gameSession!.board[gameSession!.selected.row][gameSession!.selected.col]!.object = null;
        gameSession!.selected = null;
        gameSession!.highlighted = new Set<string>();
        gameSession!.wasShot = false;
      } else {
        let isWater = false;
        const effect = gameSession!.board[newRow][newCol]?.effect;
        if (effect) {
          isWater = effect.type === "wate";
        }

        if (
          newRow < 0 ||
          newRow >= gameSession!.size ||
          (gameSession!.board[newRow][newCol]?.object &&
            gameSession!.board[newRow][newCol]?.object!.type != "tree") ||
          (gameSession!.board[newRow][newCol]?.object?.type === "tree" &&
            !(_typeTanks[tank.type] as ITankType).isCutTree) ||
          (!(_typeTanks[tank.type] as ITankType).isMoveWater && isWater)
        ) {
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

        gameSession!.board[gameSession!.selected.row][gameSession!.selected.col]!.object = null;
        gameSession!.selected = { row: newRow, col: newCol, rotate: tank.rotate };
        gameSession!.board[gameSession!.selected.row][gameSession!.selected.col]!.object = tank;
        gameSession!.move = 0;
        if (
          gameSession!.board[gameSession!.selected.row][gameSession!.selected.col]?.effect?.type ===
          "mine"
        ) {
          gameSession!.board[gameSession!.selected.row][gameSession!.selected.col]!.effect = null;
          if ((_typeTanks[tank.type] as ITankType).isClearMine) {
            tank.isAlive = true;
            gameSession!.highlighted = setHighlighted(gameSession!);
            gameSession!.move -= 1;
          } else {
            tank.isAlive = false;
            gameSession!.highlighted = new Set();
            gameSession!.move = 0;
          }
        } else {
          gameSession!.highlighted = setHighlighted(gameSession!);
        }
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
      const tank = gameSession!.board[row][col]!.object as ITank;
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
      gameSession!.board[row][col]!.object = tank;
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
    const tank = board[selected!.row][selected!.col]!.object as ITank;
    const shotedTank = board[shoted!.row][shoted!.col]!.object as ITank;

    if (tank && shotedTank && tank?.rotate >= 0 && shotedTank?.rotate >= 0) {
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
      //прямой выстрел

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
    const shotedTank = board[shoted!.row][shoted!.col]!.object as ITank;
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
      let isShotThrough = true;
      let cell = board?.[rs]?.[cs];
      if (cell) {
        if (cell?.effect) isShotThrough = (_typeTanks[cell.effect.type] as IWallType).isShotThrough;
        if (isShotThrough && cell?.object)
          isShotThrough = (_typeTanks[cell.object.type] as IWallType).isShotThrough;
      }
      if (!isShotThrough) return;

      for (let d = startDist; d <= endDist; d++) {
        const r = startRow + dr * d;
        const c = startCol + dc * d;
        if (r < 0 || r >= size || c < 0 || c >= size) break;
        set.add(`${r},${c}`);

        isShotThrough = true;
        cell = board?.[r]?.[c];
        if (cell) {
          if (cell?.effect)
            isShotThrough = (_typeTanks[cell.effect.type] as IWallType).isShotThrough;
          if (isShotThrough && cell?.object)
            isShotThrough = (_typeTanks[cell.object.type] as IWallType).isShotThrough;
        }
        if (!isShotThrough) return;
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
    const tank = gameSession.board?.[row]?.[col]?.object as ITank;
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

    if (
      newCoord!.row < 0 ||
      newCoord!.row >= size ||
      (board[newCoord!.row][newCoord!.col]!.object &&
        !_typeTanks[board[newCoord!.row][newCoord!.col]!.object!.type].isPush) ||
      (board[newCoord!.row][newCoord!.col]!.object &&
        (board[newCoord!.row][newCoord!.col]!.object as ITank).isAlive)
    )
      return false;

    newCoord!.row = newCoord!.row + vector!.row;
    newCoord!.col = newCoord!.col + vector!.col;

    if (newCoord!.col < 0 || newCoord!.col >= size || newCoord!.row < 0 || newCoord!.row >= size)
      return false;
    if (board[newCoord!.row][newCoord!.col]!.object) return false;

    return true;
  }
};
