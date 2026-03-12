@echo off
echo ========================================
echo GitHub Upload Script for Luxe Travel
echo ========================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed!
    echo Please install Git from: https://git-scm.com/download/win
    pause
    exit /b
)

echo Step 1: Please create a new repository on GitHub
echo   1. Go to: https://github.com/new
echo   2. Repository name: travel-guide-app
echo   3. Make it PUBLIC
echo   4. DO NOT initialize with README
echo   5. Click "Create repository"
echo.
set /p username="Enter your GitHub username: "
echo.

echo Step 2: Initializing Git repository...
cd /d "%~dp0app"
git init
git add .
git commit -m "Initial commit - Luxe Travel App"
git branch -M main

echo.
echo Step 3: Connecting to GitHub...
git remote add origin https://github.com/%username%/travel-guide-app.git

echo.
echo Step 4: Pushing to GitHub...
echo You will be asked to login to GitHub in your browser...
git push -u origin main

echo.
echo ========================================
echo SUCCESS! Your app is uploaded to GitHub
echo ========================================
echo.
echo Next steps:
echo 1. Go to: https://github.com/%username%/travel-guide-app
echo 2. Click Settings -^> Pages
echo 3. Source: Deploy from branch
echo 4. Branch: main -^> /root
echo 5. Click Save
echo.
echo Your app will be live at:
echo https://%username%.github.io/travel-guide-app/
echo.
pause
