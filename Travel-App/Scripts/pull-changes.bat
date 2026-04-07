@echo off
echo ========================================
echo Pull Changes from GitHub
echo ========================================
echo.

cd /d "%~dp0app"

REM Check if git is initialized
if not exist ".git" (
    echo ERROR: Git not set up!
    echo Please run: setup-git-link.bat first
    pause
    exit /b
)

echo Pulling latest changes from GitHub...
git pull

if errorlevel 1 (
    echo.
    echo ERROR: Pull failed!
    echo This might be due to conflicts or authentication issues.
    pause
    exit /b
)

echo.
echo ========================================
echo SUCCESS! Local folder updated
echo ========================================
echo.
pause
