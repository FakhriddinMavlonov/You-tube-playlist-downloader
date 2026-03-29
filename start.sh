#!/bin/bash
mkdir -p ./tg-data
chmod +x ./telegram-bot-api

echo "🚀 Local Server ishga tushmoqda..."
./telegram-bot-api --api-id=33279940 --api-hash=ebec3314c624540f0591ec66eb021ca0 --local --http-port=8081 --dir=./tg-data &

sleep 15

echo "🤖 Bot ishga tushmoqda..."
node bot.js