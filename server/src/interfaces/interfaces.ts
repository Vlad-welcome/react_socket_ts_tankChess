export interface IUser {
  username: string;
  socketId: string;
}

export interface ITankArmor {
  front: number;
  back: number;
  side: number;
}

export interface ITankShot {
  sides: number;
  min: number;
  max: number;
  type: "tank" | "arta";
}

export interface ITankType {
  img: string;
  armor: ITankArmor;
  shot: ITankShot;
  damage: number;
  moves: number;
  isPush: boolean;
}
export interface IWallType {
  img: string;
  isPush: boolean;
}
export type TankType = ITankType | IWallType;
export type TypeTanksMap = Record<string, TankType>;

export interface ITank {
  type: string;
  rotate: number;
  player: number;
  isAlive: boolean;
}
export interface IWall {
  type: string;
}
export type Cell = ITank | IWall | null;
export type Board = Cell[][];

export interface ICoord {
  row: number;
  col: number;
}
export type Coord = ICoord | null;

export interface ISelected extends ICoord {
  rotate: number;
}
export type Selected = ISelected | null;

export interface IGameSession {
  board: Board;
  prevBoard: Board;
  size: number;
  isWhiteTurn: boolean;
  selected: Selected;
  prevSelected: Selected;
  move: number;
  highlighted: Set<string>;
  history: Set<string>;
  letters: string[];
}
export type GameSession = IGameSession;
