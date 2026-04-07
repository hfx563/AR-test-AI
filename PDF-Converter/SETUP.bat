@echo off
title Website to PDF Converter - Setup
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1

echo.
echo ============================================================
echo   Website to PDF Converter - First Time Setup
echo ============================================================
echo.

:: ── Check Python ─────────────────────────────────────────────
echo [1/4] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Python is not installed or not on PATH.
    echo.
    echo Please install Python from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    echo After installing Python, run this setup again.
    echo.
    pause
    exit /b 1
)
python --version
echo Python found.
echo.

:: ── Upgrade pip ──────────────────────────────────────────────
echo [2/4] Upgrading pip...
python -m pip install --upgrade pip --quiet
echo Done.
echo.

:: ── Install Python packages ───────────────────────────────────
echo [3/4] Installing required Python packages...
echo This may take a few minutes on first run...
echo.
python -m pip install requests beautifulsoup4 fpdf2 lxml Pillow playwright
if errorlevel 1 (
    echo.
    echo ERROR: Failed to install Python packages.
    echo Check your internet connection and try again.
    echo.
    pause
    exit /b 1
)
echo.
echo Packages installed.
echo.

:: ── Install Playwright browser ────────────────────────────────
echo [4/4] Installing Chromium browser for Playwright...
echo This will download ~200MB on first run...
echo.
python -m playwright install chromium
if errorlevel 1 (
    echo.
    echo ERROR: Failed to install Playwright browser.
    echo Check your internet connection and try again.
    echo.
    pause
    exit /b 1
)
echo.

:: ── Verify script file ────────────────────────────────────────
if not exist "Scripts\crawl_to_pdf.py" (
    echo ERROR: Scripts\crawl_to_pdf.py not found.
    echo Make sure all project files are present.
    echo.
    pause
    exit /b 1
)

:: ── Done ──────────────────────────────────────────────────────
echo ============================================================
echo   Setup Complete! Everything is ready.
echo ============================================================
echo.
echo To convert a website to PDF, double-click:
echo   crawl_to_pdf.bat
echo.
echo Press any key to launch it now, or close this window.
pause >nul
call crawl_to_pdf.bat
