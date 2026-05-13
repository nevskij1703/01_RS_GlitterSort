# Архитектура `index.html`

Всё приложение — один файл `index.html`. Внутри `<script>` модули в IIFE-стиле, навешанные на `window.*`. Зависимостей нет.

## Модули (порядок загрузки)

| Модуль | Раздел в файле | Зависит от | Назначение |
|---|---|---|---|
| `Solver` | `[SOLVER]` | — | BFS-кратчайший путь, `isSolved`, `findReachableDeadEnds` |
| `Levels` | `[LEVELS]` | `Solver` | Палитра (8 цветов), 10 default-уровней, `generate()`, V1/V2 генераторы, endless tier-таблица |
| `State` | `[STATE]` | — | `sticks[][]`, `move/undo/clickStick/isWon`, бонусная колба |
| `Persist` | `[PERSIST]` | — | localStorage key `glitterSort.v1`, custom-уровни, interstitial counter |
| `Ads` | `[ADS]` | — | Абстракция Yandex SDK (Native / YaGames / Mock) |
| `Render` | `[RENDER]` | `State` | DOM-рендер колбочек, HUD, toast, win-modal |
| `DevPanel` | `[DEVPANEL]` | `Levels`, `State`, `Render`, `Persist` | Форма параметров уровня + Generate |
| `App` | `[APP]` | все выше | Bootstrap, обработчики кликов, win-flow |

Чтобы быстро найти секцию — `Ctrl+F` по тегу в квадратных скобках (`[SOLVER]`, `[LEVELS]`, и т.д.).

## Поток данных

```
DOMContentLoaded
  → App.start()
      → Persist.load()           # читаем сохранённый уровень
      → Ads.init()               # выбираем backend (native/yagames/mock)
      → App.loadLevel(N)
          → Levels.getParams(N)  # override → custom → endless → default
          → Levels.generate(p)   # V1 или V2 → bottles[][]
          → State.init(...)      # set sticks, capacity, level
          → Render.renderAll()   # DOM
      → App.wireEvents()         # click handlers
```

## Click flow

```
user clicks .bottle
  → App.onStickClick(idx)
      → State.clickStick(idx)  → 'selected'|'moved'|'deselected'|'invalid'|'locked'
      → Render.renderAll()
      → if 'moved' && State.isWon():
            App.onWin()
              → bump totalCompleted in Persist
              → save next level
              → Render.showWin()
        user clicks "Дальше →":
          App.onNext()
            → Persist.bumpInterstitialCounter()
            → if shouldShowInterstitial(): Ads.showInterstitial()
            → App.loadLevel(N+1)
```

## Хранилище (`localStorage.glitterSort.v1`)

```jsonc
{
  "version": 1,
  "level": 5,                       // следующий незавершённый уровень
  "totalCompleted": 4,
  "interstitialCounter": 4,         // используется для каденса рекламы
  "customLevels": {                 // overrides, сохранённые из дев-панели
    "5": { "sticks": 6, "capacity": 4, "colours": [...], ... }
  },
  "settings": { "sound": true },
  "stats": { "totalMoves": 47, "undoUsed": 3, "bonusUsed": 1 }
}
```

Текущее состояние поля (расположение цветов) **не сохраняется** — при перезагрузке уровень восстанавливается по `seed` (детерминированно).

## Точки расширения

| Хочу сделать | Куда смотреть |
|---|---|
| Добавить цвет в палитру | `Levels.PALETTE` + CSS `:root --c-<name>` + `.bottle .layer.c-<name>` |
| Добавить ручной уровень | `Levels.DEFAULT_LEVELS` (массив) |
| Изменить кривую сложности в endless | `Levels.ENDLESS_TIERS` |
| Изменить каденс interstitial | `Persist.shouldShowInterstitial(counter)` |
| Поменять анимацию переливания | CSS `@keyframes layerDrop`, `layerPour` |
| Подключить настоящие ad-unit ID | `Ads.UNIT_INTERSTITIAL` / `Ads.UNIT_REWARDED` в `[ADS]` |
| Добавить кнопку настроек | HTML body + `App.wireEvents()` |

## Размеры

Один файл `index.html` ~50–60 KB (без сжатия). На мобильных Chrome загружается мгновенно с диска / WebView.
