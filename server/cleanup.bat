@echo off
echo Cleaning up old dependencies and installing Gemini AI...
echo.

echo Removing node_modules folder...
if exist node_modules rmdir /s /q node_modules

echo Removing package-lock.json...
if exist package-lock.json del package-lock.json

echo.
echo Installing fresh dependencies including Gemini AI...
npm install

echo.
echo Dependencies installed successfully!
echo Gemini AI integration is ready.
echo You can now start the server with: npm start
pause
