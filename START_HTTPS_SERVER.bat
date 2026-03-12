@echo off
echo Starting HTTPS Server with ngrok...
echo.
echo STEP 1: Starting local server on port 8000...
start /B python -m http.server 8000 -d "%~dp0app"
timeout /t 3 /nobreak >nul

echo.
echo STEP 2: Download ngrok from: https://ngrok.com/download
echo Extract ngrok.exe to this folder: %~dp0
echo.
echo STEP 3: Run this command in a new terminal:
echo    ngrok http 8000
echo.
echo You'll get an HTTPS URL like: https://abc123.ngrok.io
echo Open that URL on your iPhone - camera will work!
echo.
echo Press any key when done to stop server...
pause >nul
taskkill /F /IM python.exe >nul 2>&1
