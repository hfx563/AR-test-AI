@echo off
echo ========================================
echo Git Setup - Link Local to GitHub
echo ========================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed!
    echo.
    echo Please install Git first:
    echo 1. Download from: https://git-scm.com/download/win
    echo 2. Run installer with default settings
    echo 3. Restart this script
    echo.
    pause
    exit /b
)

echo Git is installed! Version:
git --version
echo.

echo IMPORTANT: First create your GitHub repository
echo 1. Go to: https://github.com/new
echo 2. Repository name: travel-guide-app
echo 3. Make it PUBLIC
echo 4. DO NOT add README or .gitignore
echo 5. Click "Create repository"
echo.
set /p ready="Have you created the repository? (y/n): "
if /i not "%ready%"=="y" (
    echo Please create the repository first, then run this script again.
    pause
    exit /b
)

echo.
set /p username="Enter your GitHub username: "
echo.

echo Setting up Git in app folder...
cd /d "%~dp0app"

REM Initialize git if not already done
if not exist ".git" (
    echo Initializing Git repository...
    git init
    git branch -M main
) else (
    echo Git already initialized.
)

REM Configure git user (if not set globally)
git config user.name >nul 2>&1
if errorlevel 1 (
    set /p gitname="Enter your name for Git commits: "
    set /p gitemail="Enter your email for Git commits: "
    git config user.name "!gitname!"
    git config user.email "!gitemail!"
)

REM Add remote
git remote remove origin >nul 2>&1
git remote add origin https://github.com/%username%/travel-guide-app.git

echo.
echo Adding all files...
git add .

echo.
echo Creating initial commit...
git commit -m "Initial commit - Luxe Travel App"

echo.
echo Pushing to GitHub...
echo (You may need to login in your browser)
git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================
    echo AUTHENTICATION REQUIRED
    echo ========================================
    echo.
    echo If push failed, you need to authenticate:
    echo.
    echo Option 1: GitHub Desktop (Easiest)
    echo   - Download: https://desktop.github.com
    echo   - Login and clone your repository
    echo.
    echo Option 2: Personal Access Token
    echo   - Go to: https://github.com/settings/tokens
    echo   - Generate new token (classic)
    echo   - Select: repo (all permissions)
    echo   - Copy the token
    echo   - Use token as password when prompted
    echo.
    pause
    exit /b
)

echo.
echo ========================================
echo SUCCESS! Local folder linked to GitHub
echo ========================================
echo.
echo Your repository: https://github.com/%username%/travel-guide-app
echo.
echo Next: Enable GitHub Pages
echo 1. Go to: https://github.com/%username%/travel-guide-app/settings/pages
echo 2. Source: Deploy from branch
echo 3. Branch: main -^> / (root)
echo 4. Click Save
echo.
echo Your live URL will be:
echo https://%username%.github.io/travel-guide-app/
echo.
echo To push future changes, use: push-changes.bat
echo.
pause
