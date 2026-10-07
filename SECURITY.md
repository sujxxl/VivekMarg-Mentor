# Security & Privacy Policy

## Privacy Architecture

VivekMarg Mentor is designed as a **local-first, zero-cloud** application:

- **No Backend or Telemetry**: User dilemmas, Socratic reflections, Sankalpa ledgers, and growth vectors are stored exclusively on-device in browser/WebView `localStorage`.
- **Passcode Vault (`www/account.js`)**: Passcodes are never stored in plaintext. Enrollment generates a 16-byte random salt and computes a salted `SHA-256` digest (`SHA-256("vivekmarg_mentor:" + salt + ":" + pin)`) using Node `crypto` or WebCrypto `SubtleCrypto`, with an `FNV-1a` fallback only for restricted environments lacking `SubtleCrypto`.
- **Android Permissions (`AndroidManifest.xml`)**:
  - `RECORD_AUDIO`: Used strictly for on-device voice reflection (`SpeechRecognizer`).
  - `VIBRATE`: Used for subtle haptic feedback via `SpeechBridge`.
  - `android:allowBackup="false"`: Prevents unencrypted cloud backup of local vault data.

## Ethical & Content Safety Guardrails

- **Anti-Impersonation (`www/socratic.js`)**: `IMPERSONATION_PATTERNS` and `SocraticCompanion.guard()` block 17 classes of first-person persona claims and verify sanitization in automated Stage 2 testing (`test_web.js`).

## Supported Versions

| Version | Supported |
|---|---|
| `1.0.x` | Yes |

## Reporting a Vulnerability

If you discover a security issue (e.g., XSS in the WebView, bridge injection in `SpeechBridge.java`, vault bypass, or guardrail evasion), please report it responsibly:

1. **Do not** open a public issue with exploit details.
2. Contact the maintainers privately with a clear description, reproduction steps, and affected files.
3. We will acknowledge receipt and work on a fix and regression test promptly.
