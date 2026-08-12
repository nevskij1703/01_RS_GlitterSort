# ANALYTICS — карта событий проекта «Колбочки»

Проект подключён к **Yandex AppMetrica** (бесплатный analytics SDK от Яндекса).
Подключение: inline IIFE-блок `[ANALYTICS]` в [index.html](../index.html) (всё в одном файле — single-file playable), native bridge — `html2apk -YandexAppMetrica`.

**API key:** `332bead0-5885-42f9-b4bd-21bfb5254167` (хранится в [.claude/build-config.json](../.claude/build-config.json) → `appMetricaApiKey`).

**Контракт обёртки и архитектура:** см. skill `connect-appmetrica` (`~/.claude/skills/connect-appmetrica/SKILL.md`).

---

## События

Все события идут через `window.Analytics.event(name, params)` (или `Analytics.adShown({...})`).
Системные параметры (`app_name='glittersort'`, `app_version`, `platform`, `user_id`) добавляются автоматически.

### Общие события (как у других игр мастерской)

| Event name | Params | File:line | Когда срабатывает |
|---|---|---|---|
| `session_start` | — | [index.html](../index.html) `App.start()` | После `Analytics.configure()`. |
| `level_start` | `{ level_num }` | [index.html](../index.html) `loadLevel()` | Внутри setTimeout, после `State.init()`. |
| `level_complete` | `{ level_num, moves }` | [index.html](../index.html) `onWin()` | Победа (`State.isWon()` true). |
| `ad_interstitial_shown` | `{ placement: 'level_transition' }` | [index.html](../index.html) `presentInterstitialThenLoad` | Перед показом interstitial. |
| `ad_rewarded_shown` | `{ placement: 'revive', watched, reward_given }` | [index.html](../index.html) `onBonus()` | После rewarded callback для +1 колбы. |
| `rate_clicked` | `{ source: 'modal' }` | [index.html](../index.html) `onRate` handler | Клик «Оценить» в rate-modal. |

### GlitterSort-специфичные события

| Event name | Params | File:line | Когда срабатывает |
|---|---|---|---|
| `revive_used` | `{ level_num }` | [index.html](../index.html) `onBonus()` (после успешного rewarded) | Юзер посмотрел rewarded и получил +1 пустую колбу. |

**Замечания:**
- В этой игре **нет** `level_fail` — нет механики проигрыша (только undo + retry).
- В этой игре **нет** `hint_used` — нет системы подсказок.
- В этой игре **нет** `settings_opened` — нет настроек (только info-кнопка про игру).

### Системные параметры (auto-injected)

- `app_name`: `'glittersort'`
- `app_version`: `'1.0.0'`
- `platform`: `'android'` (или `'browser'` в dev)
- `user_id`: UUID из `Persist.getUserId()`

### AppMetrica auto-tracked (НЕ дублируем)

- `app_open` / sessions / session length — авто
- Retention D1/D7/D30 — авто
- Crashes / ANRs — авто

---

## Где смотреть в дашборде AppMetrica

Открыть https://appmetrica.yandex.ru/, выбрать приложение «Колбочки».

### Audience
**Reports → Audience overview** — DAU/WAU/MAU.

### Retention
**Reports → Retention** → `session_start` → D1/D3/D7. Цель: D1 ≥ 35%, D7 ≥ 12%.

### Funnels

**Воронка прохождения:**
1. `level_start`
2. `level_complete`

% юзеров, которые бросили в середине уровня.

**Воронка revive engagement:**
1. `ad_rewarded_shown` (placement='revive')
2. `level_complete` (в течение N минут)

% юзеров, которым +1 колба реально помогла пройти.

**Cohort by уровень:**
- Сегмент «застрял на уровне 15»: `level_start` count where `level_num=15` ≥ 3 без `level_complete`

### Ad views
**Reports → Events** → фильтр `ad_*_shown`. Group by `placement`.

---

## Как добавить новое событие

1. Семантичное имя (snake_case). Сначала проверь общую таксономию в skill `connect-appmetrica`.
2. Вызов: `Analytics.event('event_name', { ...params })` (внутри inline-блока — `window.Analytics` доступен).
3. Запиши в таблицу выше.
4. **НЕ переименовывай уже опубликованные события.**

---

## Privacy

Сбор данных описан в [Store_Info/PRIVACY_POLICY.md](../Store_Info/PRIVACY_POLICY.md) → раздел «Аналитика (Yandex AppMetrica)». При изменении набора событий — обнови `.md` и регенерируй `.pdf` (`prepare-release-candidate` сделает автоматически).
