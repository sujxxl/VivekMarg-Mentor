# Changelog

All notable changes to **VivekMarg Mentor** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-07

### Added
- **PDF Extraction & Corpus Pipeline** (`learning data extraction/`, `generate_corpus.py`):
  - PyMuPDF extractor (`book parser.py`) with header/footer/folio stripping and hyphen rejoining.
  - Deduplication cleaner (`parsed json cleaner.py`) and core philosophical theme minimizer (`minimize chunk size from json.py`) producing 5,187 verified chunks (`VM_CORPUS`).
  - Curated Advaita Ashrama Vol. 1 & 2 generator (`generate_corpus.py`) outputting `corpus.json` and `www/corpus_data.js`.
- **Offline-First Web Application** (`www/`, `server.js`):
  - Local-first Private Identity Vault (`account.js`) with 16-byte salted SHA-256 PIN hashing, guest mode, Sankalpa ledger, and growth vectors.
  - Hybrid TF-IDF + concept expansion retrieval engine (`retrieval.js`).
  - 6-stage Socratic companion (`socratic.js`) with zero-quote-duplication and 17-pattern anti-impersonation guardrail.
  - 32-locale multilingual speech engine (`speech.js`) covering 22 Scheduled Indian languages and 10 tribal/regional locales with fallback voice mapping.
  - Full-screen meditative Closing Affirmation Canvas Player (`manifest.js`).
  - Dual-stream mentor UI (`index.html`, `index.css`, `app.js`) with Authenticity Watermark shield toggle and zero-dependency Node static dev server (`server.js`).
- **3-Stage Verification Suite** (`test_corpus.py`, `test_web.js`, `test_ui.js`, `run_tests.bat`, `run_tests.sh`):
  - Automated verification of corpus authenticity, 12 youth dilemma retrievals, 17 adversarial impersonation attacks, and headless JSDOM UI/vault flows.
- **Native Android App & APK Build Pipeline** (`android/`):
  - Offline WebView host (`MainActivity.java`) targeting API 35 (minSdk 21).
  - 13-method `@JavascriptInterface` native TTS/SpeechRecognizer bridge (`SpeechBridge.java`).
  - Standalone PowerShell APK compilation, dexing, alignment, and signing pipeline (`build_apk.ps1`) producing `android/dist/vivekmarg-mentor-debug.apk`.
