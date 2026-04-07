@echo off
echo Starting Local Web Server...
echo.
echo Your site will be available at:
echo   - On this PC: http://localhost:8000
echo   - On network: http://YOUR_IP:8000
echo.
echo To find your IP: Open Command Prompt and type "ipconfig"
echo Look for "IPv4 Address"
echo.
echo Press Ctrl+C to stop the server
echo.
cd /d "%~dp0app"
python -m http.server 8000
pause
