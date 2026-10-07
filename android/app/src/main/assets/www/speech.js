/**
 * VivekMarg Mentor - Module 4: Voice-First Multilingual Speech Engine (speech.js)
 * 32 Locales, Dual-Pacing Audio (speakThen), Dialect Fallbacks & Android Bridge
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VivekSpeech = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  // 32 Locales (22 Scheduled + 10 Tribal / Regional)
  const LOCALES = [
    // 22 Scheduled Indian Languages
    { code: 'hi-IN', name: 'Hindi (हिन्दी)', script: 'Devanagari', isTribal: false },
    { code: 'en-IN', name: 'English (India)', script: 'Latin', isTribal: false },
    { code: 'bn-IN', name: 'Bengali (বাংলা)', script: 'Bengali', isTribal: false },
    { code: 'te-IN', name: 'Telugu (తెలుగు)', script: 'Telugu', isTribal: false },
    { code: 'mr-IN', name: 'Marathi (मराठी)', script: 'Devanagari', isTribal: false },
    { code: 'ta-IN', name: 'Tamil (தமிழ்)', script: 'Tamil', isTribal: false },
    { code: 'ur-IN', name: 'Urdu (اردو)', script: 'Perso-Arabic', isTribal: false },
    { code: 'gu-IN', name: 'Gujarati (ગુજરાતી)', script: 'Gujarati', isTribal: false },
    { code: 'kn-IN', name: 'Kannada (ಕನ್ನಡ)', script: 'Kannada', isTribal: false },
    { code: 'or-IN', name: 'Odia (ଓଡ଼ିଆ)', script: 'Odia', isTribal: false },
    { code: 'ml-IN', name: 'Malayalam (മലയാളം)', script: 'Malayalam', isTribal: false },
    { code: 'pa-IN', name: 'Punjabi (ਪੰਜਾਬੀ)', script: 'Gurmukhi', isTribal: false },
    { code: 'as-IN', name: 'Assamese (অসমীয়া)', script: 'Bengali', isTribal: false },
    { code: 'ma-IN', name: 'Maithili (मैथिली)', script: 'Devanagari', isTribal: false },
    { code: 'sa-IN', name: 'Sanskrit (संस्कृतम्)', script: 'Devanagari', isTribal: false },
    { code: 'ks-IN', name: 'Kashmiri (कॉशुर)', script: 'Perso-Arabic', isTribal: false },
    { code: 'ne-NP', name: 'Nepali (नेपाली)', script: 'Devanagari', isTribal: false },
    { code: 'kok-IN', name: 'Konkani (कोंकणी)', script: 'Devanagari', isTribal: false },
    { code: 'sd-IN', name: 'Sindhi (سنڌي)', script: 'Perso-Arabic', isTribal: false },
    { code: 'doi-IN', name: 'Dogri (डोगरी)', script: 'Devanagari', isTribal: false },
    { code: 'mni-IN', name: 'Manipuri (মৈতৈলোন্)', script: 'Meetei Mayek', isTribal: false },
    { code: 'brx-IN', name: 'Bodo (बड़ो)', script: 'Devanagari', isTribal: false },

    // 10 Tribal & Regional Locales with fallback mapping
    { code: 'tcy-IN', name: 'Tulu (ತುಳು)', script: 'Kannada', isTribal: true, fallback: 'kn-IN', note: 'Voiced in Kannada' },
    { code: 'kxu-IN', name: 'Kui (କୁଇ)', script: 'Odia', isTribal: true, fallback: 'or-IN', note: 'Voiced in Odia' },
    { code: 'sat-IN', name: 'Santali (ᱥᱟᱱᱛᱟᱲᱤ)', script: 'Ol Chiki', isTribal: true, fallback: 'hi-IN', note: 'Voiced in Hindi' },
    { code: 'gon-IN', name: 'Gondi (गोण्डी)', script: 'Devanagari', isTribal: true, fallback: 'hi-IN', note: 'Voiced in Hindi' },
    { code: 'bhb-IN', name: 'Bhili (भीली)', script: 'Devanagari', isTribal: true, fallback: 'hi-IN', note: 'Voiced in Hindi' },
    { code: 'hoc-IN', name: 'Ho (हो)', script: 'Warang Citi', isTribal: true, fallback: 'hi-IN', note: 'Voiced in Hindi' },
    { code: 'kru-IN', name: 'Kurukh (कुड़ुख़)', script: 'Devanagari', isTribal: true, fallback: 'hi-IN', note: 'Voiced in Hindi' },
    { code: 'kyw-IN', name: 'Kurmali (कुड़मालि)', script: 'Devanagari', isTribal: true, fallback: 'hi-IN', note: 'Voiced in Hindi' },
    { code: 'lus-IN', name: 'Mizo (Mizo ṭawng)', script: 'Latin', isTribal: true, fallback: 'en-IN', note: 'Voiced in English' },
    { code: 'kha-IN', name: 'Khasi (Ka Ktien Khasi)', script: 'Latin', isTribal: true, fallback: 'en-IN', note: 'Voiced in English' }
  ];

  // Dialect Fallback Map
  const FALLBACK_VOICE_MAP = {
    'tcy-IN': 'kn-IN',
    'kxu-IN': 'or-IN',
    'sat-IN': 'hi-IN',
    'gon-IN': 'hi-IN',
    'bhb-IN': 'hi-IN',
    'hoc-IN': 'hi-IN',
    'kru-IN': 'hi-IN',
    'kyw-IN': 'hi-IN',
    'lus-IN': 'en-IN',
    'kha-IN': 'en-IN'
  };

  class SpeechEngine {
    constructor() {
      this.currentLang = 'en-IN';
      this.isSpeaking = false;
      this.isListening = false;
      this.activeUtterance = null;
      this.recognition = null;
      this.onSpeechStart = null;
      this.onSpeechEnd = null;
      this.onListenResult = null;
      this.onListenError = null;

      this.initWebSpeech();
    }

    // Check if running inside Android Native wrapper
    isNativeBridge() {
      return typeof window !== 'undefined' && typeof window.AndroidSpeech !== 'undefined';
    }

    initWebSpeech() {
      if (typeof window === 'undefined') return;

      // Web Speech Recognition Fallback
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          this.recognition = new SpeechRecognition();
          this.recognition.continuous = false;
          this.recognition.interimResults = true;

          this.recognition.onstart = () => {
            this.isListening = true;
          };

          this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }

            if (this.onListenResult) {
              this.onListenResult({
                transcript: finalTranscript || interimTranscript,
                isFinal: !!finalTranscript
              });
            }
          };

          this.recognition.onerror = (event) => {
            console.warn('Speech recognition error:', event.error);
            this.isListening = false;
            if (this.onListenError) this.onListenError(event.error);
          };

          this.recognition.onend = () => {
            this.isListening = false;
          };
        } catch (e) {
          console.warn('Web Speech API initialization warning:', e);
        }
      }
    }

    setLanguage(langCode) {
      this.currentLang = langCode;
      if (this.recognition) {
        const resolved = this.resolveVoiceLang(langCode);
        this.recognition.lang = resolved;
      }
    }

    resolveVoiceLang(langCode) {
      return FALLBACK_VOICE_MAP[langCode] || langCode || 'en-IN';
    }

    getDialectNotice(langCode) {
      const loc = LOCALES.find(l => l.code === langCode);
      if (loc && loc.isTribal) {
        const target = LOCALES.find(l => l.code === loc.fallback);
        return {
          isFallback: true,
          originalLang: loc.name,
          fallbackLang: target ? target.name : loc.fallback,
          message: `Audio voice rendered in ${target ? target.name.split(' ')[0] : 'Hindi'} for ${loc.name.split(' ')[0]}`
        };
      }
      return { isFallback: false };
    }

    // Stop all ongoing speech immediately
    stop() {
      if (this.isNativeBridge()) {
        window.AndroidSpeech.stopSpeaking();
      } else if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      this.isSpeaking = false;
      if (this.onSpeechEnd) this.onSpeechEnd();
    }

    // Speak single text
    speak(text, options = {}) {
      const lang = options.lang || this.currentLang;
      const rate = options.rate !== undefined ? options.rate : 0.95;
      const pitch = options.pitch !== undefined ? options.pitch : 1.0;
      const resolvedLang = this.resolveVoiceLang(lang);

      this.stop();
      this.isSpeaking = true;
      if (this.onSpeechStart) this.onSpeechStart();

      if (this.isNativeBridge()) {
        window.AndroidSpeech.speak(text, resolvedLang, rate, pitch);
        return Promise.resolve();
      }

      if (typeof window === 'undefined' || !window.speechSynthesis) {
        this.isSpeaking = false;
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = resolvedLang;
        utterance.rate = rate;
        utterance.pitch = pitch;

        utterance.onend = () => {
          this.isSpeaking = false;
          if (this.onSpeechEnd) this.onSpeechEnd();
          resolve();
        };

        utterance.onerror = () => {
          this.isSpeaking = false;
          if (this.onSpeechEnd) this.onSpeechEnd();
          resolve();
        };

        this.activeUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      });
    }

    // Audio Dual-Pacing (speakThen Engine):
    // 1. Reads verbatim passage in clear, measured English (en-IN at 0.80x speed)
    // 2. Smoothly transitions to the selected regional language for Socratic question
    async speakThen({ quoteText, dialogueText, regionalLang }) {
      const targetLang = regionalLang || this.currentLang;

      // Stage 1: Verbatim Quote in measured English
      await this.speak(quoteText, {
        lang: 'en-IN',
        rate: 0.80,
        pitch: 0.95
      });

      // Brief 400ms meditative pause between passage and reflection
      await new Promise(r => setTimeout(r, 400));

      // Stage 2: Socratic reflection in user's selected regional language
      await this.speak(dialogueText, {
        lang: targetLang,
        rate: 0.92,
        pitch: 1.0
      });
    }

    // Voice-First Accessibility: Press-to-Hear Audio Navigation
    speakNavCue(cueName) {
      const cues = {
        'start_reflection': 'Tap here or speak to begin Socratic inquiry.',
        'shield_watermark': 'Watermark verification mode. Gold indicates historical text, blue indicates mentor inquiry.',
        'guest_mode': 'Guest mode active. No data is stored locally.',
        'sankalpa_submit': 'Confirm your action commitment for today.',
        'listen_active': 'Listening. Speak your reflection now.',
        'affirmation_start': 'Beginning closing affirmation reel.'
      };
      const text = cues[cueName] || cueName;
      this.speak(text, { rate: 1.0 });
    }

    // Start listening for voice input
    startListening() {
      if (this.isNativeBridge()) {
        window.AndroidSpeech.startListening(this.resolveVoiceLang(this.currentLang));
        this.isListening = true;
        return;
      }

      if (this.recognition) {
        try {
          this.recognition.lang = this.resolveVoiceLang(this.currentLang);
          this.recognition.start();
          this.isListening = true;
        } catch (e) {
          console.warn('Speech recognition start failed', e);
        }
      }
    }

    stopListening() {
      if (this.isNativeBridge()) {
        window.AndroidSpeech.stopListening();
      } else if (this.recognition) {
        try {
          this.recognition.stop();
        } catch (e) {}
      }
      this.isListening = false;
    }
  }

  return {
    SpeechEngine,
    LOCALES,
    FALLBACK_VOICE_MAP
  };
}));
