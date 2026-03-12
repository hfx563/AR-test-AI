@echo off
echo ========================================
echo Auto-Sync Changes to GitHub
echo ========================================
echo.

cd /d "%~dp0..\app"

REM Check if git is initialized
if exist ".git" (
    echo Git repository found!
    echo.
    echo Adding all changes...
    git add .
    
    echo.
    echo Committing changes...
    git commit -m "Auto-sync: Updated app files"
    
    if errorlevel 1 (
        echo No changes to commit.
    ) else (
        echo.
        echo Pushing to GitHub...
        git push
        
        if errorlevel 1 (
            echo.
            echo Push failed. Please check your connection or use GitHub Desktop.
        ) else (
            echo.
            echo ========================================
            echo SUCCESS! Changes synced to GitHub
            echo ========================================
            echo.
            echo Changes will be live in 1-2 minutes!
        )
    )
) else (
    echo.
    echo Git not initialized yet.
    echo.
    echo To enable auto-sync:
    echo 1. Run: setup-git-link.bat
    echo 2. Or use GitHub Desktop to publish repository
    echo.
    echo For now, your local files are updated.
    echo Use Netlify Drop to deploy manually.
)

echo.
pause
