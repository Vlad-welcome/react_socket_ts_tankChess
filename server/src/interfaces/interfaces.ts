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
}
export interface IWallType {
  img: string;
}
export type TankType = ITankType | IWallType;
export type TypeTanksMap = Record<string, TankType>;

export interface ITank {
  type: string;
  rotate: number;
  player: number;
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
