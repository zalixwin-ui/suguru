import type { Cell, Region, SuguruBoard, GameSettings } from '@/types/suguru';
import { REGION_COLORS } from '@/types/suguru';

export class SuguruGenerator {
  private rows: number;
  private cols: number;
  private maxNumber: number;
  private board: Cell[][];
  private regions: Region[];

  constructor(settings: GameSettings) {
    this.rows = settings.rows;
    this.cols = settings.cols;
    this.maxNumber = settings.maxNumber;
    this.board = [];
    this.regions = [];
  }

  async generate(onProgress?: (attempt: number) => void): Promise<SuguruBoard> {
    let attempts = 0;
    const maxAttempts = 100; // Reduced max attempts to avoid long freezes

    while (attempts < maxAttempts) {
      if (onProgress) {
        onProgress(attempts + 1);
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      try {
        // Initialize empty board
        this.board = Array(this.rows).fill(null).map((_, row) =>
          Array(this.cols).fill(null).map((_, col) => ({
            row,
            col,
            value: null,
            regionId: -1,
            isFixed: false,
            isValid: true,
          }))
        );

        // Generate regions
        this.regions = this.generateRegions();
        
        // Assign regions to cells
        this.regions.forEach((region, index) => {
          region.cells.forEach(({ row, col }) => {
            this.board[row][col].regionId = index;
          });
        });

        // Solve the puzzle (fill with valid numbers)
        if (this.solvePuzzle()) {
          return {
            rows: this.rows,
            cols: this.cols,
            maxNumber: this.maxNumber,
            cells: this.board,
            regions: this.regions,
          };
        }
      } catch (e) {
        // Ignore errors and retry
      }

      attempts++;
    }

    throw new Error(`Failed to generate a valid puzzle after ${maxAttempts} attempts`);
  }

  private generateRegions(): Region[] {
    const regions: Region[] = [];
    const visited = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
    let regionId = 0;

    // Try to fill the board with regions
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (!visited[row][col]) {
          const regionSize = this.getRandomRegionSize();
          const regionCells = this.growRegion(row, col, regionSize, visited);
          
          if (regionCells.length > 0) {
            regions.push({
              id: regionId,
              cells: regionCells,
              color: REGION_COLORS[regionId % REGION_COLORS.length],
            });
            regionId++;
          }
        }
      }
    }

    // Post-processing: Merge small regions (size 1) into neighbors if possible
    let merged = true;
    let mergeAttempts = 0;
    // Add a safety limit for merge attempts to prevent infinite loops
    while (merged && mergeAttempts < 100) {
      merged = false;
      mergeAttempts++;
      
      for (let i = 0; i < regions.length; i++) {
        const region = regions[i];
        if (region.cells.length === 1) {
          // Try to find a neighbor region that can accept this cell
          const cell = region.cells[0];
          const neighbors = this.getNeighbors(cell.row, cell.col);
          
          for (const neighborPos of neighbors) {
            const neighborRegionId = regions.findIndex(r => 
              r.id !== region.id && 
              r.cells.some(c => c.row === neighborPos.row && c.col === neighborPos.col)
            );
            
            if (neighborRegionId !== -1) {
              const neighborRegion = regions[neighborRegionId];
              // Check if merging respects maxNumber constraint
              if (neighborRegion.cells.length < this.maxNumber) {
                // Merge
                neighborRegion.cells.push(cell);
                regions.splice(i, 1);
                merged = true;
                break;
              }
            }
          }
          if (merged) break;
        }
      }
    }
    
