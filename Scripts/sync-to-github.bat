@echo off
echo ========================================
echo Sync All Changes to GitHub
echo ========================================
echo.

cd /d "%~dp0app"

REM Check if GitHub Desktop is being used
if exist ".git" (
    echo Git repository detected!
    echo.
    echo Option 1: Use GitHub Desktop
    echo   1. Open GitHub Desktop
    echo   2. You'll see all changes listed
    echo   3. Enter commit message: "Updated app with security features"
    echo   4. Click "Commit to main"
    echo   5. Click "Push origin"
    echo.
    echo Option 2: Use Command Line
    set /p usecmd="Do you want to push via command line? (y/n): "
    if /i "%usecmd%"=="y" (
        echo.
        echo Adding all changes...
        git add .
        echo.
        echo Committing changes...
        git commit -m "Updated app with security features and cleaned up files"
        echo.
        echo Pushing to GitHub...
        git push
        echo.
        if errorlevel 1 (
            echo ERROR: Push failed. Please use GitHub Desktop instead.
            pause
            exit /b
        )
        echo ========================================
        echo SUCCESS! All changes pushed to GitHub
        echo ========================================
        echo.
        echo Changes will be live in 1-2 minutes!
        echo.
    ) else (
        echo.
        echo Please use GitHub Desktop to push changes.
        echo.
    )
) else (
    echo.
    echo Git not set up yet!
    echo.
    echo Please complete one of these first:
    echo 1. Run: setup-git-link.bat
    echo 2. Or use GitHub Desktop to add this folder
    echo.
)

pause
