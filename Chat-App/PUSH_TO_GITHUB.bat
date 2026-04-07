@echo off
set PATH=C:\Program Files\Git\cmd;C:\Program Files\Git\bin;%PATH%
cd /d "%~dp0"

echo Checking Git...
git --version
if errorlevel 1 (
    echo Git not found. Please install from https://git-scm.com
    pause
    exit /b 1
)

echo.
echo Initialising repository...
git init
git config user.name "abhiravgotra92"
git config user.email "abhiravgotra92@users.noreply.github.com"

echo.
echo Staging files...
git add .

echo.
echo Committing...
git commit -m "Initial commit - LiveChat app"

echo.
echo Setting branch to main...
git branch -M main

echo.
echo Adding remote...
git remote remove origin 2>nul
git remote add origin https://github.com/abhiravgotra92/livechat.git

echo.
echo Pushing to GitHub...
echo (A browser window or login prompt may appear - sign in with your GitHub account)
git push -u origin main

echo.
if errorlevel 1 (
    echo Push failed. Make sure you created the repo at:
    echo https://github.com/new  ^(name: livechat, Public^)
) else (
    echo SUCCESS! Now go to:
    echo https://github.com/abhiravgotra92/livechat/settings/pages
    echo Set Source to: GitHub Actions
    echo.
    echo Your chat will be live at:
    echo https://abhiravgotra92.github.io/livechat/
)
echo.
pause