    // Re-assign IDs and colors
    return regions.map((r, idx) => ({
      ...r,
      id: idx,
      color: REGION_COLORS[idx % REGION_COLORS.length]
    }));
  }

  private getRandomRegionSize(): number {
    // Bias towards larger regions for better puzzles
    const minSize = 1;
    const maxSize = this.maxNumber;
    
    // Weighted random: 50% chance for max size, rest distributed
    if (Math.random() > 0.5) return maxSize;
    return Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
  }

  private growRegion(
    startRow: number,
    startCol: number,
    targetSize: number,
    visited: boolean[][]
  ): { row: number; col: number }[] {
    const cells: { row: number; col: number }[] = [];
    const queue: { row: number; col: number }[] = [{ row: startRow, col: startCol }];
    
    visited[startRow][startCol] = true;
    cells.push({ row: startRow, col: startCol });

    while (cells.length < targetSize && queue.length > 0) {
      // Pick random cell from queue to grow from (DFS-ish or Random Prim's)
      // Using random index makes it grow in unpredictable shapes
      const idx = Math.floor(Math.random() * queue.length);
      const current = queue[idx];
      
      // Get unvisited neighbors
      const neighbors = this.getUnvisitedNeighbors(current.row, current.col, visited);
      
      if (neighbors.length === 0) {
        queue.splice(idx, 1); // Remove if no growth possible
        continue;
      }

      // Pick one random neighbor
      const neighborIdx = Math.floor(Math.random() * neighbors.length);
      const neighbor = neighbors[neighborIdx];
      
      visited[neighbor.row][neighbor.col] = true;
      cells.push(neighbor);
      queue.push(neighbor);
    }

    return cells;
  }

  private getUnvisitedNeighbors(row: number, col: number, visited: boolean[][]): { row: number; col: number }[] {
    const neighbors: { row: number; col: number }[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (
        newRow >= 0 && newRow < this.rows &&
        newCol >= 0 && newCol < this.cols &&
        !visited[newRow][newCol]
      ) {
        neighbors.push({ row: newRow, col: newCol });
      }
    }

    return neighbors;
  }

  private getNeighbors(row: number, col: number): { row: number; col: number }[] {
    const neighbors: { row: number; col: number }[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
        neighbors.push({ row: newRow, col: newCol });
      }
    }

    return neighbors;
  }

  private solvePuzzle(): boolean {
    // Find empty cell with fewest options (heuristic) or just first empty
    // For Suguru, simple backtracking is usually fast enough
    return this.solveCell(0, 0);
  }

  private solveCell(row: number, col: number): boolean {
    if (row === this.rows) return true;
    
    const nextRow = col === this.cols - 1 ? row + 1 : row;
    const nextCol = col === this.cols - 1 ? 0 : col + 1;

    if (this.board[row][col].value !== null) {
      return this.solveCell(nextRow, nextCol);
    }

    const regionId = this.board[row][col].regionId;
    // Safety check
    if (regionId === -1 || !this.regions[regionId]) return false;

    const regionSize = this.regions[regionId].cells.length;
    const numbers = this.shuffleArray([...Array(regionSize)].map((_, i) => i + 1));

    for (const num of numbers) {
      if (this.isValidPlacement(row, col, num)) {
        this.board[row][col].value = num;
        
        if (this.solveCell(nextRow, nextCol)) {
          return true;
        }
        
        this.board[row][col].value = null;
      }
    }

    return false;
  }

  private isValidPlacement(row: number, col: number, num: number): boolean {
    const regionId = this.board[row][col].regionId;
    
    // Check region constraint (no duplicate numbers in region)
    for (const cell of this.regions[regionId].cells) {
      if (cell.row === row && cell.col === col) continue;
      if (this.board[cell.row][cell.col].value === num) {
        return false;
      }
    }

    // Check adjacency constraint (no same numbers in adjacent cells including diagonals)
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (
        newRow >= 0 && newRow < this.rows &&
        newCol >= 0 && newCol < this.cols &&
        this.board[newRow][newCol].value === num
      ) {
        return false;
      }
    }

    return true;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  public createGameBoard(openCellsCount: number): SuguruBoard {
    // Deep copy the solved board to create game board
    const gameBoard: SuguruBoard = {
      rows: this.rows,
      cols: this.cols,
      maxNumber: this.maxNumber,
      cells: this.board.map(row => 
        row.map(cell => ({
          row: cell.row,
          col: cell.col,
          value: cell.value, // Copy the solved value
          regionId: cell.regionId,
          isFixed: false, // Reset to not fixed initially
          isValid: true,
        }))
      ),
      regions: this.regions.map(r => ({ ...r })),
    };

    // Verify board has values
    const hasValues = gameBoard.cells.some(row => row.some(cell => cell.value !== null));
    if (!hasValues) {
      throw new Error('Generated board has no values');
    }

    // Select random cells to keep open (fixed)
    const allCells: { row: number; col: number }[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        allCells.push({ row: r, col: c });
      }
    }

    // Shuffle and select cells to reveal
    const shuffled = this.shuffleArray(allCells);
    const cellsToReveal = Math.min(openCellsCount, allCells.length);

    // Mark selected cells as fixed (revealed)
    for (let i = 0; i < cellsToReveal; i++) {
      const { row, col } = shuffled[i];
      gameBoard.cells[row][col].isFixed = true;
    }

    // Clear non-fixed cells (hide their values)
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!gameBoard.cells[r][c].isFixed) {
          gameBoard.cells[r][c].value = null;
        }
      }
    }

    return gameBoard;
  }
}

export function validateMove(board: SuguruBoard, row: number, col: number, num: number | null): boolean {
  if (num === null) return true;

  const regionId = board.cells[row][col].regionId;
  
  // Check region constraint
  for (const cell of board.regions[regionId].cells) {
    if (cell.row === row && cell.col === col) continue;
    if (board.cells[cell.row][cell.col].value === num) {
      return false;
    }
  }

  // Check adjacency constraint
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
    
    if (
      newRow >= 0 && newRow < board.rows &&
      newCol >= 0 && newCol < board.cols &&
      board.cells[newRow][newCol].value === num
    ) {
      return false;
    }
  }

  return true;
}

export function checkWin(board: SuguruBoard): boolean {
  // Check all cells are filled
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (board.cells[r][c].value === null) return false;
    }
  }

  // Check all constraints
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const num = board.cells[r][c].value;
      if (num === null) return false;
      
      // Temporarily clear to validate
      board.cells[r][c].value = null;
      const isValid = validateMove(board, r, c, num);
      board.cells[r][c].value = num;
      
      if (!isValid) return false;
    }
  }

  return true;
}
