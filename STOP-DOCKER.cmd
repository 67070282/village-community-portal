@echo off
cd /d "%~dp0"
docker compose stop
echo Containers stopped. Your database records have been kept.
pause
