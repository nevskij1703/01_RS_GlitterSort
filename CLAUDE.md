# CLAUDE.md — 01_RS_GlitterSort

## Preview-сервер: порт 8771

Этот проект — часть мульти-проектной мастерской из 4 параллельно ведущихся проектов
в `C:\Users\Александр\Desktop\Claude\`. У каждого закреплён **уникальный порт**,
чтобы preview-серверы могли работать одновременно и не перебивать друг друга.

### Карта портов мастерской

| Проект            | Порт  |
|-------------------|-------|
| 01_RS_GlitterSort | 8771  |
| 02_Words          | 8772  |
| 03_FlappyBird     | 8773  |
| 04_True-or-Do     | 8774  |

**Этот проект всегда работает на порту 8771.**

### Правила (важно для будущих сессий Claude)

- **НЕ меняй** значение `port` в `.claude/launch.json`. Оно зафиксировано намеренно.
- **НЕ ставь** `autoPort: true` — это приведёт к захвату соседнего порта другого проекта мастерской.
- **НЕ добавляй** альтернативные preview-конфигурации (`npx serve`, `npm run dev`, `http-server` и т.п.) на других портах. Если действительно нужен другой запуск — используй тот же порт 8771.
- Если 8771 «занят» — это, скорее всего, прежний инстанс **этого же** проекта. Останови его (`Get-Process python | Stop-Process`), а не переключайся на 8000/5173/8080 — это порты соседей.
- Эта мастерская специально разнесена по портам 8771–8774; не выходи за эти границы и не выбирай порт сам.

## Монетизация: Yandex Mobile Ads (нативный SDK через WebView-bridge)

Проект целится в РуСтор APK. Реклама работает через **нативный Yandex Mobile Ads SDK**, который встраивается в APK инструментом `html2apk` (флаг `-YandexAdsBridge`). JS-сторона дёргает `window.YandexAds.showInterstitial(unitId)` / `showRewarded(unitId)` и слушает `window.__yandexAdsCallback(kind, event)`. В браузерном dev-режиме `window.YandexAds` отсутствует, и `Ads` автоматически падает в mock.

**Полный контракт и Java-код моста:** [docs/ADS.md](docs/ADS.md).

### Unit-ID (Yandex Mobile Ads)

В `index.html` (раздел `[ADS]`, ~строка 1325):
- Interstitial: `R-M-19273571-2`
- Rewarded: `R-M-19273571-1`

Источник: [Yandex Partner / Mobile Ads](https://partner.yandex.ru/mobile-ads).

### Что делает APK-сборщик

Команда `html2apk -YandexAdsBridge -ProjectFolder <thisDir> -AppName "..." -AppId com.terekh.glittersort -OutputFile <...>.apk` дополнительно:
1. Добавит `implementation 'com.yandex.android:mobileads:7.0.1'` в `android/app/build.gradle`.
2. Добавит `ACCESS_NETWORK_STATE` permission в `AndroidManifest.xml`.
3. Создаст `YandexAdsBridge.java` рядом с MainActivity.
4. Перепишет `MainActivity.java` чтобы вызвать `MobileAds.initialize(...)` + `addJavascriptInterface(new YandexAdsBridge(...), "YandexAds")`.

### Правила (для будущих сессий)

- **НЕ возвращай** demo-IDs `R-M-DEMO-1/2` — они были у Яндекса в их примерах и не работают в production.
- **НЕ подключай** веб-SDK Yandex Games (`https://yandex.ru/games/sdk/...`) — в РуСтор APK он не используется.
- **НЕ убирай** mock-fallback из `Ads.init` — он нужен для dev-режима в браузере.
- Контракт `window.__yandexAdsCallback(kind, event)` зафиксирован на стороне Java в html2apk — не меняй имя callback'а в JS.

## Сейвы и миграции

Сейв в `localStorage['glitterSort.v1']` — единый JSON с полем `schemaVersion`. Inline блоки `[MIGRATIONS]` и `[PERSIST]` в `index.html` реализуют каскадную систему миграций. Спецификация — в [docs/SAVES.md](docs/SAVES.md).

### Правила (для будущих сессий)

- **Любое изменение формата сейва ОБЯЗАНО иметь миграцию.** Если меняешь `DEFAULTS` в `[PERSIST]` — добавь функцию в `migrations` в `[MIGRATIONS]` (ключ N+1, где N — текущая `getCurrentSchemaVersion()`).
- **НЕ удаляй и НЕ меняй уже опубликованные миграции.** Меняй только последнюю до публикации.
- **НЕ используй поле `version`** в новых сейвах — это legacy-имя из старых сборок (там был авторский номер 2, не количество миграций). Migration 1 чистит его автоматически.
- **При запросе релиз-кандидата** используй skill `prepare-release-candidate`.
- Состояние последнего опубликованного релиза — `.claude/release-state.json`. Обновляется автоматически skill'ом `prepare-release-candidate` — после сборки APK он спрашивает «отправляешь в стор?», и при ответе «да» записывает текущую `schemaVersion`/`versionCode`/`versionName` в файл.
