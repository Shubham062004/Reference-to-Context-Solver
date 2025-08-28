@echo off
echo Setting up Reference to Context Solver Server...
echo.

cd server
echo Installing Node.js dependencies...
npm install

echo.
echo Starting server...
echo Server will run on http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
npm start

pause
