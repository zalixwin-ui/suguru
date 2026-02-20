import { cn } from '@/lib/utils';
import type { Cell as CellType } from '@/types/suguru';

interface CellProps {
  cell: CellType;
  regionColor: string;
  isSelected: boolean;
  isRegionHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onNumberInput: (num: number | null) => void;
}

export function CellComponent({ 
  cell, 
  regionColor, 
  isSelected, 
  isRegionHovered,
  onClick, 
  onMouseEnter,
  onMouseLeave,
  onNumberInput 
}: CellProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (cell.isFixed) return;
    
    if (e.key >= '1' && e.key <= '9') {
      onNumberInput(parseInt(e.key));
    } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
      onNumberInput(null);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        'w-12 h-12 flex items-center justify-center text-xl font-semibold cursor-pointer',
        'border-2 transition-all duration-150 select-none outline-none',
        'focus:ring-2 focus:ring-primary focus:ring-offset-1',
        regionColor,
        isRegionHovered && 'brightness-90 ring-2 ring-inset ring-black/10 z-0',
        isSelected && 'ring-2 ring-primary ring-offset-1 scale-105 z-10',
        cell.isFixed && 'text-slate-800 font-bold',
        !cell.isFixed && cell.value !== null && 'text-primary',
        !cell.isValid && 'bg-red-100 border-red-400 text-red-600',
        !cell.isFixed && !isSelected && 'hover:brightness-95'
      )}
    >
      {cell.value || ''}
    </div>
  );
}
