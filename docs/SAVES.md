# Сейв и миграции (01_RS_GlitterSort)

## Структура

LocalStorage-ключ: `glitterSort.v1`. Единый JSON:

```json
{
  "schemaVersion": 1,
  "level": 5,
  "totalCompleted": 4,
  "interstitialCounter": 2,
  "customLevels": {...},
  "settings": { "sound": true },
  "stats": { "totalMoves": 123, "undoUsed": 4, "bonusUsed": 1 },
  "savedRun": {...},
  "sessionCount": 7,
  "rateUsShownAtL3": true,
  "rateUsCompleted": false
}
```

`schemaVersion` — версия структуры сейва. Растёт **только** когда меняется формат `data`-полей. Не связана с `versionName` приложения.

## Контракт

- Блок `[MIGRATIONS]` в `index.html` (`window.Migrations`) — реестр миграций. Каждая миграция — чистая функция `(state) => state`.
- Блок `[PERSIST]` в `index.html` (`window.Persist`) при `load()` читает сейв, определяет `fromVersion` через поле `schemaVersion` (отсутствует → 0), прогоняет через `runMigrations()` каскадно.
- `CURRENT_SCHEMA_VERSION` авто-выводится из `max(keys(migrations))`. Не дублируется константой.
- Поле `version` в legacy-сейвах НЕ используется как алиас `schemaVersion` (это был авторский счётчик из ранних сборок, не количество миграций). Migration 1 чистит его если встречает.

## Как добавить новую миграцию

1. В коде поменялся формат сейва. Текущая `getCurrentSchemaVersion()` возвращает, например, 3.
2. В блоке `[MIGRATIONS]` добавь функцию `4: (state) => { /* v3 → v4 */ return state; }`.
3. Обнови `DEFAULTS` в блоке `[PERSIST]` — новая структура.
4. После публикации в РуСтор обнови `.claude/release-state.json` (`lastPublishedSchemaVersion: 4`).

## ⚠️ Правила

- **Не меняй уже опубликованную миграцию.** У живых юзеров уже сейвы на этой схеме.
- **Миграции — defensive**: используй `?? defaultValue` для отсутствующих полей.
- **Каскадные** — каждая запускается ровно один раз для каждого юзера.

## Проверка перед релизом

Skill `prepare-release-candidate` перед сборкой запускает **полный self-test**: пустой сейв прогоняется через **все** миграции в реестре, проверяется корректность результата. Если что-то падает — сборка релиза не запускается.

## Опубликованный релиз

`.claude/release-state.json` обновляется **автоматически** skill'ом `prepare-release-candidate` после того, как пользователь подтвердил, что отправляет собранный APK в стор. Если не подтвердил — файл не трогается, при следующем RC та же база для сравнения.
