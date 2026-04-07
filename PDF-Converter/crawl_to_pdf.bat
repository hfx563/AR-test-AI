@echo off
title Website to PDF Converter
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1

echo.
echo ============================================================
echo   Website to PDF Converter
echo ============================================================
echo.

:: ── Check Python ─────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found.
    echo Please run SETUP.bat first to install all requirements.
    echo.
    pause
    exit /b 1
)

:: ── Check script exists ───────────────────────────────────────
if not exist "Scripts\crawl_to_pdf.py" (
    echo ERROR: Scripts\crawl_to_pdf.py not found.
    echo Make sure all files are in the correct folder.
    echo.
    pause
    exit /b 1
)

:: ── Run ──────────────────────────────────────────────────────
python Scripts\crawl_to_pdf.py
if errorlevel 1 (
    echo.
    echo Something went wrong. Check Scripts\*.log for details.
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   Done! Your PDF is saved in the location you selected.
echo ============================================================
echo.
pause
