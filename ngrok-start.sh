#!/bin/bash
# Start ngrok tunnel to nginx on port 80
# Requires ngrok to be installed: https://ngrok.com/download

echo "Starting Docker services..."
docker compose up -d --build

echo "Waiting for services to be healthy..."
sleep 10

echo "Starting ngrok tunnel on port 80..."
echo "Your public URL will appear below:"
ngrok http 80
