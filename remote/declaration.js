// СГЕНЕРИРОВАНО ИЗ remote-config.json — НЕ ПРАВИТЬ ЗДЕСЬ.
// Пересобрать: node tools/sync-client.mjs --write  (из папки admin)
//
// Нужно потому, что импортировать JSON умеет только сборщик: в classic-JS и в
// ES-модулях без сборки объявление обязано быть кодом. Значения не
// дублируются — источник один, этот файл лишь его отражение.

window.RC_DECLARATION = {
  "_": "Что можно крутить БЕЗ выпуска обновления. Этот файл читают оба: игра берёт из него дефолты и рамки, админка (../admin) — какие поля показать и по чему проверять. Второго списка нет намеренно: он разошёлся бы с игрой на первом же новом ключе.",
  "_defaults": "ОБЯЗАНЫ совпадать с константами сборки в index.html — блоки [APP] (INTERSTITIAL_*, RATEUS_*, ENERGY_*), [ADS] (INTERSTITIAL_ENABLED), [LEVELS] и [PUSH_SCHEDULER]. Конфиг ПЕРЕБИВАЕТ значения, а не задаёт: недоступный бакет должен означать «игра как была».",
  "_ranges": "Рамки обязательны, ключ без рамки игра не применит. Опечатка вроде 0 в adfree_streak иначе означала бы «межстраничная после каждого уровня у всех».",
  "_scope": "Ритм рекламы и её выключатель, просьба об оценке, экономика молний, сдвиг кривой сложности, потолок решателя, частота напоминаний. Формат сейва здесь не участвует: все ключи читаются в момент решения, ни один не задаёт поля нового сейва. Поэтому НЕ вынесены стартовый запас молний (10) и стартовые настройки — они пишутся в сейв при создании.",
  "defaults": {
    "interstitial_min_level": 3,
    "interstitial_adfree_streak": 2,
    "interstitial_cooldown_sec": 120,
    "rateus_min_level": 4,
    "rateus_cooldown_hours": 24,
    "energy_per_level": 1,
    "energy_reward": 5,
    "energy_regen_cap": 3,
    "energy_regen_minutes": 60,
    "interstitial_enabled": 1,
    "difficulty_shift": 0,
    "solve_cap_ms": 120,
    "push_max_per_day": 4
  },
  "ranges": {
    "interstitial_min_level": {
      "min": 1,
      "max": 50
    },
    "interstitial_adfree_streak": {
      "min": 1,
      "max": 20
    },
    "interstitial_cooldown_sec": {
      "min": 0,
      "max": 3600
    },
    "rateus_min_level": {
      "min": 1,
      "max": 50
    },
    "rateus_cooldown_hours": {
      "min": 1,
      "max": 720
    },
    "energy_per_level": {
      "min": 0,
      "max": 3
    },
    "energy_reward": {
      "min": 1,
      "max": 20
    },
    "energy_regen_cap": {
      "min": 1,
      "max": 20
    },
    "energy_regen_minutes": {
      "min": 5,
      "max": 720
    },
    "interstitial_enabled": {
      "oneOf": [
        0,
        1
      ]
    },
    "difficulty_shift": {
      "min": -3,
      "max": 3
    },
    "solve_cap_ms": {
      "min": 20,
      "max": 1000
    },
    "push_max_per_day": {
      "min": 0,
      "max": 8
    }
  },
  "labels": {
    "interstitial_min_level": "Межстраничная не раньше уровня",
    "interstitial_adfree_streak": "Межстраничная после N уровней без рекламы",
    "interstitial_cooldown_sec": "Между двумя показами, секунд",
    "rateus_min_level": "Просьба оценить не раньше уровня",
    "rateus_cooldown_hours": "Повтор просьбы оценить не чаще, часов",
    "energy_per_level": "Молний за новый уровень",
    "energy_reward": "Молний за ролик",
    "energy_regen_cap": "Пассивно копится до N молний",
    "energy_regen_minutes": "Одна молния за N минут",
    "interstitial_enabled": "Межстраничная включена (0 или 1)",
    "difficulty_shift": "Сдвиг кривой сложности (рейтинг ±)",
    "solve_cap_ms": "Потолок решателя на уровень, мс",
    "push_max_per_day": "Напоминаний в день, не больше"
  },
  "groups": {
    "interstitial_min_level": "Реклама",
    "interstitial_adfree_streak": "Реклама",
    "interstitial_cooldown_sec": "Реклама",
    "rateus_min_level": "Оценка приложения",
    "rateus_cooldown_hours": "Оценка приложения",
    "energy_per_level": "Экономика молний",
    "energy_reward": "Экономика молний",
    "energy_regen_cap": "Экономика молний",
    "energy_regen_minutes": "Экономика молний",
    "interstitial_enabled": "Реклама",
    "difficulty_shift": "Сложность",
    "solve_cap_ms": "Сложность",
    "push_max_per_day": "Уведомления"
  },
  "funnel": {
    "_": "Шаги воронки прохождения. Задаётся ЗДЕСЬ, потому что знать свои события может только игра: угаданный список нарисовал бы правдоподобный график по событиям, которых нет, и обнаружилось бы это по нулям.",
    "_steps": "Имена событий по порядку. Считается число РАЗНЫХ людей, у кого событие было хоть раз, а не «дошедших по порядку»: порядок доставки событий не гарантирован. Доля — от первого шага.",
    "_levels": "Прохождение по уровням: event — событие, param — плоский параметр с номером уровня (его отправляют и выпущенные сборки), max — до какого уровня рисовать. РАЗРЕЗ ПО ГРУППАМ A/B берётся не отсюда, а из вложенного параметра того же события: игра добавляет progress: { \"<уровень>\": \"<группа>\" } рядом с плоским level_num. Вложенного — потому что в дереве параметров отчёта уровень и группа тогда лежат на разных уровнях ОДНОЙ ветви и пересекаются запросом; лежа соседними ветвями (level_num и ab рядом) они не пересекаются, такой запрос отдаёт ноль строк. Форму собирает admin/client/progress.js — один код на игру и на админку.",
    "steps": [
      "session_start",
      "level_start",
      "level_complete",
      "ad_rewarded_shown"
    ],
    "levels": {
      "event": "level_start",
      "param": "level_num",
      "max": 30
    }
  }
};
