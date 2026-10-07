# Contributing to VivekMarg Mentor

Thank you for your interest in contributing to **VivekMarg Mentor (विवेकमार्ग मेंटर)**. This project is built around offline reliability, zero external runtime dependencies, and strict philosophical authenticity.

## Core Design Invariants

Please preserve the following invariants in all changes:

1. **Zero External Runtime Dependencies**: Core web modules in `www/` must remain vanilla JavaScript/HTML/CSS that run cleanly offline in both browsers and Android WebView (`file:///android_asset/www/index.html`).
2. **Verbatim Corpus Authenticity**: Never alter, paraphrase, or fabricate public-domain passages in `corpus.json`, `www/corpus_data.js`, or `www/corpus.js`. Every chunk must carry accurate Advaita Ashrama citation metadata (`volume`, `page`, `chapterRoman`, `title`).
3. **Anti-Impersonation Guardrail**: Any Socratic prompt or generated response must pass `SocraticCompanion.guard()` and never impersonate Swami Vivekananda in first person.
4. **Zero Quote Duplication**: Socratic questions must reference *"the passage"* rather than echoing verbatim text already shown in the source stream.
5. **Android Asset Synchronization**: Whenever files inside `www/` are modified, sync the updated files to `android/app/src/main/assets/www/` before rebuilding or committing Android changes.

## Development Workflow

1. Fork the repository and create a feature branch (`git checkout -b feat/your-feature`).
2. Make your changes following `.editorconfig` formatting conventions.
3. Run the full 3-stage verification suite before opening a pull request:
   ```bash
   npm test
   ```
   All three stages must pass:
   - Stage 1: `python test_corpus.py`
   - Stage 2: `node test_web.js`
   - Stage 3: `node test_ui.js`
4. If modifying Android Java sources (`MainActivity.java`, `SpeechBridge.java`) or manifest/resources, verify the APK build via:
   ```bash
   npm run build:apk
   ```
5. Use clear Conventional Commit messages (`feat(...)`, `fix(...)`, `docs(...)`, `test(...)`, `build(...)`).

## Reporting Issues

When opening an issue, please include:
- Environment details (OS, browser or Android API level, Node/Python versions)
- Steps to reproduce or the specific youth dilemma / locale affected
- Relevant console output or failing test stage
