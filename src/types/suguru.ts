export interface Cell {
  row: number;
  col: number;
  value: number | null;
  regionId: number;
  isFixed: boolean;
  isValid: boolean;
}

export interface Region {
  id: number;
  cells: { row: number; col: number }[];
  color: string;
}

export interface SuguruBoard {
  rows: number;
  cols: number;
  maxNumber: number;
  cells: Cell[][];
  regions: Region[];
}

export interface GameSettings {
  rows: number;
  cols: number;
  maxNumber: number;
  openCellsCount: number;
  isMaxNumberRandom?: boolean;
  isOpenCellsRandom?: boolean;
}

export type GameState = 'settings' | 'playing' | 'completed';

export const REGION_COLORS = [
  'bg-rose-100 border-rose-300',
  'bg-sky-100 border-sky-300',
  'bg-emerald-100 border-emerald-300',
  'bg-amber-100 border-amber-300',
  'bg-violet-100 border-violet-300',
  'bg-cyan-100 border-cyan-300',
  'bg-fuchsia-100 border-fuchsia-300',
  'bg-lime-100 border-lime-300',
  'bg-orange-100 border-orange-300',
  'bg-indigo-100 border-indigo-300',
  'bg-teal-100 border-teal-300',
  'bg-pink-100 border-pink-300',
];
