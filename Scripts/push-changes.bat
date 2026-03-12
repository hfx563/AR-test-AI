@echo off
echo ========================================
echo Push Changes to GitHub
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

echo Checking for changes...
git status

echo.
set /p message="Enter commit message (or press Enter for default): "
if "%message%"=="" set message="Update app"

echo.
echo Adding changes...
git add .

echo.
echo Committing changes...
git commit -m "%message%"

if errorlevel 1 (
    echo No changes to commit.
    pause
    exit /b
)

echo.
echo Pushing to GitHub...
git push

if errorlevel 1 (
    echo.
    echo ERROR: Push failed!
    echo Try running: git push -u origin main
    pause
    exit /b
)

echo.
echo ========================================
echo SUCCESS! Changes pushed to GitHub
echo ========================================
echo.
echo Your changes will be live in 1-2 minutes at:
git remote get-url origin
echo.
pause
