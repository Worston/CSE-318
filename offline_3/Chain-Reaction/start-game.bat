@echo off
REM Chain Reaction Game Startup Script for Windows

echo ================================================
echo          CHAIN REACTION GAME LAUNCHER           
echo ================================================
echo.

REM Check for required tools
echo Checking requirements...

REM Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Error: Node.js is not installed. Please install Node.js to run this game.
  exit /b 1
) else (
  for /f "tokens=* usebackq" %%a in (`node -v`) do set NODE_VERSION=%%a
  echo ✓ Node.js %NODE_VERSION% found
)

REM Check for npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Error: npm is not installed. Please install npm to run this game.
  exit /b 1
) else (
  for /f "tokens=* usebackq" %%a in (`npm -v`) do set NPM_VERSION=%%a
  echo ✓ npm %NPM_VERSION% found
)

REM Check for Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Error: Python 3 is not installed. Please install Python 3 to run this game.
  exit /b 1
) else (
  for /f "tokens=* usebackq" %%a in (`python --version`) do set PYTHON_VERSION=%%a
  echo ✓ %PYTHON_VERSION% found
)

echo All requirements satisfied!
echo.

REM Navigate to Frontend directory and install dependencies if needed
echo Installing game dependencies...
cd Frontend || (
  echo Error: Frontend directory not found.
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing npm packages (this may take a few moments)...
  npm install
) else (
  echo Dependencies already installed.
)

echo.

REM Start the game
echo Starting Chain Reaction game...
echo ----------------------------------------
echo The game will open in your default browser.
echo If it doesn't open automatically, go to: http://localhost:5173
echo ----------------------------------------
echo.

REM Use the start script which runs both servers concurrently
npm start

REM Exit gracefully
echo.
echo Game servers stopped. Thanks for playing!
