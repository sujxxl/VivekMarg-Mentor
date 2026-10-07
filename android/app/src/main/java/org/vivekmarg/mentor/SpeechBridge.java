package org.vivekmarg.mentor;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Vibrator;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Locale;
import java.util.Set;

/**
 * SpeechBridge: Native Android Voice Engine Bridge for VivekMarg Mentor
 * Bridges TextToSpeech and SpeechRecognizer to JavaScript via window.AndroidSpeech.
 * Exposes 13 @JavascriptInterface methods preserved for Dex validation.
 */
public class SpeechBridge implements TextToSpeech.OnInitListener {
    private static final String TAG = "SpeechBridge";

    private final Activity activity;
    private final WebView webView;
    private TextToSpeech tts;
    private SpeechRecognizer speechRecognizer;
    private final Handler mainHandler;
    private boolean isTtsReady = false;
    private boolean isListeningActive = false;
    private float currentSpeed = 0.95f;
    private float currentPitch = 1.0f;

    public SpeechBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        this.mainHandler = new Handler(Looper.getMainLooper());
        this.tts = new TextToSpeech(activity.getApplicationContext(), this);
        initSpeechRecognizer();
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            isTtsReady = true;
            tts.setLanguage(new Locale("en", "IN"));
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override
                public void onStart(String utteranceId) {
                    dispatchJsEvent("onSpeechStart", utteranceId);
                }

                @Override
                public void onDone(String utteranceId) {
                    dispatchJsEvent("onSpeechDone", utteranceId);
                }

