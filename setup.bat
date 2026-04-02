@echo off
echo ========================================
echo Drivana Project Setup
echo ========================================
echo.

echo [1/4] Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Error installing backend dependencies
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Checking backend install...
call npm run build
if %errorlevel% neq 0 (
    echo Error building backend
    pause
    exit /b %errorlevel%
)

echo.
echo [3/4] Installing Frontend Dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies
    pause
    exit /b %errorlevel%
)

cd ..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start MongoDB on localhost:27017
echo 2. Update backend/.env with your database credentials
echo 3. Start backend: cd backend ^&^& npm run start:dev
echo 4. Start frontend: cd frontend ^&^& npm run dev
echo.
pause
