# Яндекс-реклама — интеграция

Игра использует абстракцию `Ads` (раздел `[ADS]` в `index.html`) c тремя backend'ами. На старте `Ads.init()` определяет окружение и выбирает доступный:

| Backend | Условие | Когда применяется |
|---|---|---|
| `native` | `window.YandexAds.showInterstitial` существует | Production-сборка APK (html2apk-обёртка с JS-bridge'ом) |
| `yagames` | `window.YaGames.init` существует | Веб-публикация на Yandex Games |
| `mock` | ни одно из выше | Разработка в браузере (открытие `index.html` файлом) |

## Слоты рекламы

| Слот | Когда показывается | Метод | Конст. ID |
|---|---|---|---|
| **Interstitial** | Между уровнями, каждые 2 победы (см. `Persist.shouldShowInterstitial`) | `Ads.showInterstitial()` | `Ads.UNIT_INTERSTITIAL` |
| **Rewarded** | По клику «+ Колба» в bottom bar | `Ads.showRewarded()` | `Ads.UNIT_REWARDED` |

Demo-ID в коде: `R-M-DEMO-1` и `R-M-DEMO-2`. Перед релизом замени на свои из [Yandex Partner](https://partner.yandex.ru/).

## Native backend (Yandex Mobile Ads SDK через WebView)

Это **целевой production-режим**. Игра запакована в Android APK через `html2apk`, который оборачивает WebView. Реклама — нативный Yandex Mobile Ads SDK (`com.yandex.android:mobileads`), вызывается из JS через `WebView.addJavascriptInterface`.

### Что должна сделать APK-обёртка (Android)

1. **Подключить SDK** в `app/build.gradle`:

```gradle
dependencies {
    implementation 'com.yandex.android:mobileads:7.0.1'  // или новее
}
```

2. **Инициализировать SDK** в `MainActivity.onCreate()`:

```java
MobileAds.initialize(this, () -> {
    Log.d("Ads", "Yandex Mobile Ads SDK initialized");
});
```

3. **Реализовать JS-bridge класс** (методы видны из JS как `window.YandexAds.*`):

```java
public class YandexAdsBridge {
    private final Activity activity;
    private final WebView webView;
    private InterstitialAd interstitial;
    private RewardedAd rewarded;

    public YandexAdsBridge(Activity a, WebView wv) {
        this.activity = a;
        this.webView = wv;
        preloadInterstitial();
        preloadRewarded();
    }

    @JavascriptInterface
    public void showInterstitial(String unitId) {
        activity.runOnUiThread(() -> {
            if (interstitial != null && interstitial.isLoaded()) {
                interstitial.show();
            } else {
                // Кеш ещё не прогрелся — сразу шлём callback close, чтобы JS не висел.
                postCallback("interstitial", "closed");
                preloadInterstitial();
            }
        });
    }

    @JavascriptInterface
    public void showRewarded(String unitId) {
        activity.runOnUiThread(() -> {
            if (rewarded != null && rewarded.isLoaded()) {
                rewarded.show();
            } else {
                postCallback("rewarded", "closed");  // не дали reward
                preloadRewarded();
            }
        });
    }

    private void postCallback(String kind, String event) {
        webView.post(() -> webView.evaluateJavascript(
            String.format("window.__yandexAdsCallback && window.__yandexAdsCallback('%s','%s')",
                kind, event), null));
    }

    // ... preloadInterstitial / preloadRewarded регистрируют callback'и,
    // в onAdDismissed → postCallback("interstitial", "closed"),
    // в onRewarded → postCallback("rewarded", "rewarded"),
    // в onAdClosed (rewarded) → postCallback("rewarded", "closed"), если без награды
}
```

4. **Регистрация бриджа** при загрузке WebView:

```java
webView.getSettings().setJavaScriptEnabled(true);
webView.addJavascriptInterface(new YandexAdsBridge(this, webView), "YandexAds");
webView.loadUrl("file:///android_asset/index.html");
```

### Контракт callback'ов

JS-сторона ожидает один глобальный callback:

```js
window.__yandexAdsCallback(kind, event)
// kind:  'interstitial' | 'rewarded'
// event: 'closed' | 'rewarded'
```

- `interstitial` всегда завершается событием `closed`.
- `rewarded` приходит c `rewarded`, если пользователь досмотрел до конца, иначе `closed`.

### Тестирование

Yandex даёт тестовые ad-unit'ы — посмотри их в документации SDK. Подставь их в `Ads.UNIT_INTERSTITIAL` / `Ads.UNIT_REWARDED` и собери debug-APK.

## YaGames backend (веб на Yandex Games)

Активируется автоматически, если страница загружена в iframe Yandex Games (там доступен `window.YaGames`).

```js
window.YaGames.init().then(ysdk => {
  ysdk.adv.showFullscreenAdv({ callbacks: { onClose, onError } });
  ysdk.adv.showRewardedVideo({ callbacks: { onRewarded, onClose, onError } });
});
```

Никаких ID указывать не нужно — Yandex Games сама выдаёт рекламу с учётом размещения.

## Mock backend (dev)

Если ни `YandexAds`, ни `YaGames` не доступны, `Ads.init()` ставит `backend='mock'`:

- `showInterstitial()` → `console.log('[Ads] showInterstitial mock')` + 600 мс задержки.
- `showRewarded()` → лог + 800 мс задержки + всегда даёт `{ rewarded: true }`.

Это позволяет тестировать игровой flow без рекламы. В консоли видно когда какая реклама «крутилась».

## Проверка `Ads.getBackend()`

В DevTools консоли:

```js
Ads.getBackend()  // → 'native' | 'yagames' | 'mock'
```

Полезно при отладке: убедиться что в production-APK действительно подключился native.

## Каденс

| Действие | Бюджет |
|---|---|
| Interstitial | каждый 2-й пройденный уровень (counter в `Persist`) |
| Rewarded | по запросу пользователя через кнопку «+ Колба», 1 раз на уровень |

Не ставь interstitial каждый уровень — это критично для retention. Каденс контролируется в `Persist.shouldShowInterstitial(counter)`.
