import { useState, useCallback } from 'react';
import type { SuguruBoard, Cell as CellType } from '@/types/suguru';
import { CellComponent } from './Cell';
import { validateMove, checkWin } from '@/lib/suguruGenerator';
import { cn } from '@/lib/utils';

interface BoardProps {
  board: SuguruBoard;
  onBoardChange: (board: SuguruBoard) => void;
  onWin: () => void;
}

export function Board({ board, onBoardChange, onWin }: BoardProps) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<number | null>(null);

  const handleCellClick = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
  }, []);

  const handleMouseEnter = useCallback((regionId: number) => {
    setHoveredRegionId(regionId);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredRegionId(null);
  }, []);


  const handleNumberInput = useCallback((num: number | null) => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    const cell = board.cells[row][col];
    
    if (cell.isFixed) return;

    // Validate the move
    const isValid = validateMove(board, row, col, num);
    
    // Update the board
    const newBoard: SuguruBoard = {
      ...board,
      cells: board.cells.map((r, ri) =>
        r.map((c, ci) => {
          if (ri === row && ci === col) {
            return { ...c, value: num, isValid };
          }
          return c;
        })
      ),
    };

    // Update validity of adjacent cells and same region cells
    newBoard.cells = updateValidity(newBoard);

    onBoardChange(newBoard);

    // Check for win
    if (checkWin(newBoard)) {
      onWin();
    }
  }, [selectedCell, board, onBoardChange, onWin]);

  const getRegionColor = (regionId: number): string => {
    return board.regions[regionId]?.color || 'bg-gray-100 border-gray-300';
  };

  const isRegionHighlighted = (regionId: number, rowIndex: number, colIndex: number) => {
    // Highlight if hovered
    if (hoveredRegionId === regionId) return true;
    
    // Highlight if current cell is selected and belongs to this region
    if (selectedCell && 
        board.cells[selectedCell.row][selectedCell.col].regionId === regionId) {
      return true;
    }

    return false;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        className="inline-grid gap-0 border-2 border-slate-400 p-1 bg-slate-200 rounded-lg"
        style={{
          gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))`,
        }}
      >
        {board.cells.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <CellComponent
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              regionColor={getRegionColor(cell.regionId)}
              isSelected={
                selectedCell?.row === rowIndex && selectedCell?.col === colIndex
              }
              isRegionHovered={isRegionHighlighted(cell.regionId, rowIndex, colIndex)}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              onMouseEnter={() => handleMouseEnter(cell.regionId)}
              onMouseLeave={handleMouseLeave}
              onNumberInput={handleNumberInput}
            />
          ))
        )}
      </div>

      {/* Number Pad */}
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {Array.from({ length: board.maxNumber }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => handleNumberInput(num)}
            disabled={!selectedCell || board.cells[selectedCell.row][selectedCell.col].isFixed}
            className={cn(
              'w-10 h-10 rounded-lg font-semibold text-lg transition-all',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'active:scale-95'
            )}
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => handleNumberInput(null)}
          disabled={!selectedCell || board.cells[selectedCell.row][selectedCell.col].isFixed}
          className={cn(
            'w-10 h-10 rounded-lg font-semibold text-lg transition-all',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'active:scale-95'
          )}
        >
          ×
        </button>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Кликните на ячейку и введите цифру с клавиатуры или нажмите на кнопку
      </p>
    </div>
  );
}

function updateValidity(board: SuguruBoard): CellType[][] {
  return board.cells.map((row, ri) =>
    row.map((cell, ci) => {
      if (cell.value === null) return { ...cell, isValid: true };
      const isValid = validateMove(board, ri, ci, cell.value);
      return { ...cell, isValid };
    })
  );
}
