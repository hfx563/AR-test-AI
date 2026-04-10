@echo off
title GreenEdge Landscaping App
color 0A
echo.
echo  ============================================
echo   GreenEdge Landscaping - Starting Server...
echo  ============================================
echo.
cd /d "%~dp0"
node --version
if %errorlevel% neq 0 (
  echo  ERROR: Node.js not found. Install from https://nodejs.org
  pause & exit /b 1
)
if exist "node_modules" rmdir /s /q node_modules
echo  Installing dependencies...
npm install
if %errorlevel% neq 0 ( echo  ERROR: npm install failed. & pause & exit /b 1 )
echo.
echo  Server starting at http://localhost:3000
echo  Admin password: artest
echo  Press Ctrl+C to stop.
echo.
timeout /t 2 /nobreak >nul
start "" http://localhost:3000
node server.js
echo. & echo  Server stopped. & pause
