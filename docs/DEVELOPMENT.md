# Разработка

## Запуск локально

Самый простой вариант — двойной клик по `index.html`. Откроется в дефолтном браузере. Игра работает 100% offline, никаких зависимостей нет.

Для отладки удобнее запустить HTTP-сервер (тогда DevTools покажет нормальный stack trace, заработает `navigator.clipboard`, и WebView не будет ругаться на `file://`):

```bash
python -m http.server 8771
# открыть http://127.0.0.1:8771/
```

Или через Claude Code:

```
preview_start glitter-sort
```

## Структура одного файла

В `index.html`:

```
<head>           viewport, шрифт, favicon
<style>          CSS variables (палитра), layout, колбочка, анимации, dev-panel
<body>           HTML-каркас (#app, #sticks, #win-modal, #dev-panel, #toast)
<script>         все модули в одном теге, см. docs/ARCHITECTURE.md
```

Каждый JS-модуль помечен комментарием `// [LEVELS]`, `// [STATE]`, …. Через `Ctrl+F` по тегу — мгновенно прыгаешь в нужное место.

## Чек-лист «не сломал ли»

После каждого изменения — открыть `index.html` и пройти:

- [ ] L1 стартует сразу, без пустого экрана
- [ ] Клик по колбочке выделяет её (отступ вверх, золотая рамка)
- [ ] Клик по другой → переливание (если цвет верхнего слоя совпадает)
- [ ] Невалидный клик → ничего не происходит (нет красных алертов)
- [ ] Кнопка «Назад» → откатывает последний ход
- [ ] Кнопка «Заново» → возвращает стартовую раскладку
- [ ] Кнопка «+ Колба» → mock-ad → +1 пустая колба, дальше кнопка пропадает
- [ ] Победа: модал «Уровень пройден», кнопка «Дальше →» грузит следующий
- [ ] Перезагрузка страницы (`F5`) → стартует с того уровня, где остановился
- [ ] `Ctrl+Shift+D` → открывается дев-панель. Поменять `sticks=8, capacity=4, difficulty=20, easyMode=on` → 🎲 → уровень меняется на лету
- [ ] L10 пройден → L11 (endless): новый layout с 4 цветами

## Отладка

В консоли доступны все модули как `window.*`:

```js
// текущее состояние
State.get()

// параметры текущего уровня (после возможных overrides)
Levels.getParams(State.get().level)

// форсировать конкретный уровень
App.loadLevel(7)

// инспектировать localStorage
Persist.load()

// сбросить весь прогресс
Persist.clearAll(); location.reload()

// узнать backend рекламы
Ads.getBackend()
```

## Типичные правки

### Изменить палитру

1. В `:root` поменять / добавить `--c-<name>`.
2. Добавить CSS-правило `.bottle .layer.c-<name> { background: var(--c-<name>) }` (если не использовать CSS-vars подход).
3. Добавить имя в массив `Levels.PALETTE`.

### Поменять дефолтный уровень

Найти `Levels.DEFAULT_LEVELS` (раздел `[LEVELS]`) и изменить запись. Поля: `sticks`, `capacity`, `emptyStick`, `difficulty`, `colours`, `generator`, `seed`. Чтобы запечь конкретную раскладку — добавить `bottles: [[...],...]`; тогда генератор не вызывается. Раскладку можно подсмотреть в дев-панели: 🎲 → 📋 Copy JSON.

### Добавить кнопку в bottom bar

1. В HTML `.bottom` добавить `<button class="btn" id="btn-foo">`.
2. В `App.wireEvents()` повесить обработчик.
3. Если кнопка показывается условно — в `Render.renderActionButtons()` управлять `style.display`.

### Поменять анимацию

CSS-keyframes: `bottleBounce` (выделение), `layerDrop` (приём слоя), `layerPour` (отдача слоя). Все живут в `<style>`.

### Изменить каденс рекламы

`Persist.shouldShowInterstitial(counter)` — текущий вариант показывает раз в 2 победы.

## Сборка APK

См. [README.md](../README.md#сборка-apk). Главное — после сборки заменить mock на native backend через JS-bridge: подробности в [docs/ADS.md](ADS.md).

## Git workflow

После каждого значимого изменения:

```bash
git add index.html
git commit -m "<тип>(<область>): <описание>"
git push origin main
```

Конвенция типов: `feat`, `fix`, `tune`, `docs`, `chore`, `ui`. Область — `levels`, `state`, `render`, `ads`, `dev`, …

Remote: `https://github.com/nevskij1703/01_RS_GlitterSort.git`.
