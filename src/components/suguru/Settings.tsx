import { useState, useEffect } from 'react';
import type { GameSettings } from '@/types/suguru';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';

interface SettingsProps {
  onGenerate: (settings: GameSettings) => void;
}

const DEFAULT_SETTINGS: GameSettings = {
  rows: 6,
  cols: 6,
  maxNumber: 5,
  openCellsCount: 15,
  isMaxNumberRandom: false,
  isOpenCellsRandom: false,
};

const SETTINGS_STORAGE_KEY = 'suguru-settings';

export function Settings({ onGenerate }: SettingsProps) {
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const handleGenerate = () => {
    onGenerate(settings);
  };

  const updateSetting = <K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const maxCells = settings.rows * settings.cols;
  const maxOpenCells = Math.min(maxCells - 5, Math.floor(maxCells * 0.7));

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Настройки игры</CardTitle>
        <CardDescription className="text-center">
          Настройте параметры поля Сугуру
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rows */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label htmlFor="rows">Строки</Label>
            <span className="text-sm font-medium bg-primary/10 px-2 py-1 rounded">
              {settings.rows}
            </span>
          </div>
          <Slider
            id="rows"
            min={4}
            max={10}
            step={1}
            value={[settings.rows]}
            onValueChange={([value]) => updateSetting('rows', value)}
            className="w-full"
          />
        </div>

        {/* Columns */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label htmlFor="cols">Столбцы</Label>
            <span className="text-sm font-medium bg-primary/10 px-2 py-1 rounded">
              {settings.cols}
            </span>
          </div>
          <Slider
            id="cols"
            min={4}
            max={10}
            step={1}
            value={[settings.cols]}
            onValueChange={([value]) => updateSetting('cols', value)}
            className="w-full"
          />
        </div>

        {/* Max Number */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="maxNumber">Максимальная цифра</Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="randomMaxNumber" 
                  checked={settings.isMaxNumberRandom}
                  onCheckedChange={(checked) => updateSetting('isMaxNumberRandom', checked as boolean)}
                />
                <label
                  htmlFor="randomMaxNumber"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Случайно
                </label>
              </div>
            </div>
            {!settings.isMaxNumberRandom && (
              <span className="text-sm font-medium bg-primary/10 px-2 py-1 rounded">
                {settings.maxNumber}
              </span>
            )}
          </div>
          <Slider
            id="maxNumber"
            min={3}
            max={7}
            step={1}
            value={[settings.maxNumber]}
            onValueChange={([value]) => updateSetting('maxNumber', value)}
            disabled={settings.isMaxNumberRandom}
            className={settings.isMaxNumberRandom ? "opacity-50" : ""}
          />
          <p className="text-xs text-muted-foreground">
            Максимальная цифра, которая будет использоваться в игре
          </p>
        </div>

        {/* Open Cells Count */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="openCells">Открытых цифр</Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="randomOpenCells" 
                  checked={settings.isOpenCellsRandom}
                  onCheckedChange={(checked) => updateSetting('isOpenCellsRandom', checked as boolean)}
                />
                <label
                  htmlFor="randomOpenCells"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Случайно
                </label>
              </div>
            </div>
            {!settings.isOpenCellsRandom && (
              <span className="text-sm font-medium bg-primary/10 px-2 py-1 rounded">
                {settings.openCellsCount}
              </span>
            )}
          </div>
          <Slider
            id="openCells"
            min={5}
            max={maxOpenCells}
            step={1}
            value={[settings.openCellsCount]}
            onValueChange={([value]) => updateSetting('openCellsCount', value)}
            disabled={settings.isOpenCellsRandom}
            className={settings.isOpenCellsRandom ? "opacity-50" : ""}
          />
          <p className="text-xs text-muted-foreground">
            Количество цифр, видимых при старте игры
          </p>
        </div>

        <Button 
          onClick={handleGenerate}
          className="w-full text-lg py-6"
        >
          Сгенерировать поле
        </Button>
      </CardContent>
    </Card>
  );
}
