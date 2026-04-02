@echo off
echo Starting Docker services...
docker compose up -d --build

echo Waiting for services to be healthy...
timeout /t 10

echo Starting ngrok tunnel on port 80...
echo Your public URL will appear below:
ngrok http 80
