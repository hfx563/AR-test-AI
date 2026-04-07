@echo off
echo Starting Local Server...
echo.
echo Finding your IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    goto :found
)
:found
echo.
echo ========================================
echo Server is running!
echo ========================================
echo.
echo On this computer, open:
echo   http://localhost:8000
echo.
echo On your phone (same WiFi), open:
echo   http:%IP%:8000
echo.
echo Press Ctrl+C to stop
echo ========================================
echo.
cd /d "%~dp0app"
python -m http.server 8000
pause
