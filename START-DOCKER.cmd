@echo off
setlocal
cd /d "%~dp0"
where docker >nul 2>nul
if errorlevel 1 (
  echo Install Docker Desktop first: https://www.docker.com/products/docker-desktop/
  pause
  exit /b 1
)
docker info >nul 2>nul
if errorlevel 1 (
  echo Open Docker Desktop and wait until the engine is running, then try again.
  pause
  exit /b 1
)
if not exist .env (
  powershell.exe -NoProfile -Command "$ErrorActionPreference='Stop'; function New-Secret { $bytes=New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); return [Convert]::ToBase64String($bytes) }; $lines=@('APP_PORT=3000',('MYSQL_PASSWORD='+(New-Secret)),('MYSQL_ROOT_PASSWORD='+(New-Secret)),('JWT_SECRET='+(New-Secret)),'DB_CLIENT=mysql'); [IO.File]::WriteAllLines((Join-Path (Get-Location) '.env'),$lines,(New-Object Text.UTF8Encoding($false)))"
  if errorlevel 1 (
    echo Could not create .env. Copy .env.example to .env and set the three secrets.
    pause
    exit /b 1
  )
)
docker compose up -d --build --wait --wait-timeout 180
if errorlevel 1 (
  echo Startup failed. Recent logs:
  docker compose logs --tail 40
  pause
  exit /b 1
)
echo.
echo Village Community Portal is running with MySQL.
echo Default URL: http://127.0.0.1:3000
echo Run STOP-DOCKER.cmd to stop. Database records are kept in the Docker volume.
pause