                @Override
                public void onError(String utteranceId) {
                    dispatchJsEvent("onSpeechError", utteranceId);
                }
            });
            Log.d(TAG, "Native TextToSpeech initialized successfully.");
        } else {
            Log.e(TAG, "TextToSpeech initialization failed with status: " + status);
        }
    }

    private void initSpeechRecognizer() {
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                if (SpeechRecognizer.isRecognitionAvailable(activity)) {
                    speechRecognizer = SpeechRecognizer.createSpeechRecognizer(activity);
                    speechRecognizer.setRecognitionListener(new RecognitionListener() {
                        @Override
                        public void onReadyForSpeech(Bundle params) {
                            isListeningActive = true;
                            dispatchJsEvent("onListenReady", "");
                        }

                        @Override
                        public void onBeginningOfSpeech() {}

                        @Override
                        public void onRmsChanged(float rmsdB) {}

                        @Override
                        public void onBufferReceived(byte[] buffer) {}

                        @Override
                        public void onEndOfSpeech() {
                            isListeningActive = false;
                        }

                        @Override
                        public void onError(int error) {
                            isListeningActive = false;
                            dispatchJsEvent("onListenError", String.valueOf(error));
                        }

                        @Override
                        public void onResults(Bundle results) {
                            isListeningActive = false;
                            ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                            if (matches != null && !matches.isEmpty()) {
                                String topText = matches.get(0);
                                dispatchJsEvent("onListenResult", topText);
                            }
                        }

                        @Override
                        public void onPartialResults(Bundle partialResults) {
                            ArrayList<String> matches = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                            if (matches != null && !matches.isEmpty()) {
                                dispatchJsEvent("onListenPartial", matches.get(0));
                            }
                        }

                        @Override
                        public void onEvent(int eventType, Bundle params) {}
                    });
                }
            }
        });
    }

    private void dispatchJsEvent(final String eventName, final String payload) {
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                if (webView != null) {
                    String safePayload = payload.replace("'", "\\'");
                    webView.evaluateJavascript(
                        String.format("window.dispatchEvent(new CustomEvent('%s', { detail: '%s' }));", eventName, safePayload),
                        null
                    );
                }
            }
        });
    }

    // =========================================================================
    // 13 @JavascriptInterface Bridge Methods
    // =========================================================================

    @JavascriptInterface
    public void speak(final String text, final String langCode, final float rate, final float pitch) {
        if (!isTtsReady || text == null) return;
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                Locale loc = parseLocale(langCode);
                tts.setLanguage(loc);
                tts.setSpeechRate(rate > 0 ? rate : currentSpeed);
                tts.setPitch(pitch > 0 ? pitch : currentPitch);
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "utt_" + System.currentTimeMillis());
            }
        });
    }

    @JavascriptInterface
    public void speakThen(final String quoteText, final String dialogueText, final String quoteLang, final String dialogueLang) {
        if (!isTtsReady) return;
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                // Stage 1: Verbatim Quote in measured English
                tts.setLanguage(parseLocale(quoteLang != null ? quoteLang : "en-IN"));
                tts.setSpeechRate(0.80f);
                tts.speak(quoteText, TextToSpeech.QUEUE_FLUSH, null, "quote_part");

                // Stage 2: Socratic question in regional language
                tts.setLanguage(parseLocale(dialogueLang != null ? dialogueLang : "hi-IN"));
                tts.setSpeechRate(0.92f);
                tts.speak(dialogueText, TextToSpeech.QUEUE_ADD, null, "dialogue_part");
            }
        });
    }

    @JavascriptInterface
    public void stopSpeaking() {
        if (tts != null) {
            tts.stop();
        }
    }

    @JavascriptInterface
    public void startListening(final String langCode) {
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                if (speechRecognizer != null) {
                    Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, langCode != null ? langCode : "en-IN");
                    intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
                    speechRecognizer.startListening(intent);
                    isListeningActive = true;
                }
            }
        });
    }

    @JavascriptInterface
    public void stopListening() {
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                if (speechRecognizer != null) {
                    speechRecognizer.stopListening();
                    isListeningActive = false;
                }
            }
        });
    }

    @JavascriptInterface
    public boolean isSpeaking() {
        return tts != null && tts.isSpeaking();
    }

    @JavascriptInterface
    public boolean isListening() {
        return isListeningActive;
    }

    @JavascriptInterface
    public String getAvailableVoices() {
        if (!isTtsReady || tts == null) return "[]";
        try {
            JSONArray arr = new JSONArray();
            Set<Locale> available = tts.getAvailableLanguages();
            if (available != null) {
                for (Locale loc : available) {
                    JSONObject obj = new JSONObject();
                    obj.put("language", loc.getLanguage());
                    obj.put("country", loc.getCountry());
                    obj.put("displayName", loc.getDisplayName());
                    arr.put(obj);
                }
            }
            return arr.toString();
        } catch (Exception e) {
            Log.e(TAG, "Error getting voices", e);
            return "[]";
        }
    }

    @JavascriptInterface
    public void setSpeed(float speed) {
        this.currentSpeed = speed;
        if (tts != null) tts.setSpeechRate(speed);
    }

    @JavascriptInterface
    public void setPitch(float pitch) {
        this.currentPitch = pitch;
        if (tts != null) tts.setPitch(pitch);
    }

    @JavascriptInterface
    public boolean checkPermissions() {
        return activity.checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) 
                == android.content.pm.PackageManager.PERMISSION_GRANTED;
    }

    @JavascriptInterface
    public boolean hasOfflineModel(String lang) {
        if (!isTtsReady || tts == null) return false;
        int status = tts.isLanguageAvailable(parseLocale(lang));
        return status >= TextToSpeech.LANG_AVAILABLE;
    }

    @JavascriptInterface
    public void vibrate(long ms) {
        try {
            Vibrator v = (Vibrator) activity.getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) {
                v.vibrate(ms > 0 ? ms : 50);
            }
        } catch (Exception e) {
            Log.w(TAG, "Vibrate exception", e);
        }
    }

    private Locale parseLocale(String code) {
        if (code == null || code.isEmpty()) return new Locale("en", "IN");
        String[] parts = code.split("-");
        if (parts.length >= 2) {
            return new Locale(parts[0], parts[1]);
        }
        return new Locale(code);
    }

    public void destroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        if (speechRecognizer != null) {
            speechRecognizer.destroy();
        }
    }
}
