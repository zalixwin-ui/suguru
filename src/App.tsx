import { useState, useCallback } from 'react';
import type { GameSettings, SuguruBoard, GameState } from '@/types/suguru';
import { SuguruGenerator } from '@/lib/suguruGenerator';
import { Settings } from '@/components/suguru/Settings';
import { Board } from '@/components/suguru/Board';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Trophy, RotateCcw, Settings2, Sparkles, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';

function App() {
  const [gameState, setGameState] = useState<GameState>('settings');
  const [board, setBoard] = useState<SuguruBoard | null>(null);
  const [showWinDialog, setShowWinDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationAttempt, setGenerationAttempt] = useState(0);
  const [currentSettings, setCurrentSettings] = useState<GameSettings | null>(null);

  const handleGenerate = useCallback(async (settings: GameSettings) => {
    setIsGenerating(true);
    setGenerationAttempt(1);
    setCurrentSettings(settings);
    
    // Allow UI to render the loading state
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      // Handle random settings
      const finalSettings = { ...settings };
      
      if (settings.isMaxNumberRandom) {
        // Random maxNumber between 3 and 7
        finalSettings.maxNumber = Math.floor(Math.random() * (7 - 3 + 1)) + 3;
      }

      if (settings.isOpenCellsRandom) {
        // Random openCellsCount
        const maxCells = settings.rows * settings.cols;
        const maxOpen = Math.min(maxCells - 5, Math.floor(maxCells * 0.7));
        const minOpen = 5;
        finalSettings.openCellsCount = Math.floor(Math.random() * (maxOpen - minOpen + 1)) + minOpen;
      }

      const generator = new SuguruGenerator(finalSettings);
      await generator.generate((attempt) => {
        setGenerationAttempt(attempt);
      });
      
      const gameBoard = generator.createGameBoard(finalSettings.openCellsCount);
      setBoard(gameBoard);
      setGameState('playing');
      toast.success('Поле успешно сгенерировано!');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось сгенерировать поле. Попробуйте другие настройки.');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleBoardChange = useCallback((newBoard: SuguruBoard) => {
    setBoard(newBoard);
  }, []);

  const handleWin = useCallback(() => {
    setShowWinDialog(true);
    setGameState('completed');
  }, []);

  const handleGoToSettings = useCallback(() => {
    setGameState('settings');
    setBoard(null);
    setShowWinDialog(false);
  }, []);

  const handlePlayAgain = useCallback(() => {
    if (currentSettings) {
      setShowWinDialog(false);
      handleGenerate(currentSettings);
    }
  }, [currentSettings, handleGenerate]);

  const handleRestart = useCallback(() => {
    if (!board) return;
    
    // Reset to initial state (clear non-fixed cells)
    const resetBoard: SuguruBoard = {
      ...board,
      cells: board.cells.map(row =>
        row.map(cell => ({
          ...cell,
          value: cell.isFixed ? cell.value : null,
          isValid: true,
        }))
      ),
    };
    setBoard(resetBoard);
    setGameState('playing');
    toast.info('Игра начата заново');
  }, [board]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Сугуру</h1>
              <p className="text-xs text-slate-500">Генератор головоломок</p>
            </div>
          </div>
          
          {gameState === 'playing' && board && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestart}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Заново
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoToSettings}
                className="flex items-center gap-2"
              >
                <Settings2 className="w-4 h-4" />
                Настройки
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {gameState === 'settings' ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-900">
                Добро пожаловать в Сугуру!
              </h2>
              <p className="text-slate-600 max-w-lg mx-auto">
                Сугуру — это логическая головоломка, где нужно заполнить поле цифрами, 
                следуя простым правилам: в каждом регионе цифры не должны повторяться, 
                а одинаковые цифры не могут быть соседями (включая диагонали).
              </p>
            </div>
            <Settings onGenerate={handleGenerate} />
          </div>
        ) : (
          board && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <Board
                    board={board}
                    onBoardChange={handleBoardChange}
                    onWin={handleWin}
                  />
                </CardContent>
              </Card>

              {/* Rules Reminder */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Правила игры:</h3>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Каждый цветной регион должен содержать цифры от 1 до N (где N — размер региона)</li>
                    <li>Одинаковые цифры не могут находиться в соседних клетках (включая диагонали)</li>
                    <li>Чёрные цифры даны изначально и не могут быть изменены</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )
        )}
      </main>

      {/* Win Dialog */}
      <Dialog open={showWinDialog} onOpenChange={setShowWinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-10 h-10 text-yellow-600" />
            </div>
            <DialogTitle className="text-2xl">Поздравляем!</DialogTitle>
            <DialogDescription className="text-lg">
              Вы успешно решили головоломку Сугуру!
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleGoToSettings}
              className="flex-1"
            >
              Настройки
            </Button>
            <Button
              onClick={handlePlayAgain}
              className="flex-1"
            >
              Новая игра
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900">Генерация поля...</h3>
              <p className="text-sm text-slate-500">Попытка {generationAttempt}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
