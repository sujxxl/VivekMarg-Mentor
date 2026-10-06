@echo off
echo ==========================================================
echo   VIVEKMARG MENTOR (विवेकमार्ग मेंटर) - FULL TEST SUITE   
echo ==========================================================
echo.
echo >>> [STAGE 1/3] Running Corpus Authenticity Tests (test_corpus.py)...
python test_corpus.py
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo.
echo >>> [STAGE 2/3] Running Retrieval & Anti-Impersonation Tests (test_web.js)...
node test_web.js
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo.
echo >>> [STAGE 3/3] Running Headless UI, Dual-Canvas & Watermark Flow (test_ui.js)...
node test_ui.js
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo.
echo ==========================================================
echo   [SUCCESS] ALL VERIFICATION STAGES PASSED!               
echo ==========================================================
