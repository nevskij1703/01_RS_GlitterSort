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
- Interstitial: `R-M-19273487-1`
- Rewarded: `R-M-19273487-2`

Источник: [Yandex Partner / Mobile Ads](https://partner.yandex.ru/mobile-ads).

### Что делает APK-сборщик

Команда `html2apk -YandexAdsBridge -ProjectFolder <thisDir> -AppName "..." -AppId com.terekh.glittersort -OutputFile <...>.apk` дополнительно:
1. Добавит `implementation 'com.yandex.android:mobileads:7.0.1'` в `android/app/build.gradle`.
2. Добавит `ACCESS_NETWORK_STATE` permission в `AndroidManifest.xml`.
3. Создаст `YandexAdsBridge.java` рядом с MainActivity.
4. Перепишет `MainActivity.java` чтобы вызвать `MobileAds.initialize(...)` + `addJavascriptInterface(new YandexAdsBridge(...), "YandexAds")`.

### ⛔ Межстраничная реклама временно выключена

`INTERSTITIAL_ENABLED = false` в начале блока `[ADS]` (`index.html`). Причина: жалобы игроков в отзывах РуСтора при почти нулевом доходе от этого формата. Rewarded («+1 колба») работает как раньше. Подробности — [docs/ADS.md](docs/ADS.md) → «Межстраничная реклама выключена».

### Правила (для будущих сессий)

- **НЕ «чини»** отсутствие межстраничной рекламы — это осознанное решение. Единственный способ вернуть — поставить `INTERSTITIAL_ENABLED = true` по явной просьбе Александра. Политику показа в `[APP]` (уровень ≥ 5, cooldown, recovery) **не удаляй** — она ждёт возврата флага.
- **НЕ возвращай** demo-IDs `R-M-DEMO-1/2` — они были у Яндекса в их примерах и не работают в production.
- **НЕ подключай** веб-SDK Yandex Games (`https://yandex.ru/games/sdk/...`) — в РуСтор APK он не используется.
- **НЕ убирай** mock-fallback из `Ads.init` — он нужен для dev-режима в браузере.
- Контракт `window.__yandexAdsCallback(kind, event)` зафиксирован на стороне Java в html2apk — не меняй имя callback'а в JS.

## In-App оценка: RuStore Review SDK

Кнопка «Оценить» в модалке `#rateus-modal` (показывается перед началом 2-го уровня сессии и после прохождения L3) вызывает **нативный диалог RuStore Review** поверх WebView. Подключено через bridge `window.RuStoreReview.launch()` / `__rustoreReviewCallback`, реализованный в html2apk при флаге `-RuStoreReviewSdk`. JS-обёртка — inline IIFE `window.RuStoreReviewClient` в `index.html` (раздел `[RUSTORE_REVIEW]`, ~после `window.Ads`). Точка вызова — `onRate` в `showRateUsThen`. Полная архитектура — в skill [`connect-rustore-review`](~/.claude/skills/connect-rustore-review/SKILL.md).

**Fallback policy:**
- Bridge нет (browser dev / APK без `-RuStoreReviewSdk`) → `window.open('https://www.rustore.ru/catalog/app/com.terekh.glittersort')`.
- SDK вернул `'unavailable'` (нет RuStore / устарел) → fallback на тот же deep-link.
- SDK вернул `'failed'` (`RuStoreReviewExists` / `RuStoreRequestLimitReached` / `Unauthorized` / `InvalidReviewInfo`) → silent. Это нормальный отказ SDK, спамить юзера deep-link'ом тут нельзя.

### Правила (для будущих сессий)

- **НЕ возвращай** `window.open('https://www.rustore.ru/catalog/app/...')` напрямую в `onRate` — теперь deep-link живёт только как fallback внутри inline `RuStoreReviewClient`.
- **НЕ меняй** имя callback'а `__rustoreReviewCallback` — оно зашито в Java-bridge'е (`RuStoreReviewBridge.java`).
- **НЕ удаляй** флаг `"rustoreReviewSdk": true` из `.claude/build-config.json` — без него html2apk не подключит SDK.
- `RuStoreReviewClient.configure('com.terekh.glittersort')` вызывается один раз в `App.start()` после `Ads.init()` — eager preload даёт мгновенный показ при первом клике «Оценить».

## Уровни: генерация под кривую сложности

Готовых уровней нет — каждый собирается **на лету** под целевое число ходов. Сложность уровня это рейтинг 1..10 (1 = 3 хода в оптимальном решении, 10 = 24 хода). Кривая: `1-3-3-6`, дальше бесконечный цикл `4-4-7-4-4-10`.

Всё в блоке `[LEVELS]` в [index.html](index.html): `CURVE_PREFIX` / `CURVE_CYCLE`, `RATING_PRESETS` (ходы + поле под каждый рейтинг), `generateForTarget()` (сэмплирование раскладок + BFS до попадания в цель). Полное описание, таблицы замеров и обоснование выбора полей — [docs/LEVELS.md](docs/LEVELS.md).

### Правила (для будущих сессий)

- **НЕ возвращай захардкоженные `bottles`** в уровни — генерация на лету это осознанное требование Александра.
- **НЕ меняй поле (`sticks`/`capacity`) под рейтингом наугад.** Цель по ходам должна попадать в диапазон p25–p75 этого поля из таблицы замеров в docs/LEVELS.md, иначе подбор станет долгим или неточным.
- **НЕ поднимай `budgetMs` «на всякий случай»** — генерация идёт в момент перехода между уровнями, игрок ждёт. Замеры: 200 уровней подряд дают 200 точных попаданий, худший уровень 142 мс.
- **НЕ считай лейбл сложности по числу ходов.** Шкала сжата (10 = 24 хода), старые пороги `DIFF_TIERS` назвали бы самый сложный уровень «Средне». Лейбл идёт от рейтинга — `Render.getDifficultyByRating()`.
- Форма кривой правится в одной строке (`CURVE_CYCLE`), смысл рейтинга — в `RATING_PRESETS`.

## Сейвы и миграции

Сейв в `localStorage['glitterSort.v1']` — единый JSON с полем `schemaVersion`. Inline блоки `[MIGRATIONS]` и `[PERSIST]` в `index.html` реализуют каскадную систему миграций. Спецификация — в [docs/SAVES.md](docs/SAVES.md).

### Правила (для будущих сессий)

- **Любое изменение формата сейва ОБЯЗАНО иметь миграцию.** Если меняешь `DEFAULTS` в `[PERSIST]` — добавь функцию в `migrations` в `[MIGRATIONS]` (ключ N+1, где N — текущая `getCurrentSchemaVersion()`).
- **НЕ удаляй и НЕ меняй уже опубликованные миграции.** Меняй только последнюю до публикации.
- **НЕ используй поле `version`** в новых сейвах — это legacy-имя из старых сборок (там был авторский номер 2, не количество миграций). Migration 1 чистит его автоматически.
- **При запросе релиз-кандидата** используй skill `prepare-release-candidate`.
- Состояние последнего опубликованного релиза — `.claude/release-state.json`. Обновляется автоматически skill'ом `prepare-release-candidate` — после сборки APK он спрашивает «отправляешь в стор?», и при ответе «да» записывает текущую `schemaVersion`/`versionCode`/`versionName` в файл.

## Аналитика: Yandex AppMetrica

Подключено через `-YandexAppMetrica` html2apk-flag (skill `~/.claude/skills/connect-appmetrica/SKILL.md`). SDK активируется в MainActivity.onCreate. JS-обёртка — inline IIFE-блок `[ANALYTICS]` в [index.html](index.html) рядом с `RuStoreReviewClient` и `PushScheduler`.

**API key**: `332bead0-5885-42f9-b4bd-21bfb5254167` (в `.claude/build-config.json` → `appMetricaApiKey`).

**Карта событий + где смотреть в дашборде** — [docs/ANALYTICS.md](docs/ANALYTICS.md).

### Минимальный список событий (GlitterSort)

**Общие:** `session_start`, `level_start`, `level_complete`, `ad_interstitial_shown`, `ad_rewarded_shown`, `rate_clicked`.

**GlitterSort-специфичное:**
- `revive_used` `{ level_num }` — юзер посмотрел rewarded и получил +1 пустую колбу

В этой игре **нет** `level_fail` (нет проигрыша), `hint_used` (нет подсказок), `settings_opened` (нет настроек).

### Правила (для будущих сессий)

- **НЕ дублируй имена событий** из общей таксономии — они должны совпадать one-to-one во всех 4 проектах.
- **НЕ меняй имена опубликованных событий** — сломаешь воронки.
- **НЕ шли PII** в event params.
- **userId** генерируется один раз через `Persist.getUserId()` (UUID v4). Стабилен между сессиями.
- **НЕ меняй имя bridge'а** `window.AppMetrica`.
- **НЕ переноси [ANALYTICS] блок** перед [PERSIST] — Analytics зависит от `Persist.getUserId()` для bootstrap'а.
