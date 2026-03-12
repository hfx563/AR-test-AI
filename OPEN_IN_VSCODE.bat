@echo off
echo ========================================
echo Opening VS Code with Your Project
echo ========================================
echo.

REM Check if VS Code is installed
where code >nul 2>&1
if errorlevel 1 (
    echo VS Code not found!
    echo.
    echo Please install VS Code first:
    echo 1. Download: https://code.visualstudio.com/download
    echo 2. Install with default settings
    echo 3. Restart computer
    echo 4. Run this script again
    echo.
    echo Opening download page...
    start "" "https://code.visualstudio.com/download"
    pause
    exit /b
)

echo Opening VS Code workspace...
code "%~dp0travel-guide-app.code-workspace"

echo.
echo ========================================
echo VS Code Opened!
echo ========================================
echo.
echo Next steps in VS Code:
echo 1. Click Source Control icon (left sidebar)
echo 2. Click "Initialize Repository"
echo 3. Click "Publish to GitHub"
echo 4. Sign in to GitHub
echo 5. Done! Auto-sync enabled
echo.
echo Full guide: Documentation\VS_CODE_SETUP.md
echo.
pause
