# VivekMarg Mentor (विवेकमार्ग मेंटर)

**A Voice-First, Offline-First Socratic AI Mentor & Inner Growth Compass grounded in the authentic public-domain philosophy of Swami Vivekananda.**

[![License: MIT](https://img.shields.io/badge/License-MIT-ochre.svg)](LICENSE)
[![Runtime Dependencies: 0](https://img.shields.io/badge/Runtime%20Dependencies-0-brightgreen.svg)](package.json)
[![Android API](https://img.shields.io/badge/Android-API%2021%E2%80%9335-3DDC84.svg)](android/app/build.gradle)

---

## Overview

**VivekMarg Mentor** pairs verbatim public-domain passages from *The Complete Works of Swami Vivekananda* with a structured **6-stage Socratic reflection engine**, running completely offline in the browser or as a native Android WebView application with an integrated speech bridge.

Unlike conversational wrappers that fabricate quotes or impersonate historical figures, VivekMarg Mentor strictly separates verified verbatim text from Socratic inquiry and enforces programmatic anti-impersonation guardrails.

---

## Key Features

- **Dual-Stream Canvas UI** — Displays verbatim source passages with Advaita Ashrama citations (Volume, Chapter, Page) side-by-side with the interactive Socratic reflection stream, plus an **Authenticity Watermark** toggle (`🛡️ Watermark`).
- **Grounded Offline Retrieval Engine (`www/retrieval.js`)** — Hybrid TF-IDF + length-normalized scoring with a curated concept dictionary mapping modern dilemmas (exam failure, distraction, heartbreak, procrastination, anxiety, comparison) to classical philosophical terminology across **5,187** extracted verbatim passages (`VM_CORPUS`) and **50** curated reference chunks (`VivekCorpus`).
- **6-Stage Socratic Companion (`www/socratic.js`)** — Guides self-inquiry through `Situation → Evidence → Agency → Cost → Action → Resolve`, enforcing **zero quote duplication** and a **17-pattern anti-impersonation guardrail**.
- **Voice-First Multilingual Speech Engine (`www/speech.js`)** — Supports **32 Indian locales** (22 Scheduled Indian languages + 10 tribal/regional locales with transparent regional fallback voices), seamlessly bridging Web Speech APIs and the native Android `SpeechBridge`.
- **Local-First Private Identity Vault & Growth Compass (`www/account.js`)** — Zero-cloud profile storage protected by a 16-byte salted **SHA-256** passcode digest (with FNV-1a fallback), guest mode, **Sankalpa** micro-commitment ledger, and growth vector tracking.
- **Closing Affirmation Canvas Player (`www/manifest.js`)** — Full-screen dark-mode meditative canvas reel with particle animation and synchronized audio playback.
- **Native Android App (`android/`)** — Offline WebView container (`MainActivity.java`) targeting Android 15 (API 35, minSdk 21), paired with a 13-method `@JavascriptInterface` native `TextToSpeech` + `SpeechRecognizer` bridge (`SpeechBridge.java`) and standalone PowerShell APK build pipeline (`build_apk.ps1`).

---

## Architecture & Repository Structure

```text
.
├── server.js                      # Zero-dependency Node.js static dev server (serves www/)
├── generate_corpus.py             # Curated Advaita Ashrama Vol. 1–2 corpus generator
├── corpus.json                    # Verified curated corpus JSON (50 chunks)
├── test_corpus.py                 # Stage 1: Corpus authenticity & citation integrity suite
├── test_web.js                    # Stage 2: 12 youth dilemmas + 17 impersonation attacks
├── test_ui.js                     # Stage 3: JSDOM headless UI, vault, Socratic & watermark suite
├── run_tests.bat / run_tests.sh   # Cross-platform 3-stage verification runners
├── package.json                   # Project scripts and jsdom test dependency
│
├── www/                           # Offline-first Web Application (vanilla HTML/CSS/JS)
│   ├── index.html                 # Dual-stream canvas, 32-locale selector, Vault & Compass modals
│   ├── index.css                  # Classical ochre/paper typography, watermark & responsive layout
│   ├── app.js                     # Application state & module orchestrator
│   ├── account.js                 # Module 1: Salted SHA-256 Vault, Sankalpa ledger & growth vectors
│   ├── retrieval.js               # Module 2: Hybrid TF-IDF + concept expansion engine
│   ├── socratic.js                # Module 3: 6-stage Socratic engine + anti-impersonation guard
│   ├── speech.js                  # Module 4: 32-locale Web Speech / AndroidSpeech engine
│   ├── manifest.js                # Module 6: Meditative canvas Closing Affirmation Player
│   ├── corpus_data.js             # Curated reference corpus module (VivekCorpus)
│   └── corpus.js                  # Focused extracted verbatim corpus bundle (5,187 chunks)
│
├── learning data extraction/      # PDF-to-Corpus ETL Pipeline
│   ├── book parser.py             # PyMuPDF extractor stripping headers, footers & folios
│   ├── parsed json cleaner.py     # Deduplication, artifact filtering & JS compaction
│   ├── minimize chunk size from json.py  # Core philosophical theme filter
│   ├── assets/corpus.json         # Raw extracted corpus JSON
│   └── www/data/                  # Compact & theme-minimized JS corpus outputs
│
└── android/                       # Native Android Wrapper & APK Build Pipeline
    ├── build.gradle / settings.gradle
    ├── build_apk.ps1              # Standalone AAPT2 -> javac -> D8 -> zipalign -> apksigner script
    ├── dist/vivekmarg-mentor-debug.apk  # Pre-built signed debug APK
    └── app/
        ├── build.gradle           # compileSdk 35, targetSdk 35, minSdk 21
        └── src/main/
            ├── AndroidManifest.xml
            ├── java/org/vivekmarg/mentor/
            │   ├── MainActivity.java    # Offline WebView host & RECORD_AUDIO permissions
            │   └── SpeechBridge.java    # 13 @JavascriptInterface native TTS/ASR methods
            ├── res/                     # Layout, ochre/paper theme & vector launcher icon
            └── assets/www/              # Synced offline web assets for WebView
```

---

## Quick Start

### Prerequisites

- **Node.js** (v18+ recommended) — for the dev server and JS verification suites
- **Python 3.8+** — for corpus integrity tests and PDF extraction scripts (`PyMuPDF` / `fitz` only needed if re-extracting from PDF)
- **Android SDK Build-Tools 35 + JDK** *(optional)* — only needed to rebuild the Android APK

### 1. Install Dev Dependencies

```bash
npm install
```

*(Only installs `jsdom` for headless DOM testing; the application itself has zero runtime dependencies.)*

### 2. Run the Web App Locally

```bash
npm start
```

Open **http://localhost:3000** in your browser. You can set a custom port via `PORT=8080 npm start`.

### 3. Run the 3-Stage Verification Suite

```bash
npm test
```

Or run via the platform scripts:

```bash
# Windows
run_tests.bat

# macOS / Linux
bash run_tests.sh
```

Individual test stages:

| Stage | Command | Scope |
|---|---|---|
| **Stage 1** | `npm run test:corpus` | Byte-clean corpus integrity & Advaita Ashrama citation metadata (`test_corpus.py`) |
| **Stage 2** | `npm run test:retrieval` | TF-IDF precision across 12 youth dilemmas + 17/17 adversarial impersonation attacks (`test_web.js`) |
| **Stage 3** | `npm run test:ui` | Headless JSDOM registration, salted SHA-256 PIN vault, 6-stage Socratic zero-quote-duplication, watermark toggle & Sankalpa growth vectors (`test_ui.js`) |

### 4. Build the Android APK (Windows)

Ensure Android SDK Build-Tools `35.0.0`, Platform `android-35`, and Android Studio JBR (or update paths in `android/build_apk.ps1`) are available, then run:

```bash
npm run build:apk
```

The signed debug APK is written to `android/dist/vivekmarg-mentor-debug.apk`.

---

## Privacy & Ethical Safeguards

- **100% Local-First**: Profiles, PIN digests, session reflections, and Sankalpa ledgers live exclusively in on-device `localStorage`. No cloud backend, analytics, or external API calls are required.
- **Anti-Impersonation Guardrail**: `SocraticCompanion.guard()` intercepts and neutralizes first-person persona claims so the mentor never speaks *as* Swami Vivekananda.
- **Verbatim Provenance**: Source passages are presented unmodified in a dedicated canvas pane with explicit Volume/Page citations and an on-demand Authenticity Watermark overlay.

---

## Contributing & Security

- See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and asset sync rules.
- See [SECURITY.md](SECURITY.md) for the cryptographic vault model and vulnerability reporting.
- See [CHANGELOG.md](CHANGELOG.md) for version history.

---

## License

Released under the [MIT License](LICENSE). Source texts from *The Complete Works of Swami Vivekananda* are in the public domain.
